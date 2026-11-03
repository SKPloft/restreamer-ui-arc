# Restreamer-UI

The user interface of the Restreamer for the connection to the [datarhei Core](https://github.com/datarhei/core)application.

- React
- Material-UI (MUI)

## Development

### For the Restreamer interface:

```
$ git clone github.com/datarhei/restreamer-ui
$ cd restreamer-ui
$ yarn install
$ npm run start
```

Connect the UI with a [datarhei Core](https://github.com/datarhei/core):
http://localhost:3000?address=http://core-ip:core-port

### To add/fix translations:
Locales are located in `src/locals`
```
$ npm run i18n-extract:clean
$ npm run i18n-compile
```

## Players and the HLS engine

All three playback surfaces (channel preview in the SPA, the channel player page and the
playersite) use video.js, but play HLS with `hls.js` through one source handler,
[`src/misc/Player/hlsSourceHandler.js`](./src/misc/Player/hlsSourceHandler.js). video.js keeps
the controls, skins, overlay, AirPlay, Chromecast and license plugins; Safari and iOS keep
their native HLS stack.

`yarn player-dist` copies the handler to `public/_player/videojs/dist/videojs-hlsjs.js`,
together with `hls.min.js`; it also runs as `prebuild`. Both files are listed in
`public/_player/videojs/files.txt`, the manifest the core uploads for the public player.
Do not edit the copies in `dist/`: change the handler in `src/` and run the script again.

```
$ yarn player-dist
```

Background, codec matrix and acceptance status: [docs/av1-preview-audit.md](./docs/av1-preview-audit.md).

## License
See the [LICENSE](./LICENSE) file for licensing information.
