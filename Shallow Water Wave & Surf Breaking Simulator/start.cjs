const { spawn } = require('child_process');
const path = require('path');

const vitePath = path.join(__dirname, 'node_modules', '.bin', 'vite.cmd');

const child = spawn(vitePath, ['--port', '3000'], {
  cwd: __dirname,
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`Vite exited with code ${code}`);
});
