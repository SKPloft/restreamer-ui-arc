import React from 'react';

import { Trans } from '@lingui/macro';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import TextField from './TextField';

// Shows which hostname ends up in the ingest/playback addresses and lets the
// operator set it in the core configuration, because by default the hostname
// is whatever address was used to open the panel.
export default function PublicAddress(props) {
	const [state, setState] = React.useState({
		ready: false,
		names: [],
		fixed: false,
		value: '',
		editing: false,
		saving: false,
		error: '',
	});

	const load = async () => {
		const res = await props.restreamer.Config();

		if (res === null) {
			// Not allowed to read the core configuration (e.g. a non-admin session):
			// stay hidden instead of showing an error nobody can act on.
			return;
		}

		const names = (res.config.host && res.config.host.name) || [];

		setState((s) => ({
			...s,
			ready: true,
			names: names,
			fixed: (res.overrides || []).indexOf('host.name') !== -1,
			value: names.join(', '),
		}));
	};

	React.useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const save = async () => {
		setState((s) => ({ ...s, saving: true, error: '' }));

		const res = await props.restreamer.Config();
		if (res === null) {
			setState((s) => ({ ...s, saving: false, error: 'unable to read the configuration' }));
			return;
		}

		const config = JSON.parse(JSON.stringify(res.config));
		config.host.name = state.value
			.split(',')
			.map((name) => name.trim())
			.filter((name) => name.length !== 0);

		const [, err] = await props.restreamer.ConfigSet(config);
		if (err !== null) {
			setState((s) => ({ ...s, saving: false, error: err.message || 'save failed' }));
			return;
		}

		window.location.reload();
	};

	if (!state.ready) {
		return null;
	}

	return (
		<Grid item xs={12}>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
				<Typography variant="body2" sx={{ minWidth: '6em', color: 'text.secondary' }}>
					<Trans>Public host</Trans>
				</Typography>
				<Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flexGrow: 1 }}>
					{state.names.length !== 0 ? (
						state.names.join(', ')
					) : (
						<Trans>(the address you used to open this panel)</Trans>
					)}
				</Typography>
				{!state.fixed && (
					<Button size="small" variant="outlined" onClick={() => setState((s) => ({ ...s, editing: !s.editing }))}>
						{state.editing ? <Trans>Cancel</Trans> : <Trans>Customize ...</Trans>}
					</Button>
				)}
			</Stack>
			{state.fixed && (
				<Typography variant="caption" sx={{ color: 'text.secondary' }}>
					<Trans>Fixed by the deployment configuration and cannot be changed here.</Trans>
				</Typography>
			)}
			{state.editing && (
				<Stack spacing={1} sx={{ marginTop: '.6em' }}>
					<TextField
						fullWidth
						label={<Trans>Public host</Trans>}
						value={state.value}
						onChange={(event) => setState((s) => ({ ...s, value: event.target.value }))}
					/>
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						<Trans>
							Hostname(s) used in the ingest and playback addresses, separated by a comma. This is written to the core
							configuration and applies to every visitor of this panel. It is not stored in the deployment, so keep the
							deployment configuration in sync if the container is recreated.
						</Trans>
					</Typography>
					<Stack direction="row" spacing={1}>
						<Button size="small" variant="contained" disabled={state.saving} onClick={save}>
							<Trans>Save</Trans>
						</Button>
					</Stack>
				</Stack>
			)}
			{state.error.length !== 0 && (
				<Typography variant="caption" sx={{ color: 'error.main' }}>
					{state.error}
				</Typography>
			)}
		</Grid>
	);
}

PublicAddress.defaultProps = {
	restreamer: null,
};
