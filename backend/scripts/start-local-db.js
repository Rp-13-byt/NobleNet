const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const isRunning = await checkPort(27017);
  if (isRunning) {
    console.log('✅ MongoDB is already running and listening on 127.0.0.1:27017.');
    return;
  }

  console.log('🔍 MongoDB is not running on port 27017. Starting local database...');

  // Ensure data directory exists
  const dbPath = path.resolve(__dirname, '..', '.data', 'db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  // Look for cached binary
  const { MongoBinary } = require('mongodb-memory-server-core');
  const binPath = await MongoBinary.getPath();

  console.log(`🚀 Spawning MongoDB from: ${binPath}`);
  console.log(`📁 Database storage path: ${dbPath}`);

  const child = spawn(binPath, ['--dbpath', dbPath, '--port', '27017'], {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();

  // Wait until port opens
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkPort(27017)) {
      console.log('✅ Local MongoDB instance started successfully on 127.0.0.1:27017!');
      return;
    }
  }

  console.error('❌ Failed to verify MongoDB startup within 15 seconds.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error starting database:', err);
  process.exit(1);
});
