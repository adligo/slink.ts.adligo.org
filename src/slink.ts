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
const { fs } = require('fs');
const { stream } = require('stream'); 
import {I_Out} from '@ts.adligo.org/io';

const foo : I_Out = (foo) => console.log(foo);

/**
 * This is a set of attributes that can be used on the Command Line as
 * an Argument.
 */
export interface I_CliCtxFlag {
  /**
   * The full command that will be expected if the double dash (i.e. --help )is used
   */
  cmd: string;
  /**
   * This is the description of what the command should do
   */
  description?: string;
  /**
   * This indicates if the flag accepts arguments or is simply a flag,
   * it defaults to true.
   */
  flag?: boolean;
  /**
   * This is the single letter that can be concatinated together (i.e. f and r in rm -fr)
   */
  letter?: string;
}

export class CliCtxFlag {
  private cmd: string;
  private letter?: string;
  private description?: string;
  private flag?: boolean;

  constructor(flag: I_CliCtxFlag) {
    this.cmd = flag.cmd;
    this.letter = flag.letter;
    this.description = flag.description;
    if (flag.flag == undefined) {
      this.flag = true;
    } else {
      this.flag = flag.flag;
    }
  }
  getCmd(): string { return this.cmd; }
  getDescription(): string { return this.description; }
  getFlag(): boolean { return this.flag; }
  getLetter(): string { return this.letter; }
  isFlag(): boolean { return this.flag; }
}

export class CliCtxArg {
  private flag: CliCtxFlag; 
  private arg?: string;

  constructor(flag: CliCtxFlag, arg? : string) {
    this.flag = flag;
    this.arg = arg;
  }
  getArg(): string { return this.arg}
  getFlag(): CliCtxFlag { return this.flag}
}

export class Strings {
  static removeChars(s: string, chars: Set<string>): string {
    var r = '';
    for (var i=0; i < s.length; i ++) {
      let c = s.charAt(i);
      var t = true;
      if (chars.has(c)) {
        //console.log('ignoring ' + c);
      } else {
        //console.log('adding ' + c);
        r = r.concat(c);
      }
    }
    return r;
  }
}

export class Paths {
  /**
   * 
   * @param path a fully qualified path
   * @returns 
   */
  static toUnix(path: string): string {
    var r = '';
    if (path.length > 3) {
      if (path.charAt(1) == ':') {
        r = '/c/';
        for (var i=3; i< path.length; i++) {
          let c = path[i];
          if (c == '\\') {
            r = r.concat('/');
          } else {
            r = r.concat(c);
          }
        }
      } else {
        //assume unix path already!
        return path;
      }
    } else {
      throw Error("Unable to parse paths of length 3 or smaller!");
    }
    return r;
  }

  static toUnixPath(parts: string[]): string {
    let b = '/';
    for (var i=0; i < parts.length; i++) {
      b = b.concat(parts[i]).concat('/');
    }
    return b;
  }
  /**
   * 
   * @param unixPath a fully qualified path
   */
  static toParts(unixPath: string): string[] {
    let r: string[] = new Array();
    let b = '';
    var j = 0;
    if (unixPath.charAt(0) != '/') {
      throw Error('The following unixPath is not a fully qualified path!;\n' + unixPath);
    }
    for (var i=1; i< unixPath.length; i++) {
      let c = unixPath[i];
      if (c == '/') {
        if (b.length != 0) {
          r[j] = b;
          b = '';
          j++;
        }
      } else {
        b = b.concat(c);
      }
    }
    return r;
  }
}

const UnixCmdError1 = 'Unable to run the UNIX ';
const UnixCmdError2 = ' command!\nIf your running on Windows try using GitBash to run this program!\n';
class Pwd {
  private path: string;

  constructor() {
    try {
      let pwd = spawnSync('pwd',[]);
      var pi = "" + pwd.output;
      //console.log('pwd output is ' + pwd.output);
      if ('null' == pi) {
        throw Error('The output from pwd is ' + pi);
      }
      this.path = Strings.removeChars(pi,new Set<string>().add(',').add('\n'));
    } catch (e) {
      throw Error(UnixCmdError1 + 'pwd' + UnixCmdError2 + e);
    }
  }
  public toPath() { return this.path; }
}
const HELP: I_CliCtxFlag = {cmd: "help", description: "Displays the Help Menu, prints this output."}
const VERSION: I_CliCtxFlag = {cmd: "version", description: "Displays the version.", flag: true, letter: "v"}

class CliCtx {
  private done: boolean = false;
  private path: string;
  private home: string;
  private map: Map<string, CliCtxArg> = new Map();

  /**
   * 
   * @param flags 
   * @param args 
   * @param belowRoot this is an integer which identifies the number of 
   *   path parts below the projects (npm module) root root the actual
   *   CLI script is.  This defaults to 1 for scripts in the src dir.
   * @param out 
   */
  constructor(flags: I_CliCtxFlag[], args?: string [], belowRoot?: number, out?: I_Out) {
    this.path = new Pwd().toPath();
    if (args == undefined) {
      args = process.argv;
    }
    if (belowRoot == undefined) {
      belowRoot = 1;
    }
    if (out == undefined) {
      out = (message) => console.log(message);
    }
    let allFlags: CliCtxFlag[] = new Array(flags.length);
    let map2Cmds: Map<string, CliCtxFlag> = new Map();
    let map2Letters: Map<string, CliCtxFlag> = new Map();
    for (var i=0; i< flags.length; i++) {
      let f = new CliCtxFlag(flags[i]);
      allFlags[i] = f;
      if (map2Cmds.has(f.getCmd())) {
        throw Error("The following command has been duplicated? " + f.getCmd())
      }
      map2Cmds.set(f.getCmd(), f);
      if (f.getLetter() != undefined) {
        if (map2Letters.has(f.getLetter())) {
          throw Error("The following command has a duplicated letter? " + f.getCmd())
        }
        map2Letters.set(f.getLetter(), f);
      }
    }
    this.home = Paths.toUnix(args[1]);
    let homeParts: string[] = Paths.toParts(this.home);
    this.home = Paths.toUnixPath(homeParts.slice(0, homeParts.length - belowRoot))
    for (var i=2; i< args.length; i++) {
      let a = args[i];
      out('processing cli arg ' + a);
      if (a.length < 2) {
        let a = i -1;
        throw Error('Unable to parse command line arguments, issue at argument; ' + a);
      } else {
        let dd = a.substring(0,2);
        if (dd == '--') {
          let cmd = a.substring(2, a.length);
          out('cmd is ' + cmd);
          let flag: CliCtxFlag = map2Cmds.get(cmd);
          if (flag.isFlag()) {
            this.map.set(cmd, new CliCtxArg(flag));            
          } else if (args.length < i + 1) {
            let arg = args[i + 1];
            i++;
            this.map.set(cmd, new CliCtxArg(flag, arg)); 
          } else {
            throw Error('The following command line argument expects an additional argument; ' + cmd);
          }
        } else if (a.charAt(0) == '-') {
          //process letters
          for (var j=1; j < a.length; j++) {
            let l = a.charAt(j);
            out('processing letter ' + l);
            let flag: CliCtxFlag = map2Letters.get(l);
            out('got command ' + flag.getCmd() + ' for letter ' + l);
            this.map.set(flag.getCmd(), new CliCtxArg(flag));  
          }
        } else {
          throw Error('Unable to process command line argument ; ' + a);
        }
      } 
    }
    if (this.map.get(HELP.cmd)) {
      //print the help menu;
      out('This program understands the following commands;\n');
      for (var i = 0; i < flags.length; i++) {
        let flag: I_CliCtxFlag = flags[i];
        var m = '\t--' + flag.cmd;
        if (flag.letter != undefined) {
          m = m + ' / ' + flag.letter;
        }
        out(m);
        if (flag.description != undefined) {
          out('\t\t' + flag.description);
        }
      }
      this.done = true;
    } else if (this.map.get(VERSION.cmd)) {
      let homePkgJson = this.home + 'package.json';
      out('Got homePkgJson ' + homePkgJson);
      let json = fs.readFileSync(homePkgJson);
      out('Got JSON string ' + json);
      let jObj = JSON.parse(json);
      out('Got JSON ' + jObj);
    }
  }
  getHome(): string { return this.home; }
}

console.log('hello slink2 ');
let flags: I_CliCtxFlag[] = [HELP, VERSION];
let ctx = new CliCtx(flags);
console.log('CliArgParser created with home\n\t' + ctx.getHome());
