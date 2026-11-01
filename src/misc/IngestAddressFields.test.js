import React from 'react';
import { render, screen } from '../utils/testing';
import '@testing-library/jest-dom';

import IngestAddressFields from './IngestAddressFields';
import { BuildIngestFields } from '../utils/ingest';

const fields = BuildIngestFields(
	'abc',
	{ enabled: true, secure: false, host: 'anteness.cn:1935', app: '/cyberstan', token: 'T' },
	{ enabled: true, host: 'anteness.cn:6000', token: 'T', passphrase: 'P' },
);

test('the token is listed separately from the stream key and the stream id', () => {
	render(<IngestAddressFields fields={fields} />);

	expect(screen.getByText('rtmp://anteness.cn:1935/cyberstan')).toBeInTheDocument();
	expect(screen.getByText('abc.stream')).toBeInTheDocument();
	expect(screen.getByText('abc.stream?token=T')).toBeInTheDocument();

	expect(screen.getByText('srt://anteness.cn:6000')).toBeInTheDocument();
	expect(screen.getByText('abc,mode:request')).toBeInTheDocument();
	expect(screen.getByText('abc,mode:request,token:T')).toBeInTheDocument();
	expect(screen.getByText('P')).toBeInTheDocument();

	// one token row for RTMP, one for SRT
	expect(screen.getAllByText('Token')).toHaveLength(2);
	expect(screen.getAllByText('T')).toHaveLength(2);
});
