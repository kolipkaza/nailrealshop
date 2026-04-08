const fs = require('fs');
const path = require('path');

// Redirect console.log to file
const logFile = '/tmp/nailreal_server.log';
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

console.log = function(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.join(' ')}\n`;
  logStream.write(message);
  process.stdout.write(message);
};

console.error = function(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ERROR: ${args.join(' ')}\n`;
  logStream.write(message);
  process.stderr.write(message);
};

try {
  console.log('Starting NailReal_Shop server...');

  // Load original server
  require('./server.js');

  console.log('Server loaded successfully!');
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
