import React from 'react';

import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { Trans } from '@lingui/macro';

import Select from '../../../Select';
import Video from '../../settings/Video';
import Helper from '../../helper';

function init(initialState) {
	const state = {
		device: '/dev/dri/renderD128',
		bitrate: '4096',
		fps: '25',
		gop: '2',
		preset: 'medium',
		profile: 'main',
		...initialState,
	};

	return state;
}

function createMapping(settings, stream, skills) {
	stream = Helper.InitStream(stream);
	skills = Helper.InitSkills(skills);

	const global = [];
	const local = [];
	const filter = [];

	// The oneVPL session uses the DRM render node of the Intel GPU.
	global.push(['-qsv_device', `${settings.device}`]);

	local.push(
		'-codec:v',
		'av1_qsv',
		'-preset:v',
		`${settings.preset}`,
		'-profile:v',
		`${settings.profile}`,
		'-b:v',
		`${settings.bitrate}k`,
		'-maxrate',
		`${settings.bitrate}k`,
		'-bufsize',
		`${settings.bitrate}k`,
		'-r',
		`${settings.fps}`,
	);

	if (settings.gop !== 'auto') {
		local.push('-g', `${Math.round(parseInt(settings.fps) * parseInt(settings.gop)).toFixed(0)}`);
	}

	filter.push('format=nv12');

	return {
		global: global,
		local: local,
		filter: filter,
	};
}

function Preset(props) {
	return (
		<Select label={<Trans>Preset</Trans>} value={props.value} onChange={props.onChange}>
			<MenuItem value="veryfast">veryfast</MenuItem>
			<MenuItem value="faster">faster</MenuItem>
			<MenuItem value="fast">fast</MenuItem>
			<MenuItem value="medium">medium</MenuItem>
			<MenuItem value="slow">slow</MenuItem>
			<MenuItem value="slower">slower</MenuItem>
			<MenuItem value="veryslow">veryslow</MenuItem>
		</Select>
	);
}

Preset.defaultProps = {
	value: '',
	onChange: function (event) {},
};

function Profile(props) {
	return (
		<Select label={<Trans>Profile</Trans>} value={props.value} onChange={props.onChange}>
			<MenuItem value="main">main</MenuItem>
		</Select>
	);
}

Profile.defaultProps = {
	value: '',
	onChange: function (event) {},
};

function Coder(props) {
	const settings = init(props.settings);
	const stream = Helper.InitStream(props.stream);
	const skills = Helper.InitSkills(props.skills);

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		props.onChange(newSettings, createMapping(newSettings, stream, skills), automatic);
	};

	const update = (what) => (event) => {
		const newSettings = {
			...settings,
			[what]: event.target.value,
		};

		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				<Video.Bitrate value={settings.bitrate} onChange={update('bitrate')} allowCustom />
			</Grid>
			<Grid item xs={12} md={6}>
				<Video.Framerate value={settings.fps} onChange={update('fps')} allowCustom />
			</Grid>
			<Grid item xs={12} md={6}>
				<Video.GOP value={settings.gop} onChange={update('gop')} allowAuto allowCustom />
			</Grid>
			<Grid item xs={12} md={6}>
				<Preset value={settings.preset} onChange={update('preset')} />
			</Grid>
			<Grid item xs={12} md={6}>
				<Profile value={settings.profile} onChange={update('profile')} />
			</Grid>
			<Grid item xs={12} md={6}>
				<TextField variant="outlined" fullWidth label={<Trans>Device</Trans>} value={settings.device} onChange={update('device')} />
			</Grid>
		</Grid>
	);
}

Coder.defaultProps = {
	stream: {},
	settings: {},
	skills: {},
	onChange: function (settings, mapping) {},
};

const coder = 'av1_qsv';
const name = 'AV1 (Intel QSV)';
const codec = 'av1';
const type = 'video';
const hwaccel = true;

function summarize(settings) {
	return `${name}, ${settings.bitrate} kbit/s, ${settings.fps} FPS, Preset: ${settings.preset}, Profile: ${settings.profile}`;
}

function defaults(stream, skills) {
	const settings = init({});

	return {
		settings: settings,
		mapping: createMapping(settings, stream, skills),
	};
}

export { coder, name, codec, type, hwaccel, summarize, defaults, Coder as component };
