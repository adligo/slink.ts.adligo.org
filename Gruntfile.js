const { spawnSync } = require('child_process');
const path = require('path');

const projectPath = process.cwd();
var isWin = process.platform === "win32";
console.log('running in ' + projectPath);
var npm = 'npm'
if (isWin) {
  npm = 'npm.cmd'
}

function build() {
  run(npm,['run','tsc']);
}

function clean() {
  run('rm',['-fr','dist']);
}

function install() {
  run(npm,['install','-g','.']);
}

function out(cmd, spawnSyncReturns) {
  console.log('ran ' + cmd );
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
  for (var i=0; i < args.length; i++) {
    cc = cc + ' ' + args[i];
  }
  out(cc, spawnSync(cmd, args, { cwd: projectPath }));
}

function uninstall() {
  run(npm,['uninstall','-g','@ts.adligo.org/slink']);
}

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
  });
  
  grunt.registerTask('dlocal', 'Uninstalls transpiles and installes slink on the  local machine.', 
    function() {
      grunt.log.writeln(this.name + ", no args");
      uninstall();
      clean();
      build();
      install();
    });
  
  };