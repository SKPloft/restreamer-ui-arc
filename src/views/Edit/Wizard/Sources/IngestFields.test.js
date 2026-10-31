import React from 'react';
import { render, screen } from '../../../../utils/testing';
import '@testing-library/jest-dom';

import * as RTMP from './InternalRTMP';
import * as SRT from './InternalSRT';

const config = {
	channelid: 'abc',
	rtmp: { enabled: true, secure: false, host: 'anteness.cn:1935', local: 'localhost:1935', app: '/cyberstan', token: 'T' },
	srt: { enabled: true, host: 'anteness.cn:6000', local: 'localhost:6000', token: 'T', passphrase: 'P' },
	hls: {},
};

const props = {
	config,
	settings: { push: { name: 'abc' }, address: 'rtmp://x' },
	knownDevices: [],
	skills: { protocols: { input: ['rtmp', 'srt'] }, sources: { network: [] }, formats: { demuxers: [] } },
	onChange: () => {},
	onRefresh: () => {},
};

test('wizard rtmp step renders the split fields', () => {
	const Comp = RTMP.component;
	render(<Comp {...props} />, {}, '/wizard/test', '/wizard/:channelid');

	expect(screen.getByText('Stream key')).toBeInTheDocument();
	expect(screen.getByText('abc.stream?token=T')).toBeInTheDocument();
	expect(screen.getByText('rtmp://anteness.cn:1935/cyberstan')).toBeInTheDocument();
});

test('wizard srt step renders the split fields', () => {
	const Comp = SRT.component;
	render(<Comp {...props} />, {}, '/wizard/test', '/wizard/:channelid');

	expect(screen.getByText('Stream ID')).toBeInTheDocument();
	expect(screen.getByText('abc,mode:request,token:T')).toBeInTheDocument();
	expect(screen.getByText('srt://anteness.cn:6000')).toBeInTheDocument();
	expect(screen.getByText('P')).toBeInTheDocument();
});
