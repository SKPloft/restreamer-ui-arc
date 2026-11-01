import SemverSatisfies from 'semver/functions/satisfies';

// Every media source is a plain ffmpeg invocation, so the version gate only
// protects against majors nobody has run yet. Keep it in one place: a stale
// list here hides the whole source picker (see the ffmpeg 8 incident), and
// two copies of it mean the wizard and the edit dialog can disagree.
export const SOURCE_FFVERSION = '^4.1.0 || ^5.0.0 || ^6.1.0 || ^7.0.0 || ^8.0.0 || ^9.0.0';

export const FfmpegSatisfies = (version, constraint) => {
	return SemverSatisfies(version || '0.0.0', constraint);
};
