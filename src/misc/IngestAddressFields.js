import React from 'react';

import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CopyButton from './CopyButton';

function AddressField(props) {
	return (
		<Grid item xs={12}>
			<Stack direction="row" spacing={1} alignItems="center">
				<Typography variant="body2" sx={{ minWidth: '6em', color: 'text.secondary' }}>
					{props.label}
				</Typography>
				<Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flexGrow: 1 }}>
					{props.value}
				</Typography>
				<CopyButton size="small" value={props.value}>
					<Trans>Copy</Trans>
				</CopyButton>
			</Stack>
		</Grid>
	);
}

AddressField.defaultProps = {
	label: null,
	value: '',
};

// Renders the ingest addresses split into separate fields, for clients that
// cannot take the full URL (OBS and friends).
//
// props.fields: the object returned by BuildIngestFields
// props.only:   '', 'rtmp' or 'srt' to render just one of them
export default function IngestAddressFields(props) {
	const fields = props.fields || {};
	const only = props.only || '';

	const showRTMP = (only === '' || only === 'rtmp') && fields.rtmp && fields.rtmp.enabled;
	const showSRT = (only === '' || only === 'srt') && fields.srt && fields.srt.enabled;

	if (!showRTMP && !showSRT) {
		return null;
	}

	return (
		<React.Fragment>
			{props.hint && (
				<Grid item xs={12}>
					<Typography variant="body2" sx={{ color: 'text.secondary' }}>
						<Trans>Or fill these fields instead of the full URL (e.g. for OBS):</Trans>
					</Typography>
				</Grid>
			)}
			{showRTMP && (
				<React.Fragment>
					<AddressField label={<Trans>Server</Trans>} value={fields.rtmp.server} />
					<AddressField label={<Trans>Stream key</Trans>} value={fields.rtmp.key} />
				</React.Fragment>
			)}
			{showSRT && (
				<React.Fragment>
					<AddressField label={<Trans>Server</Trans>} value={fields.srt.server} />
					<AddressField label={<Trans>Stream ID</Trans>} value={fields.srt.streamid} />
					{fields.srt.passphrase.length !== 0 && (
						<AddressField label={<Trans>Passphrase</Trans>} value={fields.srt.passphrase} />
					)}
				</React.Fragment>
			)}
		</React.Fragment>
	);
}

IngestAddressFields.defaultProps = {
	fields: {},
	only: '',
	hint: false,
};
