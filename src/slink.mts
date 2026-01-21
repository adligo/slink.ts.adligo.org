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
import {Buffer} from 'buffer';
import * as fs from 'fs';
import {PathLike, PathOrFileDescriptor, WriteFileOptions} from 'fs';
import {spawnSync, SpawnSyncOptions, SpawnSyncReturns} from 'child_process';

// ###########################  Constants ################################
//The old code would read from the package.json file that this deploys with, now we need to sync manually oh well
// also update this in the package.json file
// package.json.version
export const VERSION_NBR: string = "1.6.1d";

// ########################### Interfaces ##################################
export interface I_CliCtx {
  /**
   * wrapps process.env[name]
   * @param name
   */
  envVar(name: string): string;
  /**
   * This is the absolute path of the current directory
   * as a Unix path (although you might be running on Windows).
   */
  getDir(): Path;

  getFs(): I_Fs;

  getKeys(): string[];
  
  getShell(): string;
  
  getShellOptionsFactory(): ShellOptionsFactory;

  getValue(key: string): CliCtxArg;

  getHome(): Path;

  run(cmd: string, args: string[]): any;

  runE(cmd: string, args: string[], options?: any, logLevel?: number): any;
  
  isBash(): boolean;

  isDebug(): boolean;

  isDone(): boolean;

  isInMap(key: string): boolean;

  isWindows(): boolean;

  logCmd(cmdWithArgs: string, spawnSyncReturns: any, options?: any, logLevel?: number): void;

  getProc(): I_Proc;
  /**
   * Checks if the context is set to debug
   * and if so prints the message, if you want to print regarless use print
   * @param message
   */
  out(message: string): void;

  print(message: string): void;

  setDir(): void;
}

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

export interface I_CliCtxLog {
  log(message: string): void;

  setFileName(fileName: string): void;
}

/**
 * @deprecated remove in 2030
 */
export interface I_DependencySLinkGroup {
  group: string;
  projects: I_DependencySLinkProject[];
}


/**
 * @deprecated remove in 2030
 */
export interface I_DependencySLinkProject {
  project: string;
  modulePath: string;
}

/**
 * @deprecated remove in 2030
 */
export interface I_DependencySrcSLink {
  project: string;
  srcPath: string;
  destPath: string;
}

/**
 * I_Fs provides the ability to stub out functions like readFileSync
 * for testing
 */
export interface I_Fs {
  /**
   * Updates a file
   */
  appendFileSync(
    path: PathOrFileDescriptor,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ): void;

  /**
   * Copies a file
   */
  copyFileSync(src: PathOrFileDescriptor, dest: PathOrFileDescriptor): void;
  
  /**
   * @param path the OS dependent absolute path
   * @returns the string that represents the path that a Symlink is pointing at.
   */
  getSymlinkTarget(path: string): string;

  /**
   * @param path the OS dependent relative path
   * @param parentPath the absolute OS dependent path of the parent directory.
   * @returns the string that represents the relative path that a Symlink is pointing at.
   */
  getSymlinkTargetRelative(relativePath: string, parentPath: string, pathSeperator: string): string;

  /**
   * Identifies if this path is a Symlink or not
   * @param path the OS dependent absolute path
   * @returns True if the symlink exists, false otherwise.
   */
  isSymlink(path: string): boolean;

  readdirSync(
      path: PathLike,
      options?: {encoding: BufferEncoding | null, withFileTypes?: false | undefined, recursive?: boolean | undefined} | BufferEncoding | null,
  ): string[];

  /**
   * Reads a file
   */
  readFileSync(path: PathOrFileDescriptor, optionsFlag?: string | undefined): string | undefined;
}

/**
 * I_FsContext provides the ability to stub out functions like mkdir
 * for testing
 */
export interface I_FsContext {
  /**
   * This determines if a path (folder or file) exists.
   * @param path
   */
  existsAbs(path: Path): boolean;

  /**
   * This determines if a path (folder or file) exists.
   * @param relativePathParts
   * @param inDir
   */
  exists(fileOrDir: string, inDir: Path): boolean;

  getFs(): I_Fs;

  /**
   * @param dir the absolute path of the Symlink
   * @returns The string of the Symlink target, or a empty string '' if this can not be determined.
   */
  getSymlinkTarget(dir: Path): Path;
  
  /**
   * @param dir the absolute path of the Symlink
   * @returns True if the absolute path is a Symlink, false otherwise. 
   */
  isSymlink(dir: Path): boolean;
  
  /**
   * @param path the OS dependent relative path
   * @param parentPath the absolute OS dependent path of the parent directory.
   * @returns the string that represents the relative path that a Symlink is pointing at.
   */
  getSymlinkTargetRelative(relativePath: Path, parentPath: Path): Path;
  
  mkdir(dir: string, inDir: Path): void;

  mkdirTree(dirs: Path, inDir: Path): Path;

  read(path: Path, charset?: string): any;

  readJson(path: Path): any;

  rd(dir: string, inDir: Path): void;
  
  rm(dir: string, inDir: Path): void;

  /**
   * create a new symbolic link
   */
  slink(slinkName: string, toDir: Path, inDir: Path): void;
}

/**
* I_SlinkConsole provides the ability to stub out console.log
* for testing
*/
export interface I_SlinkConsole {
  out(message: string): void;
}

/**
 * I_Path represents a directory and or file path
 */
interface I_Path {
  hasParent(): boolean;

  isRelative(): boolean;

  isRoot(): boolean;

  isWindows(): boolean;

  getParts(): string[];

  getParent(): I_Path;

  toString(): string;

  toUnix(): string;

  toWindows(): string;

  child(path: string): I_Path;
}

/**
 * I_Proc provides the ability to stub out process.env and process.env.SHELL
 * for testing
 */
export interface I_Proc {
  /**
   * wrapps process.argv
   */
  argv(): string[];

  /**
   * the Current Working Directory
   * wrapps process.cws
   */
  cwd(): string;
  /**
   * wrapps process.env
   */
  env(): any;

  /**
   * wrapps process.env[name]
   * @param name
   */
  envVar(name: string): string;

  /**
   * wrapps console.error and is used to notify calling scripts that this script has NOT completed successfully 
   * by writing the test process.exit to the stderr.  So that calling scripts can look for 'process.exit', as I was unable to find the actual
   * error code number from the spawnSyncReturns object.
   * @param name
   */
  error(message: string);
  /** 
   * This exits the current program, wrapps process.exit
   */
  exit(code: number);
  
  getPathSeperator(): string;
  /**
   * return true if it's windows otherwise false
   */
  isWindows(): boolean;
  /**
 * wrapps process.env.SHELL
 */
  shell(): string;
}

export interface I_SpawnSync {
  spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer<ArrayBufferLike>>;
}

// ################################ Stubs ###########################################
export class SlinkConsoleStub implements I_SlinkConsole {
  out(message: string) {
    outStatic(message)
  }
}

export class SpawnSyncStub implements I_SpawnSync {
  spawnSync(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer<ArrayBufferLike>> {
    return spawnSync(command, args, options);
  }
}

export class FsStub implements I_Fs {
  appendFileSync(
    path: fs.PathOrFileDescriptor,
    data: string | Uint8Array,
    options?: WriteFileOptions,
  ): void {
    fs.appendFileSync(path, data, options);
  }

  /**
   * @see {@link I_Fs#_copyFileSync}
   */
  public copyFileSync(src: PathLike, dest: PathLike, mode?: number): void {
    fs.copyFileSync(src, dest, mode);
  }
  
  /*
  doesn't work hmm fell back to bash commands for this
  existsSync(
      path: fs.PathLike,
  ): boolean {
    return fs.existsSync(path);
  }
   */

  /**
   * @see {@link I_Fs#getSymlinkTarget}
   */
  getSymlinkTarget(path: string): string {
    return fs.realpathSync(path);
  }

  /**
   * @see {@link I_Fs#getSymlinkTargetRelative}
   */
  getSymlinkTargetRelative(relativePath: string, parentPath: string, pathSeperator: string): string {
    let r = fs.realpathSync(parentPath + pathSeperator + relativePath);
    if (r.length < parentPath.length) {
      throw new Error('The following absolute path;\n\t' + r + '\n does not appear to be under\n\t' + parentPath);
    }
    return r.substring(parentPath.length + 1, r.length);
  }

  /**
   * @see {@link I_Fs#isSymlink}
   */
  isSymlink(path: string): boolean {
    let stats = fs.lstatSync(path);
    return stats.isSymbolicLink();
  }

  readdirSync(
      path: PathLike,
      options?: {encoding: BufferEncoding | null, withFileTypes?: false | undefined, recursive?: boolean | undefined} | BufferEncoding | null,
  ): string[] {
    return fs.readdirSync(path, options);
  }

  readFileSync(path: PathOrFileDescriptor, optionsFlag?: string | undefined): string | undefined {
    let options = null;
    if (optionsFlag != null && optionsFlag != undefined) {
      options ={ flag: optionsFlag }
    }
    return fs.readFileSync(path, options).toString();
  }
}

/**
 * @see {@link I_Proc}
 */
export class ProcStub implements I_Proc {
  /**
   * @see {@link I_Proc#argv}
   */
  argv(): any {
    return process.argv;
  }
  /**
  * @see {@link I_Proc#cwd}
  */
  cwd(): string {
    return process.cwd();
  }
  /**
   * @see {@link I_Proc#env}
   */
  env(): any {
    return process.env;
  }

  /**
   * @see {@link I_Proc#error}
   */
  error(message: string) {
    console.error(message);
  }
  /**
   * @see {@link I_Proc#envVar}
   */
  envVar(name: string): string {
    return process.env[name];
  }
  
  /**
   * @see {@link I_Proc#exit}
   */
  exit(code: number) {
    process.exit(code);
  }
  
  getPathSeperator() {
    if (this.isWindows()) {
      return '\\';
    } else {
      return '/';
    }
  }

  isWindows(): boolean {
    return process.platform === "win32"
  }
  /**
   * @see {@link I_Proc#shell}
   */
  shell(): string {
    return process.env.SHELL;
  }
}

// ################################### Interface Implementation Constants  #########################################
export const outStatic = (message) => console.log(message);


export const DEBUG: I_CliCtxFlag = { cmd: "debug", description: "Displays debugging information about htis program.", flag: true, letter: "d" }
export const DIR: I_CliCtxFlag = {
  cmd: "dir", description: "A parameter passing the working directory to run the application in, \n" +
    "conventionally through --dir `pwd`.  Note the Backticks.", flag: false
}
export const LOG: I_CliCtxFlag = { cmd: "log", description: "Writes a slink.log file in the run directory.", flag: false, letter: "l" }
export const HELP: I_CliCtxFlag = { cmd: "help", description: "Displays the Help Menu, prints this output.", flag: true, letter: "h" }
export const REMOVE: I_CliCtxFlag = { cmd: "remove", description: "Removes the symlinks.", flag: true, letter: "r" }
export const PUBLISH: I_CliCtxFlag = { cmd: "publish-local", description: "Publishes this compiled javascript to the current symlinked node_modules directory.", flag: true, letter: "p" }
export const VERSION: I_CliCtxFlag = { cmd: "version", description: "Displays the version.", flag: true, letter: "v" }

export const SHELL: I_CliCtxFlag = {
  cmd: "shell", description: "Specifies the shell to use for subprocess execution (e.g., /bin/bash). \n" +
    "Overrides the USHELL environment variable when present.", flag: false, letter: "s"
}

export const FLAGS: I_CliCtxFlag[] = [DEBUG, DIR, LOG, HELP, REMOVE, PUBLISH, SHELL, VERSION];

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}
// ################################## Classes ###########################################
export class ShellRunner {
  console: I_SlinkConsole;
  sSync?: I_SpawnSync = new SpawnSyncStub();
  logLevel: number = LogLevel.INFO;

  constructor(console: I_SlinkConsole, mockSpawnSync?: I_SpawnSync, logLevel?: number) {
    this.console = console;
    if (mockSpawnSync != undefined) {
      this.sSync = mockSpawnSync;
    }
    if (logLevel != undefined) {
      this.logLevel = logLevel;
    }
  }

  public run(cmd: string, args: string[], options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer<ArrayBufferLike>> {
    //stubbed for unit testing
    // fix to 
    // [DEP0190] DeprecationWarning: Passing args to a child process with 
    // shell option true can lead to security vulnerabilities, as the arguments 
    // are not escaped, only concatenated.
    //
    // https://github.com/nodejs/help/issues/5063
    // https://github.com/nodejs/help/issues/5072
    /*
    this.console.out("ShellRunner Running '" + nc + "'");
    this.console.out("cmd is " + cmd);
    this.console.out("args are " + JSON.stringify(args);
    */
    let ssr: SpawnSyncReturns<string | Buffer<ArrayBufferLike>> = this.sSync.spawnSync(cmd, args, options);
    return ssr;
  }
}


export class ShellOptionsFactory {
  
  /**
   * @param ctx
   * @param cwd the current working directory
   */
  public getOptions(ctx: I_CliCtx, cwd: string, logLevel?: number): any {
    var r = new Object();
    r = {...r, cwd: cwd};
    r = {...r, shell: this.getShell(ctx, logLevel)};
    return r;
  }

  /**
   * @param ctx
   * @param cwd the current working directory
   */
  public getOptionsShell(ctx: I_CliCtx, logLevel?: number): any {
    var r = new Object();
    r = {...r, shell: this.getShell(ctx, logLevel)}
    return r;
  }
  
  /**
   * Determines which shell to use for subprocess execution.
   * Priority: 1) --shell command line parameter, 2) USHELL environment variable, 3) default shell
   */
  public getShell(ctx: I_CliCtx, logLevel?: number): string {
    if (logLevel == undefined) {
      logLevel = LogLevel.INFO;
    }
    // Check for --shell command line parameter first (highest priority)
    if (ctx && ctx.isInMap(SHELL.cmd)) {
      let shellArg = ctx.getValue(SHELL.cmd);
      if (shellArg && shellArg.getArg()) {
        if (logLevel <= LogLevel.DEBUG) {
          ctx.out('Using shell from --shell parameter: ' + shellArg.getArg());
        }
        return shellArg.getArg();
      }
    }

    // Check for USHELL environment variable (second priority)
    let ushell = ctx.envVar('USHELL');
    if (ushell) {
      if (logLevel <= LogLevel.DEBUG) {
        ctx.out('Using shell from USHELL environment variable: ' + ushell);
      }
      return ushell;
    }

    // Fall back to default shell (lowest priority)
    let defaultShell = ctx.getShell();
    if (logLevel <= LogLevel.DEBUG) {
      ctx.out('Using default shell: ' + defaultShell);
    }
    return defaultShell;
  }
  
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


export class CliCtxLog implements I_CliCtxLog {
  private fileName?: string;
  private messages: string[] = new Array();
  private fsM: I_Fs;

  constructor(fs?: I_Fs) {
    if (fs == undefined) {
      this.fsM = new FsStub();
    } else {
      this.fsM = fs;
    }
  }

  log(message: string) {
    if (this.fileName == undefined) {
      this.messages = this.messages.concat(message);
    } else {
      this.fsM.appendFileSync(this.fileName, message);
    }
  }

  setFileName(fileName: string) {
    this.fileName = fileName;
    if (this.messages.length > -1) {
      this.messages.forEach((m) => {
        this.fsM.appendFileSync(this.fileName, m);
      });
    }
  }
}


/**
 * This class acts as the main hub for test stubbing
 */
export class CliCtx implements I_CliCtx {
  public static WHEN_RUNNING_SLINK_ON_WINDOWS_YOU_MUST_USE_GITBASH_AS_ADMINISTRATOR = "When running slink on Windows you must use GitBash as Adminsitratior!";
  private done: boolean = false;
  /**
   * This is the current working directory of your shell, if possible
   * sometime you need to pass it in.
   */
  private dir: Path;
  private console: I_SlinkConsole;
  private log: I_CliCtxLog;
  private shellRun: ShellRunner;
  private fsc: FsContext;
  private fs: I_Fs;
  private procIn: I_Proc;
  /**
   * this is the home directory where your application is installed,
   * in the npm shared space of your computer
   */
  private home: Path;
  private map: Map<string, CliCtxArg> = new Map();
  private sof: ShellOptionsFactory = new ShellOptionsFactory();
  
  /**
   * 
   * @param flags 
   * @param args
   * @param log The log to delegate to
   * @param console The console interface to print messages directly
   * @param fs
   * @param proc a wrapper around 'proccess' to stub out things like 'process.env'
   */
  constructor(flags: I_CliCtxFlag[], args?: string[], log?: I_CliCtxLog, console?: I_SlinkConsole, fs?: I_Fs, proc?: I_Proc) {
    // do proc and args
    if (proc != undefined) {
      this.procIn = proc;
    } else {
      this.procIn = new ProcStub();
    }
    if (args == undefined) {
      args = this.procIn.argv();
    }

    // do additional constructor parameter assignments in constructor order
    if (log == undefined) {
      this.log = new CliCtxLog();
    } else {
      this.log = log;
    }
    if (console != undefined) {
      this.console = console;
    } else {
      this.console = new SlinkConsoleStub();
    }
    if (fs != undefined) {
      this.fsc = new FsContext(this, fs);
    } else {
      this.fsc = new FsContext(this, new FsStub());
    }
    this.fs = this.fsc.getFs();
    // When even --debug and --version aren't working
    /*
    console.warn('1.3.7 process.argv are ' + process.argv);
    console.warn('args are ' + args);
    if (args != undefined) {
      console.warn('args are ' + JSON.stringify(args));
    }
    */

    this.shellRun = new ShellRunner(this.console, new SpawnSyncStub(), LogLevel.INFO);

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
    this.home = Paths.toPath(args[1], false);
    let homeParts: string[] = this.home.getParts();
    this.home = Paths.toPath(new Path(homeParts.slice(0, homeParts.length - 2), false, this.isWindows()).toPathString(), false);
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
          i = this.addCliCtxArg(flag, cmd, i, args);
        } else if (a.charAt(0) == '-') {
          //process letters
          for (var j = 1; j < a.length; j++) {
            let l = a.charAt(j);
            //out('processing letter ' + l);
            let flag: CliCtxFlag = map2Letters.get(l);
            i = this.addCliCtxArg(flag, flag.getCmd(), i, args);
          }
        } else {
          throw Error('Unable to process command line argument ; ' + a);
        }
      }
    }
    if (this.isDebug()) {
      this.out("Debug is enabled!");
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
      this.console.out('This program understands the following commands;\n');
      for (var i = 0; i < flags.length; i++) {
        let flag: I_CliCtxFlag = flags[i];
        var m = '\t--' + flag.cmd;
        if (flag.letter != undefined) {
          m = m + ' / -' + flag.letter;
        }
        this.console.out(m);
        if (flag.description != undefined) {
          this.console.out('\t\t' + flag.description);
        }
      }
      this.done = true;
    } else if (this.map.get(VERSION.cmd) != undefined) {
      this.console.out(VERSION_NBR);
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

  envVar(key: string): string {
    return this.procIn.envVar(key);
  }

  getDir(): Path {
    return this.dir;
  }

  getFs(): I_Fs {
    return this.fs;
  }

  getKeys(): string[] {
    return Array.from(this.map.keys());
  }

  getShell(): string {
    return this.procIn.shell();
  }

  getShellOptionsFactory(): ShellOptionsFactory {
    return this.sof;
  }
  
  getValue(key: string): CliCtxArg {
    return this.map.get(key);
  }

  getHome(): Path {
    return this.home;
  }

  run(cmd: string, args: string[]): SpawnSyncReturns<string | Buffer<ArrayBufferLike>> {
    let options = this.sof.getOptions(this, Paths.toOs(this.dir, this.isWindows()), LogLevel.INFO);
    let ssr =  this.shellRun.run(cmd, args, options);
    var nc = cmd
    if (args.length >= 1) {
      nc += ' ' + args.join(' ');
    }
    this.logCmd(nc, ssr, options);
    return ssr;
  }
  
  runE(cmd: string, args: string[], options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer<ArrayBufferLike>> {
    if (this.map.has(DEBUG.cmd)) {
      this.out('runE ' + cmd + " args are " + JSON.stringify(args));
    }
    let ssr =  this.shellRun.run(cmd, args, options);
    var nc = cmd
    if (args.length >= 1) {
      nc += ' ' + args.join(' ');
    }
    this.logCmd(nc, ssr, options);
    return ssr;
  }

  isBash(): boolean {
    let shell = this.procIn.shell();
    if (this.map.has(DEBUG.cmd)) {
      this.out('process.env.SHELL is ' + shell);
    }
    if (shell != undefined) {
      if (shell.toLocaleLowerCase().includes('bash')) {
        return true;
      }
    }
    return false;
  }

  isDebug(): boolean {
    return this.map.has(DEBUG.cmd);
  }

  isDone(): boolean {
    return this.done;
  }

  isInMap(key: string): boolean {
    return this.map.has(key);
  }

  isWindows(): boolean {
    return this.procIn.isWindows();
  }

  /**
   * Prints to the javascript console and also the log file when logging to a file
   * @param message
   */
  out(message: string) {
    this.log.log(message);
    this.console.out(message);
  }

  print(message: string) {
    this.console.out(message);
  }

  getProc(): I_Proc {
    return this.procIn;
  }

  setDir(): void {
    let arg: CliCtxArg = this.map.get(DIR.cmd);
    var dir: string = process.cwd();
    if (arg == undefined) {
      if (this.map.has('trace')) {
        this.out('process.env is ' + JSON.stringify(process.env));
      }
      if (process.env.PWD != undefined) {
        var dir: string = process.env.PWD;
        if (this.map.has('debug')) {
          this.out('process.env.PWD is ' + dir);
        }
      }
      if (dir == undefined) {
        throw Error('Unable to determine the current working directory, please specify it with --dir <someFolder/>');
      }
    } else {
      dir = this.map.get(DIR.cmd).getArg();
    }
    if (this.map.has('debug')) {
      this.out('before toOsPath CliCtx.dir is ' + dir);
    }
    this.dir = Paths.toPath(dir, false);
    if (this.isDebug()) {
      this.out('after toOsPath CliCtx.dir is ' + this.dir.toString());
    }
    if (this.map.has(LOG.cmd)) {
      let logFileName = new Path(this.dir.getParts().concat('slink.log'), false, this.isWindows()).toPathString();
      this.out('writing to logfile ' + logFileName);
      this.log.setFileName(logFileName);
    }
  }

  logCmd(cmdWithArgs: string, spawnSyncReturns: SpawnSyncReturns<string | Buffer<ArrayBufferLike>>, options?: SpawnSyncOptions): void {

    if (this.isDebug()) {
      this.out('ran ' + cmdWithArgs + ' in \n\t' + options.cwd);
    }
    if (options != undefined) {
      if (options.cwd != undefined) {
        if (this.isDebug()) {
          this.out('\tin ' + options.cwd);
        }
      } else {
        if (this.isDebug()) {
          this.out('\tin ' + this.getDir());
        }
      }
    } else {
      if (this.isDebug()) {
        this.out('\tin ' + this.getDir());
      }
    }
    if (this.isDebug()) {
      this.out('\tand the spawnSyncReturns had;');
    }
    if (spawnSyncReturns.error != undefined) {
      if (this.isDebug()) {
        this.out('Error: ' + spawnSyncReturns.error);
        this.out('Error Message: ' + spawnSyncReturns.error.message);
        this.out('Error Stack: ' +spawnSyncReturns.error.stack);
        var cause: Error | undefined = spawnSyncReturns.error.cause as Error | undefined;
        var counter = 1;
        while (cause != undefined)  {
          this.out('\n\nError Cause ' + counter +': ' + cause.message);
          this.out('Error Cause ' + counter +' Stack: ' + cause.stack);
          cause = cause.cause as Error | undefined;
          counter++;
        }
      }
    }
    if (spawnSyncReturns.stderr != undefined) {
      if (this.isDebug()) {
        this.out('\tStderr: ' + spawnSyncReturns.stderr);
      }
    }
    if (spawnSyncReturns.stdout != undefined) {
      if (this.isDebug()) {
        if (spawnSyncReturns.stdout.length >= 100) {
          if (this.isDebug()) {
            this.out('\tStdout: ' + spawnSyncReturns.stdout);
          } else {
            this.out('\tStdout: ' + spawnSyncReturns.stdout.slice(0, 100) + ' ... \n');
          }
        } else {
          this.out('\tStdout: ' + spawnSyncReturns.stdout);
        }
      }
    }
    if (spawnSyncReturns.status != 0) {
      throw new Error('The command ' + cmdWithArgs + ' in dir \n\t' + options.cwd + ' \n\t Failed with exit code: ' + spawnSyncReturns.status);
    }
  }
  
  private addCliCtxArg(flag: CliCtxFlag, cmd: string, i: number, args: string[]) {
    if (flag.isFlag()) {
      this.map.set(cmd, new CliCtxArg(flag));
    } else if (i + 1 < args.length) {
      let arg = args[i + 1];
      i++;
      this.map.set(cmd, new CliCtxArg(flag, arg));
    } else {
      throw Error('The following command line argument expects an additional argument; ' + cmd);
    }
    return i;
  }
}


export class FsContext implements I_FsContext {
  private ctx: I_CliCtx;
  private fs: I_Fs;
  private funSsrExists = (ssr, ctx: I_CliCtx, path: Path) => {

    var t = false;
    if (ssr.output != undefined) {
      let outStr = ssr.output.toString();
      let idx = outStr.indexOf("YES-EXISTS");
      var t = idx != -1;
      if (ctx.isDebug()) {
        ctx.out("outStr is '" + outStr + "'" + " idx is " + idx + " t is " + t);
      }
    }
    if (ctx.isDebug()) {
      if (t) {
        ctx.out("The following path exists; " + path.toPathString());
      } else {
        ctx.out("The following path does NOT exist; " + path.toPathString());
      }
    }
    return t;
  };

  constructor(cliCtx: I_CliCtx, mockFs?: I_Fs) {
    this.ctx = cliCtx;
    if (mockFs != undefined) {
      this.fs = mockFs;
    } else {
      this.fs = new FsStub();
    }
  }

  /**
   * This determines if a path (folder or file) exists.
   * @param path
   */
  existsAbs(path: Path): boolean {
    if (this.ctx.isDebug()) {
      this.ctx.out("in existsAbs with path (toUnix) " + path.toUnix());
      // hmm circular structure ;
      //ctx.out("in existsAbs ctx " + JSON.stringify(ctx));
    }
    let sof =  this.ctx.getShellOptionsFactory();
    if (this.ctx.isWindows()) {
      //existsSync s broken! for symblic links at least, this is clugy hack
      if (this.ctx.isBash()) {
        /*
        hmm didn't work on Windows
        if (ctx.getFs().existsSync(Paths.toUnix(path))) {
          if (ctx.isDebug()) {
            ctx.out("The following path exists; " + path.toPathString());
          }
          return true;
        }
        if (ctx.isDebug()) {
          ctx.out("The following path does NOT exist; " + path.toPathString());
        }
        return false;
        */
        /*
        let ssr: any = this.ctx.run('ls', [Paths.toUnix(path)], undefined, LogLevel.TRACE);
        var t = this.funSsrExists(ssr, this.ctx, path);
        */
        //let cmd = 'echo `[[ -d "test_data" || -f "test_data" ]] && echo "YES" || echo "NO"`';
        //original         
        // let cmd = 'echo `[[ -d "' + path.toUnix() + '" || -f "' + path.toUnix() +
        //            '" || -L "' + path.toUnix() + '" ]] && echo "YES-EXISTS" || echo "NO-NOT-EXISTS"`';
        let cmd = 'echo';
        let cmdArgs: string  = '`[[ -d \"' + path.toUnix() + '\" || -f \"' + path.toUnix() +
                    '\" || -L \"' + path.toUnix() + '\" ]] && echo \"YES-EXISTS\" || echo \"NO-NOT-EXISTS\"`';
        let cmdArgsSplit: string [] = cmdArgs.split(" ");
        let options = sof.getOptionsShell(this.ctx,);
        let ssr: any = this.ctx.runE(cmd, cmdArgsSplit, options);
        return this.funSsrExists(ssr, this.ctx, path);
      } else {
        let options = sof.getOptions(this.ctx, Paths.toOs(path, this.ctx.isWindows()));
        let ssr: any = this.ctx.runE('dir', [], options);
        return this.funSsrExists(ssr, this.ctx, path);
      }
    } else {
      let options = sof.getOptionsShell(this.ctx);
      // original
      // let cmd = 'echo `[[ -d "' + path.toUnix() + '" || -f "' + path.toUnix() +
      // '" ]] && echo "YES-EXISTS" || echo "NO-NOT-EXISTS"`';
          
      let cmd = 'echo';
      let cmdArgs: string = '`[[ -d \"' + path.toUnix() + '\" || -f \"' + path.toUnix() +
          '\" ]] && echo \"YES-EXISTS\" || echo \"NO-NOT-EXISTS\"`';
      let cmdArgsSplit: string [] = cmdArgs.split(" ");
      if (this.ctx.isDebug()) {
        this.ctx.out('Executing cmd ' + cmd);
      }
      let ssr: any = this.ctx.runE(cmd, cmdArgsSplit,options);
      return this.funSsrExists(ssr, this.ctx, path);
    }

  }

  /**
   * This determines if a path (folder or file) exists.
   * @param relativePathParts
   * @param inDir
   */
  exists(fileOrDir: string, inDir: Path): boolean {
    if (this.ctx.isDebug()) {
      this.ctx.out("in exists with path (toUnix) " + fileOrDir + " in " + inDir.toUnix());
    }
    return this.existsAbs(inDir.child(fileOrDir));

  }

  getFs(): I_Fs {
    return this.fs;
  }

  isSymlink(dir: Path): boolean {
    return this.fs.isSymlink(Paths.toOs(dir, this.ctx.isWindows()));
  }

  getSymlinkTarget(dir: Path): Path {
    return Paths.newPath(this.fs.getSymlinkTarget(Paths.toOs(dir, this.ctx.isWindows())), true, this.ctx.isWindows());
  }
  
  getSymlinkTargetRelative(relativePath: Path, parentPath: Path): Path {
    let rPath: string = Paths.toOs(relativePath, this.ctx.isWindows());
    let aPath: string = Paths.toOs(parentPath, this.ctx.isWindows());
    if (this.ctx.isDebug()) {
      this.ctx.out("in getSymlinkTargetRelative rPath '" + rPath + "' \n\t aPath is '" + aPath + "'");
    }
    var pathSeperator = '/';
    if (this.ctx.isWindows()) {
      pathSeperator = '\\';
    }
    let r = this.fs.getSymlinkTargetRelative(rPath, aPath, pathSeperator);
    return Paths.newPath(r, true, this.ctx.isWindows());
  }

  mkdir(dir: string, inDir: Path) {
    if (this.ctx.isWindows()) {
      this.ctx.runE('mkdir', [dir],  this.ctx.getShellOptionsFactory().getOptions(this.ctx, Paths.toOs(inDir, this.ctx.isWindows())));
    } else {
      this.ctx.runE('mkdir', [dir],  this.ctx.getShellOptionsFactory().getOptions(this.ctx, inDir.toUnix()));
    }
  }

  mkdirTree(dirs: Path, inDir: Path): Path {
    var dirNames: string[] = dirs.getParts();
    for (var i = 0; i < dirNames.length; i++) {
      let dir: string = dirNames[i];
      if (!this.exists(dir, inDir)) {
        this.mkdir(dir, inDir);
      }
      inDir = new Path(inDir.getParts().concat(dir), false, inDir.isWindows());
    }
    return inDir;
  }

  read(path: Path, charset?: string): any {
    try {
      if (this.ctx.isWindows()) {
        //don't use unix files for gitbash here
        let p: string = path.toWindows();
        if (this.ctx.isDebug()) {
          this.ctx.out('reading ' + p);
        }
        return fs.readFileSync(p);
      } else {
        let p: string = path.toUnix();
        if (this.ctx.isDebug()) {
          this.ctx.out('reading ' + p);
        }
        return fs.readFileSync(p);
      }
    } catch (e) {
      this.ctx.print('Error reading file ' + path.toString())
      this.ctx.print(e.message);
      throw e;
    }
  }

  readJson(path: Path): any {
    return JSON.parse(this.read(path));
  }

  rd(slinkName: string, inDir: Path): void {
    let sof = this.ctx.getShellOptionsFactory();
    let inDirP = inDir.toWindows();
    var options = sof.getOptions(this.ctx, inDirP);
    //var options ={ cwd:  Paths.toUnix(inDir), shell: process.env.SHELL}
    if (this.ctx.isDebug()) {
      this.ctx.out("Using shell " + options.shell + " in Windows dir " + options.cwd);
      this.ctx.out("Removing link named " + slinkName);
    }

    let sArgs = "\'rd .\\" + slinkName + "\' | cmd";
    let splitArgs = sArgs.split(" ");
    let result = this.ctx.runE('echo',splitArgs, options, LogLevel.TRACE);
    if (this.ctx.isDebug()) {
      this.ctx.out("rd result stdout is " + result.stdout);
      this.ctx.out("rd result stderr is " + result.stderr);
    }
  }
  
  rm(dir: string, inDir: Path) {
    if (this.ctx.isDebug()) {
      this.ctx.out("in rm (toUnix) " + dir + " in " + inDir.toUnix());
    }
    if (this.exists(dir, inDir)) {
      if (this.ctx.isWindows()) {
        //existsSync s broken!
        this.ctx.runE('rm', ['-fr', dir], {cwd: inDir.toWindows()});
      } else {
        this.ctx.runE('rm', ['-fr', dir], {cwd: inDir.toUnix()});
      }
    } else {
      if (this.ctx.isDebug()){
        this.ctx.out(dir + " doesn't exist' in " + inDir.toUnix());
      }
    }
  }

  /**
   * create a new symbolic link
   */
  slink(slinkName: string, toDir: Path, inDir: Path) {
    
    /*
    var sp = "Creating symlink from node_modules in;\n\t " + Paths.toOs(this.ctx.getDir(), this.ctx.isWindows());
          sp += "\n\tto \n\t" + Paths.toOs(parentProjectWithNodeModulesPath, this.ctx.isWindows());
          this.ctx.print(sp);
          */
    
    
    let sof = this.ctx.getShellOptionsFactory();
    if (this.ctx.isWindows()) {
      let toDirP = toDir.toWindows();
      let inDirP = inDir.toWindows();
      if (this.ctx.isDebug()) {
        this.ctx.out("Linking to " + toDir);
      }
      var options = sof.getOptions(this.ctx, inDirP);
      //var options ={ cwd:  Paths.toUnix(inDir), shell: process.env.SHELL}
      if (this.ctx.isDebug()) {
        this.ctx.out("In FsContext.slinkUsing shell " + options.shell + " in Windows dir " + options.cwd);
        this.ctx.out("Creating link named " + slinkName + "  to \n\t " + toDirP);
        this.ctx.out("All options are " + JSON.stringify(options));
        let pwdResult = this.ctx.runE('pwd', [], options, LogLevel.TRACE);
        this.ctx.out("pwdResult is \n\t" + pwdResult.stdout);
      }
      
      let sArgs: string = "\'mklink /J " + slinkName + " " + toDirP + "\' | cmd";
      let splitArgs: string[] = sArgs.split(" ");
      let result = this.ctx.runE('echo', splitArgs , options, LogLevel.TRACE);
      if (this.ctx.isDebug()) {
        this.ctx.out("mklink result.stdout is \n\t" + result.stdout);
        this.ctx.out("mklink result.stderr is \n\t" + result.stderr);
      }
      //note you must be adminsitrator or have heightened privlages to do this on Windows, so double check if
      // it got done
      let success = this.existsAbs(inDir.child(slinkName));
      if (success) {
        //do nothing
      } else {
        throw Error('Unable to create the following link, are you running slink as Administrator or with heightened privleges?' +
            new Path(toDir.getParts().concat(slinkName), false, true).toString() );
      }
    } else {
      let inDirP = inDir.toUnix();
      let toDirP = toDir.toUnix();
      let options = sof.getOptions(this.ctx, inDirP);
      this.ctx.runE('ln', ['-s', '-T', toDirP, slinkName], options);
    }
  }
}

export class DependencySLinkGroup {
  private group: string;
  private projects: DependencySLinkProject[];
  private unixIn: string;
  private unixTo: string;

  constructor(info: I_DependencySLinkGroup, ctx: I_CliCtx) {
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
  static to(group: string, projects: I_DependencySLinkProject[], ctx: I_CliCtx): DependencySLinkProject[] {
    let r = new Array(projects.length);
    for (var i = 0; i < projects.length; i++) {
      r[i] = new DependencySLinkProject(group, projects[i], ctx);
    }
    return r;
  }
  private project: string;
  private modulePath: string;
  private unixTo: Path;

  constructor(group: string, info: I_DependencySLinkProject, ctx: I_CliCtx) {
    this.project = info.project;
    this.modulePath = info.modulePath;
    this.unixTo = Paths.toPath('../../../' + info.project + '/src', true);
  }

  getProjectName(): string { return this.project; }
  getModluePath(): string { return this.modulePath; }
  getUnixTo(): Path { return this.unixTo; }

  toString(): string {
    return 'DependencySLinkProject [project=\'' + this.project + '\', modulePath=\'' +
      this.modulePath + '\', unixTo=\'' + this.unixTo + '\']';
  }
}

export class DependencySrcSLink {
  private unixIn: string;
  private unixTo: string;
  private name: string;

  constructor(slink: I_DependencySrcSLink, ctx: I_CliCtx) {
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

/** 
 * This class compares two package.json files to ensure that the packages and versions of those
 * packages are identical, since we are symlinking the projects together the packages and versions
 * required should match.
 */
export class PackageJsonComparator {
  public static UNABLE_TO_READ_SHARED_PACKAGE_JSON_AT =  'Unable to read a shared dependency projects package.json file at;\n\t';
  public static THE_FOLLOWING_PACKAGE_JSON_IS_MISSING_THE_SUBSEQUENT_DEPENDENCIES =  '\nThe following package.json is missing the subsequent dependencies;\n\t';
  public static THE_FOLLOWING_PACKAGE_JSON_FILES_HAVE_MISMATCHED_VERSIONS =  'The following package.json files have mismatched versions for;\n\t';
  private ctx: I_CliCtx;
  private fsCtx: I_FsContext;
  /** 
   * This is the parsed json from package.json where slink was run
   */
  private projectJson: any;
  private projectDeps: Map<string,string>;
  /** 
   * This is the parsed json from the package.json that is above the target of the node_modules symlink
   */
  private sharedJsonPath: Path;
  private sharedJson: any;
  private sharedDeps: Map<string,string>;

  constructor(projectJson: any, ctx: I_CliCtx, fsCtx: I_FsContext, sharedJsonPath: Path) {
      this.projectJson = projectJson;
      this.ctx = ctx;
      if (this.ctx.isDebug()) {
        this.ctx.out('in PackageJsonComparator constructor \n' +
          JSON.stringify(projectJson.dependencies) + '\n' + JSON.stringify(projectJson.devDependencies)
        );
      }
      this.fsCtx = fsCtx;
      this.sharedJsonPath = sharedJsonPath;
      if (fsCtx.existsAbs(sharedJsonPath)) {
        this.sharedJson = fsCtx.readJson(sharedJsonPath);
      } else {
        throw new Error(PackageJsonComparator.UNABLE_TO_READ_SHARED_PACKAGE_JSON_AT + sharedJsonPath.toPathString());
      }
      
      // Get all project dependencies
      const pd = {
        ... (this.projectJson.dependencies || {}),
        ... (this.projectJson.devDependencies || {})
      };
      this.projectDeps = new Map(Object.entries(pd));
      if (this.projectDeps.size == 0) {
        this.sharedDeps = new Map();
        return;
      }

      // Get all shared dependencies
      const sd = {
        ... (this.sharedJson.dependencies || {}),
        ... (this.sharedJson.devDependencies || {})
      };
      this.sharedDeps = new Map(Object.entries(sd));
    }

    /**
     * This checks for a mismatch versions or existence of dependencies in the sharedDeps with the projectDeps
     * @returns false if there is no mismatch, true if a mismatch has occurred.
     */
    public checkForMismatch(): boolean {
      if (this.ctx.isDebug()) {
        this.ctx.out('in PackageJsonComparator checkForMismatch');
      }
      if (this.projectDeps.size == 0) {
        return false;
      }
      var missing = PackageJsonComparator.THE_FOLLOWING_PACKAGE_JSON_IS_MISSING_THE_SUBSEQUENT_DEPENDENCIES;
      missing += this.sharedJsonPath.toPathString() + '\n\t';
      var mismatched = PackageJsonComparator.THE_FOLLOWING_PACKAGE_JSON_FILES_HAVE_MISMATCHED_VERSIONS;
      mismatched += this.sharedJsonPath.toPathString() + '\n\t';
      mismatched += new Path(this.ctx.getDir().getParts(), false, this.ctx.isWindows()).child('package.json').toPathString() + '\n\t';

      var hasMissing = false;
      var hasMismatch = false;
      for (const [key, value] of this.projectDeps) {
        if (this.ctx.isDebug()) {
          this.ctx.out('Checking project dependency ' + key + ','+ value);
        }
        if (this.sharedDeps.has(key)) {
          let sVal = this.sharedDeps.get(key);
          if (value != sVal) {
            hasMismatch = true;
            mismatched += key + ' ' + value + ' vs shared ' + sVal + '\n\t';
          }
        } else {
          hasMissing = true;
          missing += key + ' ' + value + '\n\t';
        }
      }
      if (hasMismatch || hasMissing) {
        if (hasMissing) {
          this.ctx.out(missing);
        }
        if (hasMismatch) {
          this.ctx.out(mismatched);
        }
        return true;
      }
      return false;
    }

    private addProjectDeps(pDeps, to: Map<string,string>) {
      if (pDeps != undefined) {
        if (this.ctx.isDebug()) {
          this.ctx.out('Object.keys(pDeps).length is  ' + Object.keys(pDeps).length);
        }
        Object.keys(pDeps).forEach(key => {
          let value = pDeps[key];
          if (this.ctx.isDebug()) {
            this.ctx.out('adding ' + key + ' ' + value);
          }
          to.set(key, value);
        });
      } else {
        if (this.ctx.isDebug()) {
          this.ctx.out('pDeps is undefined ');
        }
      }
    }

}

export class Path implements I_Path {
  public static PARTS_MUST_HAVE_VALID_STRINGS = 'Parts must have valid strings! ';
  public static PARTS_MUST_HAVE_NON_EMPTY_STRINGS = 'Parts must have non-empty strings! ';
  public static RELATIVE_PARTS_MUST_HAVE_ENTRIES = 'Relative parts must have entries! ';
  public static newPath(parent: Path, relative: Path) {
    let parts = parent.getParts().concat(relative.getParts());
    return new Path(parts, false, parent.isWindows());
  }
  private readonly _relative: boolean;
  private readonly _parts: string[];
  private readonly _windows: boolean;



  constructor(parts: string[], relative?: boolean, windows?: boolean) {
    if (relative == undefined) {
      this._relative = false;
    } else {
      this._relative = relative;
    }
    this._parts = parts;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] == undefined) {
        throw Error(Path.PARTS_MUST_HAVE_VALID_STRINGS + parts);
      } else if (parts[i].trim() == '') {
        throw Error(Path.PARTS_MUST_HAVE_NON_EMPTY_STRINGS + parts);
      }
    }
    if (this._parts.length == 0 && this._relative != false) {
      throw Error(Path.RELATIVE_PARTS_MUST_HAVE_ENTRIES + parts);
    }
    if (windows == undefined) {
      this._windows = false;
    } else {
      this._windows = windows;
    }
  }

  hasParent(): boolean {
    if (this._parts.length >= 2) {
      return true;
    }
    return false;
  }

  isRelative(): boolean {
    return this._relative;
  }

  isRoot(): boolean {
    if (this._relative) {
      return false;
    }
    if (this._windows) {
      if (this._parts.length == 1) {
        return true;
      }
    } else {
      if (this._parts.length == 0) {
        return true;
      }
    }
    return false;
  }

  isWindows(): boolean {
    return this._windows;
  }

  getParts(): string[] {
    return this._parts.slice(0, this._parts.length);
  }

  getParent(): Path {
    if (this._parts.length >= 2) {
      return new Path(this._parts.slice(0, this._parts.length - 1), this._relative, this._windows);
    } else {
      throw new Error("The path " + this.toPathString() + " has no parents! ");
    }
  }

  toString(): string {
    return 'Path [parts=[' + this._parts + '], relative=' + this._relative + ', windows=' + this._windows + ']'
  }

  toPathString(): string {
    var r: string = '';
    if (this._windows) {
      if (this._relative) {
        r = r.concat(this._parts[0] + '\\');
        return this.concat(r, '\\');
      } else {
        r = r.concat(this._parts[0] + ':\\');
        return this.concat(r, '\\');
      }
    } else {
      if (this._relative) {
        return this.concat(r, '/');
      } else {
        r = r.concat('/');
        return this.concat(r, '/');
      }
    }
  }

  toUnix(): string {
    let b = '';
    if (!this._relative) {
      b = '/';
    }
    let pp: string[] = this._parts;
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

  toWindows(): string {
    let b = '';
    let pp: string[] = this._parts;
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

  child(path: string) {
    return new Path(this.getParts().concat(path), this._relative, this._windows);
  }

  private concat(start: string, sep: string): string {
    var r: string = start;
    if (this.isWindows()) {
      for (var i = 1; i < this._parts.length; i++) {
        if (this._parts.length - 1 == i) {
          r = r.concat(this._parts[i]);
        } else {
          r = r.concat(this._parts[i]).concat(sep);
        }
      }
      return r;
    } else {
      for (var i = 0; i < this._parts.length; i++) {
        if (this._parts.length - 1 == i) {
          r = r.concat(this._parts[i]);
        } else {
          r = r.concat(this._parts[i]).concat(sep);
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
    return this.find(this.toPath(path, false), relativePath);
  }

  static toOs(parts: Path, isWindows: boolean): string {
    if (isWindows) {
      return parts.toWindows();
    } else {
      return parts.toUnix();
    }
  }

  static newPath(path: string, relative: boolean, windows: boolean): Path {
    return new Path(Paths.toPath(path, relative).getParts(), relative, windows);
  }

  /**
   * @param a path, which could be
   * a windows path (i.e. C:\User\scott ),
   * a unix path (/home/scott)
   * or a gitbash path (i.e. C:/Users/scott)
   * Because of this spaces are NOT allowed.
   */
  static toPath(path: string, relative: boolean): Path {
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

}

export class SLinkRunner {
  private ctx: I_CliCtx;
  private fsCtx: I_FsContext;

  constructor(ctx: I_CliCtx, fsCtx?: I_FsContext) {
    this.ctx = ctx;
    if (fsCtx != undefined) {
      this.fsCtx = fsCtx;
    } else {
      this.fsCtx = new FsContext(ctx);
    }
  }

  /**
   * 
   * @param envVars 
   * @returns true if was processed, false if wasn't
   */
  private handleSharedNodeModulesViaEnvVar(envVars: string[], projectJson: any): boolean {
    this.ctx.print("Processing sharedNodeModuleProjectSLinkEnvVar: " + JSON.stringify(envVars));

    for (const envVar of envVars) {
      const envValue = this.ctx.getProc().envVar(envVar);
      if (envValue) {
        this.ctx.print(`Found environment variable ${envVar} with value ${envValue}`);
        
        let envValPath = Paths.newPath(envValue, false,  this.ctx.isWindows());
        if (this.fsCtx.existsAbs(envValPath)) {
          if (this.fsCtx.exists('node_modules', this.ctx.getDir())) {
            // Remove existing node_modules if it exists
            this.removeNodeModules();
          }

          let comp = new PackageJsonComparator(projectJson, this.ctx, this.fsCtx, envValPath.getParent().child('package.json'));
          if (comp.checkForMismatch()) {
            this.ctx.getProc().error('Unable to complete successfully, process.exit(' + 1870 + ')');
            this.ctx.getProc().exit(1870);
          }
          // Create symlink to the environment variable path
          let targetPath = envValPath;
          this.ctx.print(`Creating symlink from node_modules to ${Paths.toOs(targetPath, this.ctx.isWindows())}`);

          this.fsCtx.slink('node_modules', targetPath, this.ctx.getDir());
          return true; // Use the first valid environment variable
        } else {
          this.ctx.getProc().error('The following path does NOT seem to exist;\n\t${envValPath}\nUnable to complete successfully, process.exit(' + 1808 + ')');
          this.ctx.getProc().exit(1808);
        }
      } else {
        this.ctx.print(`Environment variable ${envVar} NOT found or empty`);
      }
    }

    return false;
  }

  private handleSharedNodeModulesViaProjectLinks(projectNames: string[], projectJson: any) {
    this.ctx.print("Processing sharedNodeModuleProjectSLinks: " + JSON.stringify(projectNames));


    let projectDir : Path = this.ctx.getDir();

    // Start from the current directory and traverse up the tree
    let transRoot: Path = projectDir.getParent();
    let transParts: string[] = transRoot.getParts();
    var counter = transParts.length;
    var parentProjectWithNodeModulesPath : Path;

    while (counter >= 0) { // Stop at root (length 1 for drive/root)
      // Calculate parent directory by removing the last part
      const parentDirParts = transParts.slice(0, counter);
      const parentDir = new Path(parentDirParts, false, this.ctx.isWindows());

      if (this.ctx.isDebug()) {
        this.ctx.out(`Checking parent directory: ${Paths.toOs(parentDir, this.ctx.isWindows())}`);
      }


      for (const projectName of projectNames) {
        // Construct the full path to the potential project directory
        const projectPathParts = parentDirParts.concat(projectName);
        const projectPath = new Path(projectPathParts, false, this.ctx.isWindows());

        if (this.ctx.isDebug()) {
          this.ctx.out(`Checking for project ${projectName} at ${Paths.toOs(projectPath, this.ctx.isWindows())}`);
        }

        // Check if the project directory exists
        if (this.fsCtx.existsAbs(projectPath)) {
          // Check for node_modules in the project
          const nodeModulesPathParts = projectPathParts.concat('node_modules');
          const nodeModulesPath = new Path(nodeModulesPathParts, false, this.ctx.isWindows());

          let nodeModulesExists = this.fsCtx.existsAbs(nodeModulesPath);

          if (nodeModulesExists) {
            parentProjectWithNodeModulesPath = nodeModulesPath;
            break;
          } else {
            // Attempt to run npm install if node_modules doesn't exist
            if (this.ctx.isDebug()) {
              this.ctx.out(`node_modules not found in ${projectName}, attempting npm install in ${Paths.toOs(projectPath, this.ctx.isWindows())}`);
            }
            const installResult = this.ctx.runE('npm', ['install'], { cwd: Paths.toOs(projectPath, this.ctx.isWindows()) });

            // Re-check after install attempt
            nodeModulesExists = this.fsCtx.existsAbs(nodeModulesPath);

            if (!nodeModulesExists) {
              if (this.ctx.isDebug()) {
                this.ctx.out(`npm install failed or node_modules still missing in ${projectName}`);
              }
              continue; // Try next project
            }
          }
        } else {
          if (this.ctx.isDebug()) {
            this.ctx.out(`Project ${projectName} not found at ${Paths.toOs(projectPath, this.ctx.isWindows())}`);
          }
        }
      }
      if (parentProjectWithNodeModulesPath != undefined) {
        break;
      }
      if (parentDir.isRoot()) {
        break;
      }
      // Move up one directory level for next iteration
      counter--;
    }

    if (parentProjectWithNodeModulesPath != undefined) {
      this.ctx.print("\n\n\nFound parent with node modules " + parentProjectWithNodeModulesPath.toPathString());
      if (this.fsCtx.exists('node_modules', this.ctx.getDir())) {
        // Remove existing node_modules in current directory if it exists
        this.ctx.print(`Removing node_modules in ${Paths.toOs(this.ctx.getDir(), this.ctx.isWindows())}`);
        this.removeNodeModules();
      } else {
        this.ctx.print(`Node_modules not currently in ${Paths.toOs(this.ctx.getDir(), this.ctx.isWindows())}`);
      }

      let comp = new PackageJsonComparator(projectJson, this.ctx, this.fsCtx, parentProjectWithNodeModulesPath.getParent().child('package.json'));
      if (comp.checkForMismatch()) {
        this.ctx.getProc().error('Unable to complete successfully, process.exit(' + 1975 + ')');
        this.ctx.getProc().exit(1975);
      }
      
      // Create symlink to the project's node_modules
      var sp = "Creating symlink from node_modules in;\n\t " + Paths.toOs(this.ctx.getDir(), this.ctx.isWindows());
      sp += "\n\tto \n\t" + Paths.toOs(parentProjectWithNodeModulesPath, this.ctx.isWindows());
      this.ctx.print(sp);
      this.fsCtx.slink('node_modules', parentProjectWithNodeModulesPath, this.ctx.getDir());
    } else {
      this.ctx.print("No valid shared node_modules project found in parent directories");
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

      let unixIn: Path = Paths.toPath(dl.getUnixIn(), true);
      let unixTo: Path = Paths.toPath(dl.getUnixTo(), true);
      let slinkIn: Path = Paths.find(this.ctx.getDir(), unixIn);
      let slinkTo: Path = Paths.find(slinkIn, unixTo);

      this.fsCtx.rm(dl.getName(), slinkIn);
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
      let groupName = g.getGroup();
      this.fsCtx.rm(groupName, this.ctx.getDir().child('node_modules'));
      let gPath: Path = this.fsCtx.mkdirTree(Paths.newPath(g.getUnixIn(), true, this.ctx.isWindows()), this.ctx.getDir());

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
  

  private publishLocal() {
    if (!this.fsCtx.exists('node_modules', this.ctx.getDir())) {
      this.ctx.out("The node_modules directory doesn't exist in the following path;");
      this.ctx.out(this.ctx.getDir().toPathString());
      this.ctx.out("Try running slink first with out the -p / --publish-local flag?");
      return;
    }
    let nmPath = this.ctx.getDir().child('node_modules');
    if (!this.fsCtx.isSymlink(nmPath)) {
      this.ctx.out('The node_modules directory is not a symlink, please run slink with out arguments to replace your current node_modules directory.');
      this.ctx.getProc().exit(1930);
    }
    let target = this.fsCtx.getSymlinkTarget(nmPath);
    let pkgPath = this.ctx.getDir().child('package.json');
    let pkg = this.fsCtx.readJson(pkgPath);
    let name = pkg.name;
    let packageDirParts = name.split('/');
    let nextPath = new Path(target.getParts(), false, this.ctx.isWindows());
    
    for (var i =0; i < packageDirParts.length; i++) {
      let nextPathParent = nextPath;
      nextPath = nextPath.child(packageDirParts[i]);
      var created = false;
      if ( !this.fsCtx.existsAbs(nextPath)) {
        if (this.ctx.isDebug()) {
          this.ctx.out('Creating ' + packageDirParts[i] + ' in ' + nextPathParent.toPathString());
        }
        this.fsCtx.mkdir(packageDirParts[i], nextPathParent);
        created = true;
      }
      
      if (i == packageDirParts.length - 1) {
        if (!created) {
          if (this.fsCtx.existsAbs(nextPath)) {
            if (this.ctx.isDebug()) {
              this.ctx.out('Removing and recreating ' + packageDirParts[i] + ' in ' + nextPathParent.toPathString());
            }
            this.fsCtx.rm(packageDirParts[i], nextPathParent);
            //the next line causes this warning to printout
            //  [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, 
            // as the arguments are not escaped, only concatenated.
            // this was eventually defeated by a custom slink.sh script with the --disable-warning=DEP0190
            // being passed in the internal node slink script that ends up in nvmInstall/nodejs/slink
            this.fsCtx.mkdir(packageDirParts[i], nextPathParent);
          }
        }
      }
    }
    // before here?
    
    let destPkgPath = nextPath.child('package.json');
    if (this.ctx.isDebug()) {
      this.ctx.out('Copying package.json from \n\t' + pkgPath.toPathString() + '\n to \n\t' + destPkgPath.toPathString());
    }
    this.fsCtx.getFs().copyFileSync(Paths.toOs(pkgPath, this.ctx.isWindows()), Paths.toOs(destPkgPath, this.ctx.isWindows()));
    let distDir = nextPath.child('dist');
    this.fsCtx.mkdir('dist', nextPath);
    if (pkg.bin) {
      for (let key in pkg.bin) {
        let srcFile = pkg.bin[key];
        if (srcFile.length >= 3) {
          let srcFileParts = srcFile.substring(2, srcFile.length).split('/');
          var srcPath = this.ctx.getDir();
          for (i = 0; i < srcFileParts.length; i++) {
            srcPath = srcPath.child(srcFileParts[i]);
          }
          let destFile = distDir.child(srcFileParts[srcFileParts.length - 1]);
          if (this.fsCtx.existsAbs(srcPath)) {
            if (this.ctx.isDebug()) {
              this.ctx.out('Copying \b\t' + srcPath.toPathString() + '\n to \n\t' + destFile.toPathString());
            }
            this.fsCtx.getFs().copyFileSync(Paths.toOs(srcPath, this.ctx.isWindows()), Paths.toOs(destFile, this.ctx.isWindows()));
          } else {
            this.ctx.out(`Warning: bin file ${srcFile} not found`);
          }
        }
      }
    }
    let srcSrcDir = this.ctx.getDir().child('src');
    let srcDestDir = nextPath.child('src');
    this.fsCtx.mkdir('src', nextPath);
    let srcFiles = this.fsCtx.getFs().readdirSync(Paths.toOs(srcSrcDir, this.ctx.isWindows()));
    for (let srcFileName of srcFiles) {
      this.fsCtx.getFs().copyFileSync(Paths.toOs(srcSrcDir.child(srcFileName), this.ctx.isWindows()),
          Paths.toOs(srcDestDir.child(srcFileName), this.ctx.isWindows()));
    }
  }
  

  /**
   * This method removes the node_modules directory or symlink in the current 
   * project if it is present
   */
  removeNodeModules() {
    let projectDir : Path = this.ctx.getDir();
    let nmDir = projectDir.child('node_modules');
    if (this.fsCtx.existsAbs(nmDir)) {
      if (this.ctx.isWindows()) {
        if (this.fsCtx.isSymlink(nmDir)) {
          this.fsCtx.rd('node_modules', projectDir);
        } else {
          this.fsCtx.rm('node_modules', projectDir);
        }
      } else {
        this.fsCtx.rm('node_modules', projectDir);
      }
    }
  }
  

  run() {
    if (this.ctx.isDone()) {
      return;
    }

    this.ctx.setDir();
    if (this.ctx.isDebug()) {
      this.ctx.out("In SLinkRunner after ctx.setDir");
    }

    if (this.ctx.isInMap(REMOVE.cmd)) {
      this.removeNodeModules();
      return;
    }
    
    if (this.ctx.isInMap(PUBLISH.cmd)) {
      this.publishLocal();
      return;
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
      process.exit(0);
    } else {
      this.ctx.print('Reading package.json file at;');
      this.ctx.print(currentPkgJsonPath.toPathString());
    }

    if (!this.fsCtx.existsAbs(currentPkgJsonPath)) {
      this.ctx.print('Aborting couldn\'t find a package.json file at;');
      this.ctx.print(currentPkgJsonPath.toPathString());
      process.exit(0);
    }
    let json = this.fsCtx.readJson(currentPkgJsonPath);

    // Handle shared node modules via environment variable
    if (json.sharedNodeModuleProjectSLinkEnvVar && json.sharedNodeModuleProjectSLinkEnvVar.length > 0) {
      if (this.handleSharedNodeModulesViaEnvVar(json.sharedNodeModuleProjectSLinkEnvVar, json)) {
        if (this.ctx.isDebug()) {
          this.ctx.out("Processed  sharedNodeModuleProjectSLinkEnvVar");
        }
      } else if (json.sharedNodeModuleProjectSLinks && json.sharedNodeModuleProjectSLinks.length > 0) {
        // Handle shared node modules via project links
        this.handleSharedNodeModulesViaProjectLinks(json.sharedNodeModuleProjectSLinks, json);
      }
    } else if (json.sharedNodeModuleProjectSLinks && json.sharedNodeModuleProjectSLinks.length > 0) {
      // Handle shared node modules via project links
      this.handleSharedNodeModulesViaProjectLinks(json.sharedNodeModuleProjectSLinks, json);
    }

    // Handle existing dependency source links
    this.handleDependencySrcSLinks(json.dependencySrcSLinks);

    // Handle existing dependency link groups
    this.handleDependencySLinkGroups(json.dependencySLinkGroups);
  }

  runCheck() {
    if (this.ctx.isWindows()) {
      if (!this.ctx.isBash()) {
        throw new Error(CliCtx.WHEN_RUNNING_SLINK_ON_WINDOWS_YOU_MUST_USE_GITBASH_AS_ADMINISTRATOR);
      }
    }
    this.run();
  }
}

// ###################################### Main Script Execution ####################################
var testing: boolean = false;
// set in Webstorm as an Environment Variable or through the CLI
//
// https://www.jetbrains.com/help/webstorm/managing-plugins.html#open-plugin-settings
// https://www.jetbrains.com/help/webstorm/run-debug-configuration-node-js.html
if (process.env['RUNNING_TESTS4TS'] != undefined) {
  testing = true;
}
if (!testing) {
  //Note this is not the --debug cli flag but instead other environment variable settings from WebStorm
  // or other IDEs
  var debugging = false;
  if (process.env['SLINK_DEBUGGING'] != undefined) {
    debugging = true;
  }
  if (debugging) {
    //
    // Note this works however I'm having issues getting bash to find things like ls when doing it this way
    //
    //something like path\node.exe
    let nodeExe = process.env['SLINK_DEBUGGING_NODE_EXE'];
    // something like path\AppData\Roaming\npm\node_modules\@ts.adligo.org\slink\dist\slink.mjs
    let nodeSlinkInstall = process.env['SLINK_DEBUGGING_NODE_SLINK_INSTALL'];
    //something like path\Git\usr\bin\bash.exe
    let bashShellPath = process.env['SLINK_DEBUGGING_BASH_EXE'];
    // the path where you want to pretend you started slink from
    let debugDir = process.env['SLINK_DEBUGGING_DIR'];
    let args: string[] = [nodeExe,nodeSlinkInstall,
      '--debug',
      '--dir', debugDir];
    let proc: ProcStub = new ProcStub();
    //monkey patch
    // 'C:\\apps\\Git\\usr\\bin\\bash.exe'
    proc.shell = () => { return 'C:\\apps\\Git\\usr\\bin\\bash.exe'; }
    let ctx = new CliCtx(FLAGS, args, new CliCtxLog(), new SlinkConsoleStub(), new FsStub(), proc);
    let runner = new SLinkRunner(ctx);
    runner.runCheck();
  } else {
    // Production runs
    let ctx = new CliCtx(FLAGS, process.argv);
    let runner = new SLinkRunner(ctx);
    runner.runCheck();
  }
} else {
  console.log("slink.mts is picking up RUNNING_TESTS4TS");
}

