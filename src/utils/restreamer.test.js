import * as Encoders from '../misc/coders/Encoders';
import * as M from './metadata';
import Restreamer from './restreamer';

// The regression covered here is the emitted ingest output of `UpsertIngest`:
// the effective output codec decides the HLS container, and the AAC bitstream
// filter must only be applied to a copied AAC stream.

const CHANNEL = {
	http: { host: 'localhost:8080', secure: false },
	hostname: 'localhost',
	source: { network: { rtmp: { enabled: false }, srt: { enabled: false } } },
};

const makeControl = ({ lhls = false, version = 3 } = {}) => {
	return {
		process: { autostart: false, reconnect: false, delay: 5, staleTimeout: 30 },
		limits: { cpu_usage: 0, memory_mbytes: 0, waitfor_seconds: 0 },
		rtmp: { enable: false },
		srt: { enable: false },
		hls: { lhls, version, storage: 'memfs', master_playlist: true, segmentDuration: 2, listSize: 6, cleanup: true },
	};
};

// Source 1 has several streams so that a non-zero source and stream index is
// selected, like it happens after probing a Multi-Stream input.
const makeSources = () => {
	return [
		M.initSource('video', {
			inputs: [{ address: 'rtmp://first/channel', options: [] }],
			streams: [{ index: 0, stream: 0, type: 'video', codec: 'h264', width: 1280, height: 720 }],
		}),
		M.initSource('video', {
			inputs: [{ address: 'rtmp://second/channel', options: [] }],
			streams: [
				{ index: 0, stream: 0, type: 'video', codec: 'h264', width: 1920, height: 1080 },
				{ index: 0, stream: 1, type: 'audio', codec: 'aac', sampling_hz: 48000, channels: 2 },
				{ index: 0, stream: 2, type: 'video', codec: 'av1', width: 1920, height: 1080 },
				{ index: 0, stream: 3, type: 'audio', codec: 'mp3', sampling_hz: 44100, channels: 2 },
			],
		}),
	];
};

const makeProfile = (sources, { video, audio }) => {
	const videoDefaults = Encoders.Video.Get(video.coder).defaults(sources[video.source].streams[video.stream], {});
	const audioDefaults = Encoders.Audio.Get(audio.coder).defaults(sources[audio.source].streams[audio.stream], {});

	return M.initProfile({
		video: {
			source: video.source,
			stream: video.stream,
			encoder: { coder: video.coder, settings: videoDefaults.settings, mapping: videoDefaults.mapping },
		},
		audio: {
			source: audio.source,
			stream: audio.stream,
			encoder: { coder: audio.coder, settings: audioDefaults.settings, mapping: audioDefaults.mapping },
		},
	});
};

// A fresh Restreamer with a selected channel and a captured upsert process.
const createRestreamer = () => {
	window.localStorage.setItem('@@restreamer-ui@@updates', 'false');

	const restreamer = new Restreamer('http://localhost:8080');
	restreamer.config = CHANNEL;
	restreamer.SelectChannel(restreamer.CreateChannel('Livestream'));

	let proc = null;
	restreamer._upsertProcess = async (id, p) => {
		proc = p;
		return [{}, null];
	};

	return {
		restreamer,
		channelid: restreamer.channel.channelid,
		proc: () => proc,
	};
};

const ingest = async ({ video, audio, control }) => {
	const { restreamer, channelid, proc } = createRestreamer();
	const sources = makeSources();
	const profile = makeProfile(sources, { video, audio });
	const [global, inputs, outputs] = M.createInputsOutputs(sources, [profile], true);

	const [, err] = await restreamer.UpsertIngest(channelid, global, inputs, outputs, control);
	expect(err).toBeNull();

	return { channelid, output: proc().output[0] };
};

const valueOf = (options, name) => options[options.indexOf(name) + 1];
const patterns = (output) => output.cleanup.map((c) => c.pattern);

test('AV1 pass-through of a non-zero source/stream is emitted as fMP4 HLS', async () => {
	const { channelid, output } = await ingest({
		video: { source: 1, stream: 2, coder: 'copy' },
		audio: { source: 1, stream: 3, coder: 'copy' },
		control: makeControl(),
	});

	// the selected streams (2 = AV1 video, 3 = MP3 audio) are mapped
	expect(valueOf(output.options, '-map')).toBe('0:2');
	expect(output.options).toEqual(expect.arrayContaining(['-map', '0:3']));

	expect(valueOf(output.options, '-hls_segment_type')).toBe('fmp4');
	expect(valueOf(output.options, '-hls_fmp4_init_filename')).toBe(`${channelid}.mp4`);
	expect(valueOf(output.options, '-hls_segment_filename')).toMatch(/\.mp4$/);

	// segment and init cleanup agree with the emitted fMP4 files
	expect(patterns(output)).toEqual(expect.arrayContaining([expect.stringMatching(/\.mp4$/), `${'memfs'}:/${channelid}.mp4`]));
});

test('a copied MP3 stream gets no AAC bitstream filter', async () => {
	const { output } = await ingest({
		video: { source: 1, stream: 2, coder: 'copy' },
		audio: { source: 1, stream: 3, coder: 'copy' },
		control: makeControl(),
	});

	expect(output.options).not.toContain('-bsf:a');
});

test('an MP3 transcode gets no AAC bitstream filter although the video is copied', async () => {
	const { output } = await ingest({
		video: { source: 1, stream: 2, coder: 'copy' },
		audio: { source: 1, stream: 3, coder: 'libmp3lame' },
		control: makeControl(),
	});

	expect(output.options).toEqual(expect.arrayContaining(['-codec:v', 'copy']));
	expect(output.options).not.toContain('-bsf:a');
});

test('a copied AAC stream keeps the AAC bitstream filter on the forced fMP4 variant', async () => {
	const { output } = await ingest({
		video: { source: 1, stream: 2, coder: 'copy' },
		audio: { source: 1, stream: 1, coder: 'copy' },
		control: makeControl(),
	});

	expect(valueOf(output.options, '-hls_segment_type')).toBe('fmp4');
	expect(output.options).toEqual(expect.arrayContaining(['-bsf:a', 'aac_adtstoasc']));
});

test('H.264 pass-through keeps the configured MPEG-TS HLS', async () => {
	const { channelid, output } = await ingest({
		video: { source: 1, stream: 0, coder: 'copy' },
		audio: { source: 1, stream: 3, coder: 'copy' },
		control: makeControl({ version: 3 }),
	});

	expect(output.options).not.toContain('-hls_segment_type');
	expect(valueOf(output.options, '-hls_segment_filename')).toMatch(/\.ts$/);
	expect(patterns(output).some((p) => p.endsWith('.ts'))).toBe(true);
	expect(patterns(output)).not.toContain(`memfs:/${channelid}.mp4`);
	expect(output.options).not.toContain('-bsf:a');
});

test('low latency HLS keeps its DASH/CMAF output for an AV1 pass-through', async () => {
	const { output } = await ingest({
		video: { source: 1, stream: 2, coder: 'copy' },
		audio: { source: 1, stream: 1, coder: 'copy' },
		control: makeControl({ lhls: true, version: 7 }),
	});

	expect(valueOf(output.options, '-f')).toBe('dash');
	expect(valueOf(output.options, '-lhls')).toBe('1');
	expect(output.options).not.toContain('-hls_segment_type');
	expect(output.options).not.toContain('-bsf:a');
});
