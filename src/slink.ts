#! /usr/bin/env node
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
const { spawnSync } = require('child_process')
const { stream } = require('stream'); 
import {I_Out} from '@ts.adligo.org/io';

const foo : I_Out = (foo) => console.log(foo);

function removeChars(s: string, chars: string[]): string {
  var r = '';
  for (var i=0; i < s.length; i ++) {
    let c = s.charAt(i);
    var t = true;
    for (var j=0; j < chars.length; j++) {
      let cj = chars[j];
      if (c == cj) {
        t = false;
        break;
      }
    }
    if (t) {
      //console.log('adding ' + c);
      r = r.concat(c);
    } else {
      //console.log('ignoring ' + c);
    }
  }
  return r;
}

const UnixCmdError1 = 'Unable to run the UNIX ';
const UnixCmdError2 = ' command, if your running on Windows try using GitBash to run this program!\n';
class Pwd {
  private path: string;

  constructor() {
    try {
      let pwd = spawnSync('pwd',[]);
      var pi = "" + pwd.output;
      console.log('pwd output is ' + pwd.output);
      if ('null' == pi) {
        throw Error('The output from pwd is ' + pi);
      }
      this.path = removeChars(pi, [',','\n']);
    } catch (e) {
      throw Error(UnixCmdError1 + 'pwd' + UnixCmdError2 + e);
    }
  }
  public toPath() { return this.path; }
}
class CliArgParser {

  constructor() {
    console.log('running in ' + new Pwd().toPath());
    console.log('There are ' + process.argv.length + ' command line arguments');
    for (var i=0; i< process.argv.length; i++) {
      console.log('cli arg ' + i + ' is ' + process.argv[i]);
    }
  }
}

console.log('hello slink2 ');
new CliArgParser();
console.log('CliArgParser created');

