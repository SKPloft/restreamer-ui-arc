import SemverSatisfies from 'semver/functions/satisfies';

import Sources from './index';

// Every source is a plain ffmpeg invocation, so the version whitelist only
// guards against majors we never ran. Anything below blocks the whole source
// picker in the edit dialog ("No sources available"), which is what happened
// with ffmpeg 8.
const SUPPORTED = ['4.4.2', '5.1.2', '6.1.1', '7.0.2', '7.1.1', '8.0.1', '8.1.1', '9.0.0'];

test.each(Sources.List().map((s) => [s.id, s.ffversion]))('%s accepts ffmpeg 4.x to 9.x', (id, ffversion) => {
	const rejected = SUPPORTED.filter((version) => !SemverSatisfies(version, ffversion));

	expect({ id, rejected }).toEqual({ id, rejected: [] });
});
