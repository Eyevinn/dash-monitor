#!/usr/bin/env node
/**
 * Start script for compiled code
 */
const { DASHMonitorService } = require('./dist/DASHMonitorService');

const port = process.argv[2] || 8080;

console.log(`
╔═══════════════════════════════════════╗
║   DASH Stream Monitor Service         ║
║   Monitor MPEG-DASH streams           ║
╚═══════════════════════════════════════╝
`);

const service = new DASHMonitorService(parseInt(port));

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await service.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await service.stop();
  process.exit(0);
});

// Start service
service.start().catch(error => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
