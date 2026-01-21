/**
  * Copyright 2023 Adligo Inc / Scott Morgan
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *     http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */
const { spawnSync } = require('child_process');
const path = require('path');

const projectPath = process.cwd();
var isWin = process.platform === "win32";


console.log('running in ' + projectPath);
var npm = 'npm'
/*
if (isWin) {
  npm = 'npm.cmd'
}
*/


function out(cmd, spawnSyncReturns) {
  console.log('ran: ' + cmd);
  console.log('\tand the spawnSyncReturns had;');
  if (spawnSyncReturns.error != undefined) {
    console.log('\tError: ' + spawnSyncReturns.error);
    console.log('\t\t' + spawnSyncReturns.error.message);
  }
  if (spawnSyncReturns.stderr != undefined) {
    console.log('\tStderr: ' + spawnSyncReturns.stderr);
  }
  if (spawnSyncReturns.stdout != undefined) {
    console.log('\tStdout: ' + spawnSyncReturns.stdout);
  }
}

function run(cmd, args) {
  var cc = cmd;
  for (var i = 0; i < args.length; i++) {
    cc = cc + ' ' + args[i];
  }
  out(cc, spawnSync(cmd, args, { cwd: projectPath }));
}

function run(cmd, args, options) {
  var cc = cmd;
  for (var i = 0; i < args.length; i++) {
    cc = cc + ' ' + args[i];
  }
  out(cc, spawnSync(cmd, args, options));
}

//disabled for shared builds as the environment is then shown in the Jenkins console logs
//console.log(process.env);
function getShell() {
  return '/usr/bin/bash';
}

var currentShell = getShell();
console.log(`The shell being used is: ${currentShell}`);

console.log('in build.cjs with ' + process.argv)

var processed = false;
for (var i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case '--install-local':
      processed = true
      console.log('processing --install-local ' + process.env.SHELL)
      options = new Object();
      options.cwd = projectPath
      options.shell = process.env.SHELL
      //run('echo',['$PATH'], options);
      run(npm, ['uninstall', '-g', '@ts.adligo.org/slink'], options);
      run('rm', ['-fr', 'dist'], options);
      console.log('running tsc')
      run(npm, ['run', 'tsc'], options);
      run(npm, ['install', '-g', '.'], options);
      break;
  }
}

if (!processed) {
  console.log('processing default build.cjs ' + process.env.SHELL)
  options = new Object();
  options.cwd = projectPath
  options.shell = process.env.SHELL
  run('rm', ['-fr', 'dist'], options);
  console.log('running tsc')
  run(npm, ['run', 'tsc'], options);
}

