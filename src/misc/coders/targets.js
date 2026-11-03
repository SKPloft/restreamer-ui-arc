// Codecs a Restreamer process may target. Every hardware coder that the
// connected ffmpeg reports for one of these codecs becomes selectable in the
// UI; the per-coder availability check is done against the core's skills.
const targetCodecs = ['h264', 'hevc', 'av1', 'vp9'];

// HLS variants for these codecs have to be fMP4. MPEG-TS has no AV1 mapping at
// all, and browsers do not demux HEVC/VP9 from MPEG-TS either. ffmpeg itself
// can mux HEVC into MPEG-TS, but such a variant is not playable in a browser.
const fmp4OnlyCodecs = ['hevc', 'av1', 'vp9'];

// Matches the exact codec name, not an encoder name: `libx265`, `libvpx-vp9`
// and `librav1e` are encoder names and say nothing about the output codec,
// which is why the ingest output codec is resolved via the coder registry and
// the selected source stream instead of the ffmpeg options.
const isFmp4OnlyCodec = (codec) => fmp4OnlyCodecs.includes(`${codec}`.toLowerCase());

export { targetCodecs, fmp4OnlyCodecs, isFmp4OnlyCodec };
