jest.mock('electron', () => {
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(os.tmpdir(), 'groone-log-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  return { app: { getPath: () => dir, getVersion: () => '1.0.0' } };
});

import { buildErrorDetail, initLogger, tailLog, getLogPath } from './log';
import * as fs from 'fs';

describe('buildErrorDetail', () => {
  it('includes the message, captured detail, and log path', () => {
    const out = buildErrorDetail('Backend did not become healthy in time.', 'EADDRINUSE 47600', 'C:/x/startup.log');
    expect(out).toContain('Backend did not become healthy in time.');
    expect(out).toContain('— Details —');
    expect(out).toContain('EADDRINUSE 47600');
    expect(out).toContain('Log file: C:/x/startup.log');
    expect(out).toContain('support@groone.in');
  });

  it('omits the details block when there is no tail', () => {
    const out = buildErrorDetail('Boom', '', '');
    expect(out).toContain('Boom');
    expect(out).not.toContain('— Details —');
  });
});

describe('initLogger', () => {
  it('tees console output to the in-memory ring and writes a log file', () => {
    initLogger();
    console.log('hello-from-test', 123);
    console.error(new Error('kaboom'));
    const tail = tailLog(10);
    expect(tail).toContain('hello-from-test');
    expect(tail).toContain('kaboom');
    expect(fs.existsSync(getLogPath())).toBe(true);
    expect(fs.readFileSync(getLogPath(), 'utf8')).toContain('hello-from-test');
  });
});
