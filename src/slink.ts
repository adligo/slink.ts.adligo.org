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
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { Stream } from 'stream';
import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process';
const windowCmdPath = 'C:\\Windows\\system32\\cmd';


export type I_Out = (message: string) => void;

export interface I_CmdLog {
  logCmd(cmdWithArgs: string, spawnSyncReturns: any, options?: any): void;
}

export interface I_SpawnSync {
  spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer<ArrayBufferLike>>;
}

export class SpawnSyncStub implements I_SpawnSync {
  spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer<ArrayBufferLike>> {
    return spawnSync(command, args, options);
  }
}


export interface I_Fs {
  readFileSync(path: fs.PathOrFileDescriptor, options?: {
      encoding?: null | undefined;
      flag?: string | undefined;
  } | null): string;
}

export class FsStub implements I_Fs {
  public readFileSync(path: fs.PathOrFileDescriptor, options?: {
      encoding?: null | undefined;
      flag?: string | undefined;
  } | null): string {
    return fs.readFileSync(path, options).toString();
  }
}

export class ShellRunner {
  cmdLog: I_CmdLog;
  debug: boolean = false;
  out: I_Out;
  sSync?: I_SpawnSync = new SpawnSyncStub();

  constructor(cmdLog: I_CmdLog, out: I_Out, debug?: boolean, mockSpawnSync?: I_SpawnSync) {
    this.cmdLog = cmdLog;
    if (debug != undefined) {
      this.debug = debug;
    }
    this.out = out;
    if (mockSpawnSync != undefined) {
      this.sSync = mockSpawnSync;
    }
  }

  public run(cmd: string, args: string[], options?: any): any {
    var cc = cmd;
    if (args != undefined) {
      for (var i = 0; i < args.length; i++) {
        cc = cc + ' ' + args[i];
      }
    }
    //Execute fork to GitBash from GitBash execution
    if (options == undefined) {
      options = new Object();

      options.shell = process.env.SHELL;
      if (this.debug) {
        this.out('New options, running with shell is ' + options.shell);
      }
    } else {
      if (options.keepShell == undefined || options.keepShell == false) {
        options.shell = process.env.SHELL;
      }
      if (this.debug) {
        console.log('Running with shell is ' + options.shell);
      }
    }
    //stubbed for unit testing
    var ssr: any = this.sSync.spawnSync(cmd, args, options);
    this.cmdLog.logCmd(cc, ssr, options);
    return ssr;
  }
}


const IS_WINDOWS = process.platform === "win32";
export function getPathSeperator() {
  if (IS_WINDOWS) {
    return '\\';
  } else {
    return '/';
  }
}
export const out: I_Out = (foo) => console.log(foo);

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
  private flag: boolean;

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

  constructor(flag: CliCtxFlag, arg?: string) {
    this.flag = flag;
    this.arg = arg;
  }
  getArg(): string { return this.arg }
  getFlag(): CliCtxFlag { return this.flag }
}

export class Path {
  private relative: boolean;
  private parts: string[];
  private windows: boolean;

  constructor(parts: string[], relative?: boolean, windows?: boolean) {
    if (relative == undefined) {
      this.relative = false;
    } else {
      this.relative = relative;
    }
    this.parts = parts;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] == undefined) {
        throw Error('Parts must have valid strings! ' + parts);
      }
    }
    if (windows == undefined) {
      this.windows = false;
    } else {
      this.windows = windows;
    }
  }

  isRelative(): boolean { return this.relative; }
  isWindows(): boolean { return this.windows; }
  getParts(): string[] { return this.parts.slice(0, this.parts.length); }
  toString(): string { return 'Path [parts=' + this.parts + ', relative=' + this.relative + ', windows=' + this.windows + ']' }
  toPathString(): string {
    var r: string = '';
    if (this.windows) {
      if (this.relative) {
        r = r.concat(this.parts[0] + '\\');
        return this.concat(r, '\\');
      } else {
        r = r.concat(this.parts[0] + ':\\');
        return this.concat(r, '\\');
      }
    } else {
      if (this.relative) {
        return this.concat(r, '/');
      } else {
        r = r.concat('/');
        return this.concat(r, '/');
      }
    }
  }

  private concat(start: string, sep: string): string {
    var r: string = start;
    if (this.isWindows()) {
      for (var i = 1; i < this.parts.length; i++) {
        if (this.parts.length - 1 == i) {
          r = r.concat(this.parts[i]);
        } else {
          r = r.concat(this.parts[i]).concat(sep);
        }
      }
      return r;
    } else {
      for (var i = 0; i < this.parts.length; i++) {
        if (this.parts.length - 1 == i) {
          r = r.concat(this.parts[i]);
        } else {
          r = r.concat(this.parts[i]).concat(sep);
        }
      }
      return r;
    }
  }
}
export class Paths {

  static find(parts: Path, relativePath: Path): Path {
    var dd: number = 0;
    let rpp: string[] = relativePath.getParts();
    for (var i = 0; i < rpp.length; i++) {
      if (rpp[i] == '..') {
        dd++;
      }
    }
    let pp: string[] = parts.getParts();
    //console.log('In find with dd ' + dd + '\n\tpath: ' + parts + '\n\trelativepath: ' + relativePath);
    let root = pp.slice(0, pp.length - dd);
    //console.log('Root is: ' + root);
    var r = root;
    for (var i = 0; i < rpp.length; i++) {
      if (rpp[i] != '..') {
        r = r.concat(rpp[i]);
      }
    }
    //console.log('New relative path is\n\t' + r);
    return new Path(r, false);
  }

  static findPath(path: string, relativePath: Path): Path {
    return this.find(this.toParts(path, false), relativePath);
  }

  static toOs(parts: Path): string {
    if (IS_WINDOWS) {
      return this.toWindows(parts);
    } else {
      return this.toUnix(parts);
    }
  }

  static toOsPath(path: string): string {
    return this.toOs(this.toParts(path, false));
  }


  /**
  * @param a path, which could be 
  * a windows path (i.e. C:\User\scott ), 
  * a unix path (/home/scott)
  * or a gitbash path (i.e. C:/Users/scott)
  * Because of this spaces are NOT allowed.
  */
  static toParts(path: string, relative: boolean): Path {
    let r: string[] = new Array();
    let b = '';
    var j = 0;
    var i = 0;
    var winPath: boolean = false;
    if (path.length >= 1) {
      if (path.charAt(1) == ':') {
        //it's a windows path
        r[0] = path.charAt(0);
        j++;
        i = 3;
        winPath = true;
      }
    }
    for (; i < path.length; i++) {
      let c = path[i];
      if (c == '\\') {
        if (b.length != 0) {
          r[j] = b;
          b = '';
          j++;
        }
      } else if (c == '/') {
        if (b.length != 0) {
          r[j] = b;
          b = '';
          j++;
        }
      } else if (c == ' ') {
        throw Error('Spaces are NOT allowed in paths, due to portability issues.  The following path is invaid;\n\t' + path)
      } else {
        b = b.concat(c);
      }
    }
    r[j] = b;
    if (relative == undefined) {
      return new Path(r, false);
    } else if (relative) {
      return new Path(r, relative);
    } else {
      return new Path(r, relative);
    }
  }

  static toUnix(parts: Path): string {
    let b = '';
    if (!parts.isRelative()) {
      b = '/';
    }
    let pp: string[] = parts.getParts();
    for (var i = 0; i < pp.length; i++) {
      let p = pp[i];
      if (i == pp.length - 1) {
        b = b.concat(p);
      } else {
        b = b.concat(p).concat('/');
      }
    }
    return b;
  }
  static toUnixPath(path: string): string {
    return this.toUnix(this.toParts(path, false));
  }


  static toWindows(parts: Path): string {
    let b = '';
    let pp: string[] = parts.getParts();
    for (var i = 0; i < pp.length; i++) {
      if (i == 0) {
        if (pp[0].length == 1) {
          b = pp[0].toUpperCase() + ':\\';
        } else {
          b = pp[0].concat('\\');
        }
      } else if (i == pp.length - 1) {
        b = b.concat(pp[i]);
      } else {
        b = b.concat(pp[i]).concat('\\');
      }
    }
    return b;
  }
  static toWindowsPath(parts: string): string {
    return this.toWindows(this.toParts(parts, false));
  }
}

export const DEBUG: I_CliCtxFlag = { cmd: "debug", description: "Displays debugging information about htis program.", flag: true }
export const LOG: I_CliCtxFlag = { cmd: "log", description: "Writes a slink.log file in the run directory.", flag: true }
export const HELP: I_CliCtxFlag = { cmd: "help", description: "Displays the Help Menu, prints this output." }
export const VERSION: I_CliCtxFlag = { cmd: "version", description: "Displays the version.", flag: true, letter: "v" }

export class CliCtxLog {
  private fileName?: string;
  private messages: string[] = new Array();

  log(message: string) {
    if (this.fileName == undefined) {
      this.messages = this.messages.concat(message);
    } else {
      fs.appendFileSync(this.fileName, message);
    }
  }
  setFileName(fileName: string) {
    this.fileName = fileName;
    if (this.messages.length > - 1) {
      this.messages.forEach((m) => {
        fs.appendFileSync(this.fileName, m);
      });
    }
  }
}
export class CliCtx implements I_CmdLog {
  private done: boolean = false;
  /**
   * This is the current working directory of your shell, if possible
   * sometime you need to pass it in.
   */
  private dir: Path;
  private i_out: I_Out;
  private log: CliCtxLog;
  private shellRun: ShellRunner;
  private fsc: FsContext;
  private fs: I_Fs;
  
  /**
   * this is the home directory where your application is installed,
   * in the npm shared space of your computer
   */
  private home: Path;
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
  constructor(flags: I_CliCtxFlag[], args?: string[], belowRoot?: number, log?: CliCtxLog, out?: I_Out, fsc?: FsContext) {
    if (args == undefined) {
      args = process.argv;
    }
    // When even --debug and --version aren't working
    /*
    console.warn('1.3.7 process.argv are ' + process.argv);
    console.warn('args are ' + args);
    if (args != undefined) {
      console.warn('args are ' + JSON.stringify(args));
    }
    */
    if (belowRoot == undefined) {
      belowRoot = 1;
    }
    if (out == undefined) {
      out = (message) => console.log(message);
    }
    if (log == undefined) {
      this.log = new CliCtxLog();
    }
    if (fsc != undefined) {
      this.fsc = fsc;
    } else {
      this.fsc = new FsContext(this, new FsStub());
    }
    this.fs = this.fsc.getFs();
    if (this.fs == undefined) {
      throw new Error("Illegal state this.fs in CliCtx must be a object!");
    }
    this.shellRun = new ShellRunner(this, out, this.map.has('debug'));
    this.i_out = out;
    let allFlags: CliCtxFlag[] = new Array(flags.length);
    let map2Cmds: Map<string, CliCtxFlag> = new Map();
    let map2Letters: Map<string, CliCtxFlag> = new Map();
    for (var i = 0; i < flags.length; i++) {
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
    this.home = Paths.toParts(args[1], false);
    let homeParts: string[] = this.home.getParts();
    this.home = Paths.toParts(new Path(homeParts.slice(0, homeParts.length - 2), false, IS_WINDOWS).toPathString(), false);
    for (var i = 2; i < args.length; i++) {
      let a = args[i];
      //out('processing cli arg ' + a);
      if (a.length < 2) {
        let a = i - 1;
        throw Error('Unable to parse command line arguments, issue at argument; ' + a);
      } else {
        let dd = a.substring(0, 2);
        if (dd == '--') {
          let cmd = a.substring(2, a.length);
          //out('cmd is ' + cmd);
          let flag: CliCtxFlag = map2Cmds.get(cmd);
          if (flag == undefined) {
            throw new Error('No flag found for command ' + cmd);
          }
          if (flag.isFlag()) {
            this.map.set(cmd, new CliCtxArg(flag));
          } else if (i + 1 < args.length) {
            let arg = args[i + 1];
            i++;
            this.map.set(cmd, new CliCtxArg(flag, arg));
          } else {
            throw Error('The following command line argument expects an additional argument; ' + cmd);
          }
        } else if (a.charAt(0) == '-') {
          //process letters
          for (var j = 1; j < a.length; j++) {
            let l = a.charAt(j);
            //out('processing letter ' + l);
            let flag: CliCtxFlag = map2Letters.get(l);
            //out('got command ' + flag.getCmd() + ' for letter ' + l);
            this.map.set(flag.getCmd(), new CliCtxArg(flag));
          }
        } else {
          throw Error('Unable to process command line argument ; ' + a);
        }
      }
    }
    if (this.map.has('debug')) {
      this.out('Processing commands HELP and VERSION with ' + JSON.stringify(this.map));
      let val = this.map.get(VERSION.cmd);
      if (val == undefined) {
        this.out('this.map.get(VERSION.cmd) is undefined');
      } else {
        this.out('this.map.get(VERSION.cmd) is ' + JSON.stringify(val));
      }
    }
    if (this.map.get(HELP.cmd) != undefined) {
      //print the help menu;
      out('This program understands the following commands;\n');
      for (var i = 0; i < flags.length; i++) {
        let flag: I_CliCtxFlag = flags[i];
        var m = '\t--' + flag.cmd;
        if (flag.letter != undefined) {
          m = m + ' / -' + flag.letter;
        }
        out(m);
        if (flag.description != undefined) {
          out('\t\t' + flag.description);
        }
      }
      this.done = true;
    } else if (this.map.get(VERSION.cmd) != undefined) {
      //The old code would read from the package.json file that this deploys with, now we need to sync manually oh well
      // also update this in the package.json file
      // package.json.version
      out("1.4.0");
      /*
      console.log('Trying to read the version number from the slink install package.json at');
      console.log('this.home = ' + this.home + " + package.json");
      let homePkgJsonName: Path = new Path(this.home.getParts().concat('package.json'));
      console.log('homePkgJsonName = ' + homePkgJsonName.toPathString());

      //out('Got homePkgJson ' + homePkgJson + ' fs is ' + fs);
      let jObj = JSON.parse(this.fs.readFileSync(homePkgJsonName.toPathString()));
      //out('Got JSON ' + jObj);
      this.print(jObj.version);
      if (this.map.has(DEBUG.cmd)) {
        this.print('from file: ' + homePkgJsonName.toPathString());
      }
      */
      this.done = true;
    }
  }
  getDir(): Path { return this.dir; }
  getHome(): Path { return this.home; }
  public run(cmd: string, args: string[], options?: any): any {
    return this.shellRun.run(cmd, args, options);
  }

  isBash(): boolean {
    if (this.map.has(DEBUG.cmd)) {
      out('process.env.SHELL is ' + process.env.SHELL);
    }
    if (process.env.SHELL != undefined) {
      if (process.env.SHELL.toLocaleLowerCase().includes('bash')) {
        return true;
      }
    }
    return false;
  }
  isDebug(): boolean { return this.map.has(DEBUG.cmd); }
  isDone(): boolean { return this.done; }
  isWindows(): boolean { return IS_WINDOWS; }


  /**
   * Checks if the context is set to debug 
   * and if so prints the message, if you want to print regarless use print
   * @param message 
   */
  out(message: string) {
    if (this.map.has(DEBUG.cmd)) {
      console.log(message);
    }
    if (this.map.has(LOG.cmd)) {
      this.log.log(message + '\n');
    }
  }
  print(message: string) { console.log(message); }
  setDir(): void {
    let arg: CliCtxArg = this.map.get(DIR.cmd);
    var dir: string = process.cwd();
    if (arg == undefined) {
      if (this.map.has('trace')) {
        out('process.env is ' + JSON.stringify(process.env));
      }
      if (process.env.PWD != undefined) {
        var dir: string = process.env.PWD;
        if (this.map.has('debug')) {
          out('process.env.PWD is ' + dir);
        }
      }
      if (dir == undefined) {
        throw Error('Unable to determine the current working directory, please specify it with --dir <someFolder/>');
      }
    } else {
      dir = this.map.get(DIR.cmd).getArg();
    }
    if (this.map.has('debug')) {
      out('before toOsPath CliCtx.dir is ' + dir);
    }
    this.dir = Paths.toParts(dir, false);
    if (this.map.has('debug')) {
      out('after toOsPath CliCtx.dir is ' + this.dir.toString());
    }
    if (this.map.has(LOG.cmd)) {
      let logFileName = new Path(this.dir.getParts().concat('slink.log'), false, IS_WINDOWS).toPathString();
      out('writing to logfile ' + logFileName);
      this.log.setFileName(logFileName);
    }
  }

  public inMap(key: string): boolean {
    if (this.map.has(key)) {
      return true;
    }
    return false;
  }

  public logCmd(cmdWithArgs: string, spawnSyncReturns: any, options?: any): void {
    if (this.map.has(DEBUG.cmd)) {
      this.out('ran ' + cmdWithArgs);
    }
    if (options != undefined) {
      if (options.cwd != undefined) {
        if (this.map.has(DEBUG.cmd)) {
          this.out('\tin ' + options.cwd);
        }
      } else {
        if (this.map.has(DEBUG.cmd)) {
          this.out('\tin ' + ctx.getDir());
        }
      }
    } else {
      if (this.map.has(DEBUG.cmd)) {
        this.out('\tin ' + ctx.getDir());
      }
    }
    if (this.map.has(DEBUG.cmd)) {
      this.out('\tand the spawnSyncReturns had;');
    }
    if (spawnSyncReturns.error != undefined) {
      if (this.map.has(DEBUG.cmd)) {
        this.out('\tError: ' + spawnSyncReturns.error);
        this.out('\t\t' + spawnSyncReturns.error.message);
      }
    }
    if (spawnSyncReturns.stderr != undefined) {
      if (this.map.has(DEBUG.cmd)) {
        this.out('\tStderr: ' + spawnSyncReturns.stderr);
      }
    }
    if (spawnSyncReturns.stdout != undefined) {
      if (this.map.has(DEBUG.cmd)) {
        this.out('\tStdout: ' + spawnSyncReturns.stdout);
      }
    }
  }
}

export class FsContext {
  private ctx: CliCtx;
  private fs: I_Fs;
  
  constructor(cliCtx: CliCtx, mockFs?: I_Fs) {
    this.ctx = cliCtx;
    if (mockFs != undefined) {
      this.fs = mockFs;
    } else {
      this.fs = new FsStub();
    }
  }

  /**
   * This generally runs a ls command and looks for package.json in the output
   * @param path
   */
  existsAbs(path: Path): boolean {
    if (ctx.isDebug()) {
      ctx.out("in existsAbs with path (toUnix) " + Paths.toUnix(path));
      // hmm circular structure ;
      //ctx.out("in existsAbs ctx " + JSON.stringify(ctx));
    }
    if (ctx.isWindows()) {
      //existsSync s broken! for symblic links at least, this is clugy hack
      if (ctx.isBash()) {
        let ssr: any = ctx.run('ls', [Paths.toUnix(path)], ctx);
        if (ssr.error != undefined) {
          //assume an error is a failure
          return false;
        } else if (ssr.output != undefined) {
          if (ssr.output.toString().includes('No such file or directory')) {
            return false;
          }
        }
        return true;
      } else {
        let ssr: any = ctx.run('dir', [Paths.toUnix(path)]);
        if (ssr.error != undefined) {
          ctx.out("ssr.error " + JSON.stringify(ssr.error));
          //assume an error is a failure
          return false;
        } else if (ssr.output != undefined) {
          if (ssr.output.toString().includes('No such file or directory')) {
            return false;
          }
        }
        return true;
      }
    } else {
      let ssr: any = ctx.run('ls', [Paths.toUnix(path)]);
      if (ssr.error != undefined) {
        //assume an error is a failure
        return false;
      }
      return true;
    }

  }

  exists(relativePathParts: Path, inDir: Path): boolean {
    if (ctx.isDebug()) {
      ctx.out("in exists with path (toUnix) " + Paths.toUnix(relativePathParts) + " in " + Paths.toUnix(inDir));
    }
    if (ctx.isWindows()) {
      //existsSync s broken! for symblic links at least, this is clugy hack
      if (ctx.isBash()) {
        let ssr: SpawnSyncReturns<string> = ctx.run('ls', [Paths.toUnix(relativePathParts)],
          { cwd: Paths.toWindows(inDir) });
        if (ssr.error != undefined) {
          //assume an error is a failure
          return false;
        } else if (ssr.output != undefined) {
          if (ssr.output.toString().includes('No such file or directory')) {
            return false;
          }
        }
        return true;
      } else {
        let ssr: any = ctx.run('dir', [Paths.toUnix(relativePathParts)],
          { cwd: Paths.toWindows(inDir) });
        if (ssr.error != undefined) {
          //assume an error is a failure
          return false;
        } else if (ssr.output != undefined) {
          if (ssr.output.toString().includes('No such file or directory')) {
            return false;
          }
        }
        return true;
      }
    } else {
      let ssr: any = ctx.run('ls', [Paths.toUnix(relativePathParts)],
        { cwd: Paths.toUnix(inDir) });
      if (ssr.error != undefined) {
        //assume an error is a failure
        return false;
      }
      return true;
    }

  }

  getFs(): I_Fs { return this.fs; }
  
  mkdir(dir: string, inDir: Path) {
    if (ctx.isWindows()) {
      //existsSync s broken!
      if (ctx.isBash()) {
        ctx.run('mkdir', [dir], { cwd: Paths.toWindows(inDir) });
      } else {
        ctx.run('mkdir', [dir], { cwd: Paths.toWindows(inDir) });
      }
    } else {
      ctx.run('mkdir', [dir], { cwd: Paths.toUnix(inDir) });
    }
  }

  mkdirTree(dirs: Path, inDir: Path): Path {
    var dirNames: string[] = dirs.getParts();
    for (var i = 0; i < dirNames.length; i++) {
      let dir: string = dirNames[i];
      if (!this.exists(new Path([dir], true, inDir.isWindows()), inDir)) {
        this.mkdir(dir, inDir);
      }
      inDir = new Path(inDir.getParts().concat(dir), false, inDir.isWindows());
    }
    return inDir;
  }

  read(path: Path, charset?: string): any {
    try {
      if (ctx.isWindows()) {
        //don't use unix files for gitbash here
        let p: string = Paths.toWindows(path);
        if (ctx.isDebug()) {
          ctx.out('reading ' + p);
        }
        return fs.readFileSync(p);
      } else {
        let p: string = Paths.toUnix(path);
        if (ctx.isDebug()) {
          ctx.out('reading ' + p);
        }
        return fs.readFileSync(p);
      }
    } catch (e) {
      ctx.print('Error reading file ' + path.toString())
      ctx.print(e.message);
      throw e;
    }
  }

  readJson(path: Path): any {
    return JSON.parse(this.read(path));
  }

  rm(pathParts: Path, inDir: Path) {
    if (ctx.isDebug()) {
      ctx.out("in rm (toUnix) " + Paths.toUnix(pathParts) + " in " + Paths.toUnix(inDir));
    }
    if (this.exists(pathParts, inDir)) {
      if (ctx.isWindows()) {
        //existsSync s broken!
        if (ctx.isBash()) {
          ctx.run('rm', ['-fr', Paths.toUnix(pathParts)], { cwd: Paths.toWindows(inDir) });
        } else {
          ctx.run('rmdir', ['/s', Paths.toWindows(pathParts)], { cwd: Paths.toWindows(inDir) });
        }
      } else {
        ctx.run('rm', ['-fr', Paths.toUnix(pathParts)], { cwd: Paths.toUnix(inDir) });
      }
    }
  }

  /**
   * create a new symbolic link
   */
  slink(slinkName: string, toDir: Path, inDir: Path) {
    if (ctx.isWindows()) {
      var toDirP = Paths.toWindows(toDir);
      if (ctx.isDebug()) {
        ctx.print("Linking to " + toDirP);
      }
      var options = { cwd: Paths.toWindows(inDir), shell: windowCmdPath, keepShell: true }
      //var options ={ cwd:  Paths.toUnix(inDir), shell: process.env.SHELL}
      if (ctx.isDebug()) {
        ctx.out("Using shell " + options.shell + " in Windows dir " + options.cwd);
      }
      //ctx.run('which', ['mklink.cmd'], options);
      ctx.run(process.env.MKLINK_CMD, [slinkName, toDirP], options);
      //ctx.run('mklink.cmd '+ slinkName + ' ' + toDirP, [], options);
    } else {
      ctx.run('ln', ['-s', '-T', Paths.toUnix(toDir), slinkName], { cwd: Paths.toUnix(inDir) });
    }
  }
}
export interface I_DependencySLinkGroup {
  group: string;
  projects: I_DependencySLinkProject[];
}

export interface I_DependencySLinkProject {
  project: string;
  modulePath: string;
}

export class DependencySLinkGroup {
  private group: string;
  private projects: DependencySLinkProject[];
  private unixIn: string;
  private unixTo: string;

  constructor(info: I_DependencySLinkGroup, ctx: CliCtx) {
    this.group = info.group;
    this.projects = DependencySLinkProject.to(this.group, info.projects, ctx);
    this.unixIn = 'node_modules/' + this.group;
  }
  getGroup(): string { return this.group; }
  getProjects(): DependencySLinkProject[] { return this.projects; }
  getUnixIn(): string { return this.unixIn; }
  getUnixTo(): string { return this.unixTo; }
}

export class DependencySLinkProject {
  static to(group: string, projects: I_DependencySLinkProject[], ctx: CliCtx): DependencySLinkProject[] {
    let r = new Array(projects.length);
    for (var i = 0; i < projects.length; i++) {
      r[i] = new DependencySLinkProject(group, projects[i], ctx);
    }
    return r;
  }
  private project: string;
  private modulePath: string;
  private unixTo: Path;

  constructor(group: string, info: I_DependencySLinkProject, ctx: CliCtx) {
    this.project = info.project;
    this.modulePath = info.modulePath;
    this.unixTo = Paths.toParts('../../../' + info.project + '/src', true);
  }

  getProjectName(): string { return this.project; }
  getModluePath(): string { return this.modulePath; }
  getUnixTo(): Path { return this.unixTo; }

  toString(): string {
    return 'DependencySLinkProject [project=\'' + this.project + '\', modulePath=\'' +
      this.modulePath + '\', unixTo=\'' + this.unixTo + '\']';
  }
}

export interface I_DependencySrcSLink {
  project: string;
  srcPath: string;
  destPath: string;
}

export class DependencySrcSLink {
  private unixIn: string;
  private unixTo: string;
  private name: string;

  constructor(slink: I_DependencySrcSLink, ctx: CliCtx) {
    this.name = slink.project + '@slink';
    if (slink.destPath == undefined) {
      this.unixIn = 'src';
    } else {
      this.unixIn = slink.destPath;
    }
    if (slink.srcPath == undefined) {
      this.unixTo = '../../' + slink.project + '/src';
    } else {
      this.unixTo = '../../' + slink.project + slink.srcPath;
    }
  }
  getUnixIn(): string { return this.unixIn; }
  getName(): string { return this.name; }
  getUnixTo(): string { return this.unixTo; }
  toString(): string {
    return 'DependencySLink [name=\'' + this.name + '\', unixIn=\'' + this.unixIn +
      '\', unixTo=\'' + this.unixTo + '\']';
  }
}

export class SLinkRunner {
  private ctx: CliCtx;
  private fsCtx: FsContext;

  constructor(ctx: CliCtx) {
    this.ctx = ctx;
    this.fsCtx = new FsContext(ctx);
  }

  run() {
    if (this.ctx.isDone()) {
      return;
    }

    this.ctx.setDir();
    if (this.ctx.isDebug()) {
      this.ctx.out("In SLinkRunner after ctx.setDir");
    }

    let currentDir: Path = new Path(this.ctx.getDir().getParts(), false, this.ctx.isWindows());
    let currentPkgJsonPath: Path = new Path(this.ctx.getDir().getParts().concat('package.json'), false, this.ctx.isWindows());
    let currentPkgJson: string = currentPkgJsonPath.toPathString();

    if (currentPkgJson.length >= 20) {
      let slinkHomeCheck = currentPkgJson.substring(currentPkgJson.length - 20, currentPkgJson.length);
      if ('/slink/package.json' == currentPkgJson) {
        throw Error('The current working directory is coming from the slink installation,' +
            'please set the current working directory using --dir <someDirectory/>.');
      }
    }

    if (!this.fsCtx.existsAbs(currentDir)) {
      this.ctx.print('Aborting couldn\'t find a package.json file at;');
      this.ctx.print(currentPkgJsonPath.toPathString());
      return;
    }

    let json = this.fsCtx.readJson(currentPkgJsonPath);

    // Handle shared node modules via environment variable
    if (json.sharedNodeModuleProjectSLinkEnvVar && json.sharedNodeModuleProjectSLinkEnvVar.length > 0) {
      this.handleSharedNodeModulesViaEnvVar(json.sharedNodeModuleProjectSLinkEnvVar);
    } else if (json.sharedNodeModuleProjectSLinks && json.sharedNodeModuleProjectSLinks.length > 0) {
      // Handle shared node modules via project links
      this.handleSharedNodeModulesViaProjectLinks(json.sharedNodeModuleProjectSLinks);
    }

    // Handle existing dependency source links
    this.handleDependencySrcSLinks(json.dependencySrcSLinks);

    // Handle existing dependency link groups
    this.handleDependencySLinkGroups(json.dependencySLinkGroups);
  }

  private handleSharedNodeModulesViaEnvVar(envVars: string[]) {
    if (this.ctx.isDebug()) {
      this.ctx.out("Processing sharedNodeModuleProjectSLinkEnvVar: " + JSON.stringify(envVars));
    }

    for (const envVar of envVars) {
      const envValue = process.env[envVar];
      if (envValue) {
        if (this.ctx.isDebug()) {
          this.ctx.out(`Found environment variable ${envVar} with value ${envValue}`);
        }

        // Remove existing node_modules if it exists
        this.fsCtx.rm(new Path(['node_modules'], true), this.ctx.getDir());

        // Create symlink to the environment variable path
        const targetPath = Paths.toParts(envValue, false);
        if (this.ctx.isDebug()) {
          this.ctx.out(`Creating symlink from node_modules to ${Paths.toOs(targetPath)}`);
        }
        this.fsCtx.slink('node_modules', targetPath, this.ctx.getDir());
        return; // Use the first valid environment variable
      } else {
        if (this.ctx.isDebug()) {
          this.ctx.out(`Environment variable ${envVar} not found or empty`);
        }
      }
    }
  }

  private handleSharedNodeModulesViaProjectLinks(projectNames: string[]) {
    if (this.ctx.isDebug()) {
      this.ctx.out("Processing sharedNodeModuleProjectSLinks: " + JSON.stringify(projectNames));
    }

    // Get parent directory
    var currentDirParts = this.ctx.getDir().getParts();
    if (currentDirParts.length < 2) {
      this.ctx.out("Cannot find parent directory, current directory is too shallow");
      return;
    }

    while (currentDirParts.length >= 1) {
      const parentDirParts = currentDirParts;

      const parentDir = new Path(parentDirParts, false, this.ctx.isWindows());

      for (const projectName of projectNames) {
        // Check if project exists in parent directory
        const projectPath = new Path(parentDirParts.concat(projectName), false, this.ctx.isWindows());

        if (this.fsCtx.existsAbs(projectPath)) {
          if (this.ctx.isDebug()) {
            this.ctx.out(`Found project ${projectName} at ${Paths.toOs(projectPath)}`);
          }

          // Check if node_modules exists in the project
          const nodeModulesPath = new Path(projectPath.getParts().concat('node_modules'), false, this.ctx.isWindows());

          if (!this.fsCtx.existsAbs(nodeModulesPath)) {
            // Run npm install in the project directory
            if (this.ctx.isDebug()) {
              this.ctx.out(`node_modules not found in ${projectName}, running npm install`);
            }
            this.ctx.run('npm', ['install'], { cwd: Paths.toOs(projectPath) });
          }

          // Remove existing node_modules if it exists
          this.fsCtx.rm(new Path(['node_modules'], true), this.ctx.getDir());

          // Create symlink to the project's node_modules
          if (this.ctx.isDebug()) {
            this.ctx.out(`Creating symlink from node_modules to ${Paths.toOs(nodeModulesPath)}`);
          }
          this.fsCtx.slink('node_modules', nodeModulesPath, this.ctx.getDir());
          return; // Use the first valid project
        } else {
          if (this.ctx.isDebug()) {
            this.ctx.out(`Project ${projectName} not found at ${Paths.toOs(projectPath)}`);
          }
        }
        if (currentDirParts.length == 1) {
          return;
        }
        currentDirParts = currentDirParts.slice(0, currentDirParts.length - 1)
        if (ctx.isDebug()) {
          ctx.out("In handleSharedNodeModulesViaProjectLinks with currentDirParts " + currentDirParts);
        }
      }
    }
  }

  private handleDependencySrcSLinks(slinks: I_DependencySrcSLink[]) {
    if (!slinks || slinks.length === 0) {
      return;
    }

    for (let i = 0; i < slinks.length; i++) {
      let dl = new DependencySrcSLink(slinks[i], this.ctx);
      if (this.ctx.isDebug()) {
        this.ctx.out(dl.toString());
      }

      let unixIn: Path = Paths.toParts(dl.getUnixIn(), true);
      let unixTo: Path = Paths.toParts(dl.getUnixTo(), true);
      let slinkIn: Path = Paths.find(this.ctx.getDir(), unixIn);
      let slinkTo: Path = Paths.find(slinkIn, unixTo);

      this.fsCtx.rm(new Path([dl.getName()], true), slinkIn);
      if (this.ctx.isDebug()) {
        this.ctx.out("\n\nCreating slink for dependency source");
      }
      this.fsCtx.slink(dl.getName(), slinkTo, slinkIn);
      if (this.ctx.isDebug()) {
        this.ctx.out("Created slink for dependency source\n\n");
      }
    }
  }

  private handleDependencySLinkGroups(linkGroups: I_DependencySLinkGroup[]) {
    if (!linkGroups || linkGroups.length === 0) {
      return;
    }

    for (let i = 0; i < linkGroups.length; i++) {
      let g = new DependencySLinkGroup(linkGroups[i], this.ctx);
      let unixIn: Path = Paths.toParts(g.getUnixIn(), true);
      this.fsCtx.rm(unixIn, this.ctx.getDir());
      let gPath: Path = this.fsCtx.mkdirTree(unixIn, this.ctx.getDir());

      g.getProjects().forEach((p) => {
        if (p.getModluePath() == undefined) {
          throw Error('The module path MUST be defined for ' + p.toString() + '\n\tin ' + g.toString())
        }
        if (this.ctx.isDebug()) {
          this.ctx.out("\n\nCreating group " + g.getGroup());
        }
        this.fsCtx.slink(p.getModluePath(), p.getUnixTo(), gPath);
        if (this.ctx.isDebug()) {
          this.ctx.out("Created group " + g.getGroup() + " \n\n");
        }
      });
    }
  }
}

// Replace the main script with the SLinkRunner
export const DEFAULT: I_CliCtxFlag = {cmd: "default", description: "Deletes stuff in node_modules and adds the symbolic links\n" +
      "\t\tdetails are here;\n" +
      "\t\thttps://github.com/adligo/slink.ts.adligo.org", flag: true, letter: "d"}
export const DIR: I_CliCtxFlag = {cmd: "dir", description: "A parameter passing the working directory to run the application in, \n" +
      "conventionally through --dir `pwd`.  Note the Backticks.", flag: false}
export let flags: I_CliCtxFlag[] = [DEBUG, DIR, DEFAULT, LOG, HELP, VERSION];
export let ctx = new CliCtx(flags, process.argv, 2);

// Create and run the SLinkRunner
const runner = new SLinkRunner(ctx);
runner.run();

