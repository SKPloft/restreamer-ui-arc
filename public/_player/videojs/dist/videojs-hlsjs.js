/**
 * video.js HTML5 source handler that plays HLS with hls.js.
 *
 * video.js bundles VHS, whose fMP4 codec probe only accepts bare four
 * character codes (av01, vp09, hvc1). A master playlist without the complete
 * CODECS string therefore makes VHS exclude an otherwise decodable variant
 * before it creates a SourceBuffer (`excludePlaylist`, zero frames), and the
 * player reports a media error (CODE 3). hls.js reads the actual segments, so
 * the codec support of the browser decides.
 *
 * video.js stays the player (controls, skins, overlay, AirPlay, Chromecast,
 * license). Only the HLS engine is replaced.
 *
 * The same file is used by the SPA (webpack import) and by the public player
 * pages (plain `<script>`), so the handler exists once and not as two copies
 * of the same logic. `scripts/player-dist.js` copies it into
 * `public/_player/videojs/dist/`.
 *
 * Usage:
 *   RestreamerHls.createHlsSourceHandler(videojs, Hls);
 */
(function (root, factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.RestreamerHls = factory();
	}
})(typeof window !== 'undefined' ? window : this, function () {
	const HLS_TYPE = 'application/x-mpegurl';
	const HLS_TYPES = [HLS_TYPE, 'application/vnd.apple.mpegurl', 'audio/mpegurl', 'audio/x-mpegurl'];
	const HLS_EXTENSION = '.m3u8';

	// video.js/HTML5 MediaError codes
	const ERROR_NETWORK = 2;
	const ERROR_DECODE = 3;
	const ERROR_SRC_NOT_SUPPORTED = 4;
	const ERROR_ENCRYPTED = 5;

	/**
	 * Strip parameters and normalize the case so that the mime type can be
	 * compared with the known HLS types.
	 */
	function normalizeType(type) {
		if (!type) {
			return '';
		}

		return String(type).split(';')[0].trim().toLowerCase();
	}

	function isHlsType(type) {
		return HLS_TYPES.indexOf(normalizeType(type)) !== -1;
	}

	/**
	 * True for a source URL that looks like an HLS playlist. Query and
	 * fragment are ignored, the path check is case insensitive.
	 */
	function isHlsUrl(url) {
		if (!url) {
			return false;
		}

		let path = String(url).split('#')[0].split('?')[0];
		path = path.toLowerCase();

		return path.slice(-HLS_EXTENSION.length) === HLS_EXTENSION;
	}

	function errorCodeFor(data) {
		const type = data && data.type;

		if (type === 'networkError') {
			return ERROR_NETWORK;
		}

		if (type === 'keySystemError') {
			return ERROR_ENCRYPTED;
		}

		if (type === 'mediaError') {
			return ERROR_DECODE;
		}

		// Codec/container the browser cannot decode (e.g. a manifest with an
		// unsupported codec) ends up as "source not supported".
		return ERROR_SRC_NOT_SUPPORTED;
	}

	function errorMessageFor(data) {
		const parts = ['HLS'];

		if (data.details) {
			parts.push(data.details);
		}

		if (data.reason) {
			parts.push(data.reason);
		} else if (data.response && data.response.code) {
			parts.push('HTTP ' + data.response.code);
		}

		return parts.join(': ');
	}

	/**
	 * Register the source handler on the Html5 tech.
	 *
	 * @param {Object} videojs video.js instance
	 * @param {Object} Hls hls.js constructor
	 * @return {Object} the registered source handler
	 */
	function createHlsSourceHandler(videojs, Hls) {
		if (!videojs || typeof videojs.getTech !== 'function') {
			throw new Error('hls source handler: video.js is missing');
		}

		if (!Hls || typeof Hls.isSupported !== 'function' || !Hls.Events) {
			throw new Error('hls source handler: hls.js is missing');
		}

		const Html5 = videojs.getTech('Html5');
		if (!Html5 || typeof Html5.registerSourceHandler !== 'function') {
			throw new Error('hls source handler: the Html5 tech is not available');
		}

		if (Html5.hlsJsSourceHandler) {
			// already registered (script/entry point loaded twice)
			return Html5.hlsJsSourceHandler;
		}

		const nativeSourceHandler = Html5.nativeSourceHandler;
		const browser = videojs.browser || {};

		/**
		 * Safari and iOS have a native HLS stack with AirPlay and hardware
		 * decoding, so they keep it. `canPlayType` alone cannot decide this:
		 * Chrome reports 'maybe' for 'application/x-mpegURL' without being able
		 * to play HLS, and declining would only hand the source back to VHS.
		 */
		function nativeHlsAvailable(type) {
			if (!browser.IS_ANY_SAFARI && !browser.IS_IOS) {
				return false;
			}

			if (!nativeSourceHandler || typeof nativeSourceHandler.canPlayType !== 'function') {
				return false;
			}

			return !!nativeSourceHandler.canPlayType(type) || !!nativeSourceHandler.canPlayType('application/vnd.apple.mpegurl');
		}

		function canPlayType(type) {
			if (!isHlsType(type)) {
				return '';
			}

			if (!Hls.isSupported()) {
				return '';
			}

			if (nativeHlsAvailable(normalizeType(type))) {
				return '';
			}

			return 'maybe';
		}

		/**
		 * One hls.js instance per source. video.js calls `dispose` when the
		 * source changes or the tech is disposed.
		 */
		function handleSource(source, tech) {
			// looked up the same way video.js' own VHS handler does it
			const player = videojs.getPlayer(tech.options_.playerId);

			// liveDurationInfinity: video.js only activates its live UI
			// (liveui, live window, seek-to-live) for a duration of Infinity,
			// otherwise hls.js reports the finite playlist edge as duration.
			const hls = new Hls({ liveDurationInfinity: true });
			let disposed = false;
			let pendingError = null;

			// video.js clears the player error in its own `loadstart` handler
			// (handleTechLoadStart_ -> error(null)) and fires the player event
			// afterwards, so this runs on the cleared state. Registered once per
			// source, not once per fatal error.
			const reapplyError = () => {
				if (!disposed && pendingError) {
					player.error(pendingError);
				}
			};

			player.one('loadstart', reapplyError);

			const onError = (event, data) => {
				if (disposed || !data || data.fatal !== true) {
					// hls.js recovers from non-fatal errors on its own
					return;
				}

				// no retry loop of our own: stop the engine and let the
				// video.js error display tell the viewer what happened
				try {
					hls.stopLoad();
				} catch (e) {
					// engine already torn down
				}

				const error = {
					code: errorCodeFor(data),
					message: errorMessageFor(data),
				};

				// player.error is the only working setter here: on the Html5 tech
				// `error` is the read-only HTMLMediaElement getter, so
				// tech.error(obj) silently does nothing. Keep the error for the
				// loadstart that clears it again, and show it right away.
				pendingError = error;
				player.error(error);
			};

			// hls.js points the media element at its own blob: URL and video.js
			// records that URL as the current source; remote targets (Chromecast)
			// cannot play a blob: URL. video.js fires its `sourceset` after it
			// updated the source cache, so replay the playlist whenever the
			// recorded source is a blob.
			const onSourceset = () => {
				if (disposed) {
					return;
				}

				const current = player.currentSource();
				if (!current || !/^blob:/.test(current.src || '')) {
					return;
				}

				tech.triggerSourceset(source.src);
			};

			hls.on(Hls.Events.ERROR, onError);

			hls.loadSource(source.src);
			hls.attachMedia(tech.el());

			player.on('sourceset', onSourceset);

			const handler = {
				dispose: function () {
					if (disposed) {
						return;
					}

					disposed = true;
					pendingError = null;

					hls.off(Hls.Events.ERROR, onError);

					player.off('loadstart', reapplyError);
					player.off('sourceset', onSourceset);

					// detaches the MediaSource and drops the element src again
					hls.destroy();

					if (tech.hlsjs === handler) {
						tech.hlsjs = null;
					}
				},
			};

			return handler;
		}

		const sourceHandler = {
			name: 'restreamer-hlsjs',

			canPlayType: canPlayType,

			canHandleSource: function (source) {
				if (!source) {
					return '';
				}

				if (source.type) {
					return canPlayType(source.type);
				}

				return isHlsUrl(source.src) ? canPlayType(HLS_TYPE) : '';
			},

			handleSource: function (source, tech) {
				tech.hlsjs = handleSource(source, tech);
				return tech.hlsjs;
			},
		};

		// before VHS and the native handler: this source handler decides first,
		// and declines whenever native HLS playback is available
		Html5.registerSourceHandler(sourceHandler, 0);
		Html5.hlsJsSourceHandler = sourceHandler;

		return sourceHandler;
	}

	return {
		createHlsSourceHandler: createHlsSourceHandler,
	};
});
