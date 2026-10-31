// Build the ingest addresses split into the fields that clients such as OBS
// ask for (server + stream key / stream ID + passphrase).
//
// Hosts are expected to already carry the port, as built in
// utils/restreamer.js (config.source.network.*.host) and in the app config
// (config.rtmp.host / config.srt.host).
export const BuildIngestFields = (channelid, rtmp, srt) => {
	const rtmpHost = (rtmp && rtmp.host) || '';
	const rtmpApp = (rtmp && rtmp.app) || '';
	const rtmpToken = (rtmp && rtmp.token) || '';

	const srtHost = (srt && srt.host) || '';
	const srtToken = (srt && srt.token) || '';

	return {
		rtmp: {
			enabled: !!(rtmp && rtmp.enabled),
			server: 'rtmp' + (rtmp && rtmp.secure ? 's' : '') + '://' + rtmpHost + rtmpApp,
			key: channelid + '.stream' + (rtmpToken.length !== 0 ? '?token=' + rtmpToken : ''),
		},
		srt: {
			enabled: !!(srt && srt.enabled),
			server: 'srt://' + srtHost,
			streamid: channelid + ',mode:request' + (srtToken.length !== 0 ? ',token:' + srtToken : ''),
			passphrase: (srt && srt.passphrase) || '',
		},
	};
};
