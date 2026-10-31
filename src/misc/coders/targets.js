// Codecs a Restreamer process may target. Every hardware coder that the
// connected ffmpeg reports for one of these codecs becomes selectable in the
// UI; the per-coder availability check is done against the core's skills.
const targetCodecs = ['h264', 'hevc', 'av1', 'vp9'];

// MPEG-TS cannot carry these codecs, so their HLS output has to be fMP4.
const fmp4OnlyCodecs = ['hevc', 'av1', 'vp9'];

const codecOfCoder = (coder) => {
	const name = `${coder}`;

	for (const codec of fmp4OnlyCodecs) {
		if (name.startsWith(codec)) {
			return codec;
		}
	}

	return 'h264';
};

const isFmp4OnlyCoder = (coder) => fmp4OnlyCodecs.some((codec) => `${coder}`.startsWith(codec));

export { targetCodecs, fmp4OnlyCodecs, codecOfCoder, isFmp4OnlyCoder };
