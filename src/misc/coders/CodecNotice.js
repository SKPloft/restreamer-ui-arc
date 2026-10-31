import React from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { Trans } from '@lingui/macro';

// Short summary of what the selected output codec can and cannot do. The
// limitations live next to the choice instead of only in the documentation.
function CodecNotice(props) {
	const codec = props.codec;
	const coder = `${props.coder || ''}`;
	const hardware = /_(vaapi|qsv|nvenc|videotoolbox|omx|v4l2m2m)$/.test(coder);

	let text = null;

	switch (codec) {
		case 'h264':
			text = <Trans>H.264 can be used for HLS, RTMP publishing and any player.</Trans>;
			break;
		case 'hevc':
			text = (
				<Trans>HEVC is written as fMP4 HLS. RTMP publishing does not support it and browser playback is limited.</Trans>
			);
			break;
		case 'av1':
			text = (
				<Trans>
					AV1 is written as fMP4 HLS. RTMP publishing does not support it, Safari cannot play it and the Intel QSV
					encoder requires disabled B-frames.
				</Trans>
			);
			break;
		case 'vp9':
			text = (
				<Trans>VP9 is written as fMP4 HLS. RTMP publishing does not support it and Safari cannot play it.</Trans>
			);
			break;
		default:
			return null;
	}

	return (
		<Grid item xs={12}>
			<Typography variant="body2" sx={{ color: 'text.secondary' }}>
				{text}
				{hardware && (
					<>
						{' '}
						<Trans>Hardware coders need the matching device and driver (VAAPI: /dev/dri, QSV: oneVPL runtime).</Trans>
					</>
				)}
			</Typography>
		</Grid>
	);
}

CodecNotice.defaultProps = {
	codec: null,
	coder: null,
};

export default CodecNotice;
