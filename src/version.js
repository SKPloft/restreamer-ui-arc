import pkg from '../package.json';

const Core = '^16.11.0';
// Restreamer bundles ffmpeg 8.0.x and the dev images ship 8.1.x; 7.0 and 9.0 are
// listed by upstream's dev UI for the same reason.
const FFmpeg = '^5.1.0 || ^6.1.0 || ^7.0.0 || ^8.0.0 || ^9.0.0';
const UI = pkg.bundle ? pkg.bundle : pkg.name + ' v' + pkg.version;
const Version = pkg.version;

export { Core, FFmpeg, UI, Version };
