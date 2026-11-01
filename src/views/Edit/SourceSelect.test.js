import React from 'react';
import { render, screen } from '../../utils/testing';
import '@testing-library/jest-dom';

import SourceSelect from './SourceSelect';

const skills = {
	ffmpeg: { version: '8.0.1' },
	sources: {
		network: {},
		video4linux2: {},
		alsa: {},
	},
	protocols: { input: ['rtmp', 'http', 'srt'] },
	formats: { demuxers: [] },
	devices: { video4linux2: [] },
};

test('video source list is not empty with ffmpeg 8', () => {
	render(<SourceSelect type="video" skills={skills} source={{ type: 'network' }} config={{}} />, {}, '/edit/test', '/edit/:channelid');

	expect(screen.queryByText('No sources available')).not.toBeInTheDocument();
	expect(screen.getByText('Network source')).toBeInTheDocument();
});

test('audio source list is not empty with ffmpeg 8', () => {
	render(<SourceSelect type="audio" skills={skills} source={{ type: 'network' }} config={{}} />, {}, '/edit/test', '/edit/:channelid');

	expect(screen.queryByText('No sources available')).not.toBeInTheDocument();
	expect(screen.getByText('Network source')).toBeInTheDocument();
});
