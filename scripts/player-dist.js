#!/usr/bin/env node

/*
 * Copies the browser builds that the public player pages load from the
 * restreamer into `public/_player/videojs/dist`:
 *
 * - `hls.min.js`        the HLS engine, version pinned by `hls.js` in package.json
 * - `hls.min.js.LICENSE.txt` the hls.js copyright notice followed by the full
 *                       Apache 2.0 license text
 * - `videojs-hlsjs.js`  the shared video.js source handler, the same file the
 *                       SPA imports from `src/misc/Player/hlsSourceHandler.js`
 *
 * The files are listed in `public/_player/videojs/files.txt`, which is what the
 * UI uploads to the restreamer when the public player is enabled.
 *
 * Run with `yarn player-dist`; also runs before `yarn build`.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'public', '_player', 'videojs', 'dist');

// [source, destination in public/_player/videojs, strip source map comment]
const files = [
	['src/misc/Player/hlsSourceHandler.js', 'videojs-hlsjs.js', false],
	['node_modules/hls.js/dist/hls.min.js', 'hls.min.js', true],
];

// hls.js ships no copyright header in its minified build, so the upstream
// notice and the full Apache 2.0 text are published next to it.
const licenseFiles = ['node_modules/hls.js/LICENSE', 'LICENSE'];

const sourceMapComment = /\n?\/\/# sourceMappingURL=.*\s*$/;

for (const [from, to, stripSourceMap] of files) {
	const source = path.join(root, from);
	const destination = path.join(target, to);

	let contents = fs.readFileSync(source, 'utf8');

	if (stripSourceMap) {
		// the map is not copied, so the browser should not ask for it
		contents = contents.replace(sourceMapComment, '\n');
	}

	fs.writeFileSync(destination, contents);

	console.log('%s -> %s (%d bytes)', from, path.relative(root, destination), Buffer.byteLength(contents));
}

const licenseContents = licenseFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n\n');
const licenseDestination = path.join(target, 'hls.min.js.LICENSE.txt');

fs.writeFileSync(licenseDestination, licenseContents);

console.log(
	'%s -> %s (%d bytes)',
	licenseFiles.join(' + '),
	path.relative(root, licenseDestination),
	Buffer.byteLength(licenseContents),
);
