#!/usr/bin/env node
/**
 * CLI for DASH Monitor Service
 */
import { DASHMonitorService } from './dashMonitorService';
import Getopt from 'node-getopt';

const getopt = new Getopt([
  ['p', 'port=PORT', 'Port to listen on (default: 8080)'],
  ['h', 'help', 'Display this help'],
]);

const opt = getopt.bindHelp().parseSystem();

if (opt.options.help) {
  getopt.showHelp();
  process.exit(0);
}

const port =
  opt.options.port && typeof opt.options.port === 'string' ? parseInt(opt.options.port, 10) : 8080;

console.log(`
╔═══════════════════════════════════════╗
║   DASH Stream Monitor Service         ║
║   Monitor MPEG-DASH streams           ║
╚═══════════════════════════════════════╝
`);

const service = new DASHMonitorService(port);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  void service.stop().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  void service.stop().then(() => process.exit(0));
});

// Start service
service.start().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
