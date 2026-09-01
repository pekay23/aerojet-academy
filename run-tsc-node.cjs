const { spawn } = require('child_process');
const fs = require('fs');
const proc = spawn('bunx', ['tsc', '--noEmit', '--pretty', 'false', '--skipLibCheck'], {
  cwd: 'C:\\Projects\\aerojet-academy',
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
proc.stdout.on('data', d => output += d.toString());
proc.stderr.on('data', d => output += d.toString());
proc.on('close', code => {
  fs.writeFileSync('tsc-results2.txt', output);
  fs.writeFileSync('tsc-done2.txt', 'EXITCODE=' + code);
});
console.log('tsc started with PID:', proc.pid);
