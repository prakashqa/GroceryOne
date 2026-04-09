/**
 * Network Printer Simulator
 *
 * Simulates a thermal receipt printer by listening on TCP port 9100 (RAW/JetDirect).
 * Receives UTF-8 text from the GroOne mobile app's NetworkPrinterService and
 * displays the formatted receipt in the terminal.
 *
 * Usage:
 *   node tools/printer-simulator.js [port]
 *
 * Default port: 9100
 *
 * How to test:
 *   1. Run this script on your PC
 *   2. In the app: Printer Settings -> Network -> enter your PC's IP:9100
 *   3. Tap "Test Connection" then "Test Print"
 *   4. Receipt appears in this terminal
 */

const net = require('net');
const os = require('os');

const PORT = parseInt(process.argv[2], 10) || 9100;
let jobCount = 0;

const server = net.createServer((socket) => {
  jobCount++;
  const jobId = jobCount;
  const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
  const timestamp = new Date().toLocaleTimeString();
  let buffer = '';

  console.log(`\n[${timestamp}] Job #${jobId} - Connected from ${clientAddr}`);

  socket.on('data', (data) => {
    buffer += data.toString('utf8');
  });

  socket.on('end', () => {
    // Strip form feed (\x0C) and trailing whitespace
    const receipt = buffer.replace(/\x0C/g, '').trimEnd();

    if (receipt.length > 0) {
      const lines = receipt.split(/\r?\n/);
      const width = Math.max(...lines.map((l) => l.length), 32);
      const border = '\u2550'.repeat(width + 2);
      const thin = '\u2500'.repeat(width + 2);

      console.log('');
      console.log(`\u2554${border}\u2557`);
      console.log(
        `\u2551 ${('\u{1F9FE} RECEIPT #' + jobId).padEnd(width)} \u2551`
      );
      console.log(`\u2560${border}\u2563`);
      lines.forEach((line) => {
        console.log(`\u2551 ${line.padEnd(width)} \u2551`);
      });
      console.log(`\u255A${border}\u255D`);
      console.log(`\u2514${thin}\u2518`);
      console.log(
        `  ${buffer.length} bytes | ${lines.length} lines | Job #${jobId}`
      );
    } else {
      console.log(`[${timestamp}] Job #${jobId} - Test connection (no data)`);
    }
  });

  socket.on('error', (err) => {
    if (err.code === 'ECONNRESET') {
      // Client disconnected abruptly (common for test connections)
      if (buffer.length === 0) {
        console.log(
          `[${timestamp}] Job #${jobId} - Test connection (reset) from ${clientAddr}`
        );
      } else {
        console.log(
          `[${timestamp}] Job #${jobId} - Connection reset after ${buffer.length} bytes`
        );
      }
    } else {
      console.log(`[${timestamp}] Job #${jobId} - Socket error: ${err.message}`);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nError: Port ${PORT} is already in use. Try a different port:`
    );
    console.error(`  node tools/printer-simulator.js 9101\n`);
  } else if (err.code === 'EACCES') {
    console.error(`\nError: Permission denied for port ${PORT}.`);
    console.error(`  Try a port above 1024 or run as administrator.\n`);
  } else {
    console.error(`\nServer error: ${err.message}\n`);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  const lanIPs = [];

  Object.entries(interfaces).forEach(([name, addrs]) => {
    if (addrs) {
      addrs
        .filter((a) => a.family === 'IPv4' && !a.internal)
        .forEach((a) => lanIPs.push({ name, address: a.address }));
    }
  });

  console.log('');
  console.log(
    '\u{1F5A8}\uFE0F  Network Printer Simulator'
  );
  console.log('='.repeat(45));
  console.log(`   Port: ${PORT}`);
  console.log('');
  if (lanIPs.length > 0) {
    console.log('   Enter one of these IPs in the app:');
    lanIPs.forEach(({ name, address }) => {
      console.log(`   \u2192 ${address}:${PORT}  (${name})`);
    });
  } else {
    console.log(`   Listening on localhost:${PORT}`);
  }
  console.log('');
  console.log('='.repeat(45));
  console.log('   Waiting for print jobs... (Ctrl+C to stop)');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down printer simulator...');
  server.close(() => {
    console.log(`Total jobs received: ${jobCount}`);
    process.exit(0);
  });
});
