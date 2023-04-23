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
const fs = require('node:fs');
//const path  = require('path');
const { spawnSync } = require('child_process')
const { stream } = require('stream'); 
import {I_Out} from '@ts.adligo.org/io';
import { SpawnSyncReturns } from 'child_process';

const IS_WINDOWS = process.platform === "win32";
function getPathSeperator() {
  if (IS_WINDOWS) {
    return '\\';
  } else {
    return '/';
  }
}
const out : I_Out = (foo) => console.log(foo);

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

export class Paths {
 
  static find(parts: string[], relativePath: string[]): string[] {
    var dd : number = 0;
    for (var i=0; i< relativePath.length; i++) {
      if (relativePath[i] == '..') {
        dd++;
      }
    } 
    console.log('In find with dd ' + dd + '\n\tpath: ' + parts + '\n\trelativepath: ' + relativePath);
    let root = parts.slice(0, parts.length - dd);
    console.log('Root is: ' + root);
    var r = root;
    for (var i=0; i< relativePath.length; i++) {
      if (relativePath[i] != '..') {
        r = r.concat(relativePath[i]);
      }
    } 
    console.log('New relative path is\n\t' + r);
    return r;
  }

  static findPath(path: string, relativePath: string[]): string[] {
    return this.find(this.toParts(path), relativePath);
  }

  static toOsPath(path: string): string {
    let parts = this.toParts(path);
    if (IS_WINDOWS) {
      return this.toWindowsPath(parts);
    } else {
      return this.toUnixPath(parts);
    }
  }
 
  
   /**
   * @param a path, which could be 
   * a windows path (i.e. C:\User\scott ), 
   * a unix path (/home/scott)
   * or a gitbash path (i.e. C:/Users/scott)
   * Because of this spaces are NOT allowed.
   */
  static toParts(path: string): string[] {
    let r: string[] = new Array();
    let b = '';
    var j = 0;
    var i=0; 
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
    for (; i< path.length; i++) {
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
    return r;
  }

  static toUnix(path: string): string {
    return this.toUnixPath(this.toParts(path));
  }
  static toUnixPath(parts: string[]): string {
    let b = '/';
    for (var i=0; i < parts.length; i++) {
      if (i == parts.length - 1) {
        b = b.concat(parts[i]);
      } else {
        b = b.concat(parts[i]).concat('/');
      }
    }
    return b;
  }

  static toWindowsPath(parts: string[]): string {
    let b = '';
    for (var i=0; i < parts.length; i++) {
      if (i == 0) {
        if (parts[0].length == 1) {
          b = parts[0].toUpperCase() + ':\\';
        } else {
          b = parts[0].concat('\\');
        }
      } else if (i == parts.length -1) {
        b = b.concat(parts[i]);
      } else {
        b = b.concat(parts[i]).concat('\\');
      }
    }
    return b;
  }
}

const DEBUG: I_CliCtxFlag = {cmd: "debug", description: "Displays debugging information about htis program.", flag: true}
const HELP: I_CliCtxFlag = {cmd: "help", description: "Displays the Help Menu, prints this output."}
const VERSION: I_CliCtxFlag = {cmd: "version", description: "Displays the version.", flag: true, letter: "v"}

class CliCtx {
  private done: boolean = false;
  private dir: string;
  private i_out: I_Out;
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
    if (args == undefined) {
      args = process.argv;
    }
    if (belowRoot == undefined) {
      belowRoot = 1;
    }
    if (out == undefined) {
      out = (message) => console.log(message);
    }
    this.i_out = out;
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
      //out('processing cli arg ' + a);
      if (a.length < 2) {
        let a = i -1;
        throw Error('Unable to parse command line arguments, issue at argument; ' + a);
      } else {
        let dd = a.substring(0,2);
        if (dd == '--') {
          let cmd = a.substring(2, a.length);
          //out('cmd is ' + cmd);
          let flag: CliCtxFlag = map2Cmds.get(cmd);
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
          for (var j=1; j < a.length; j++) {
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
    if (this.map.get(HELP.cmd)) {
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
    } else if (this.map.get(VERSION.cmd)) {
      let homePkgJsonName = this.home + '/package.json';
      //out('Got homePkgJsonName ' + homePkgJsonName);
      let homePkgJson =  Paths.toOsPath(homePkgJsonName);
      //out('Got homePkgJson ' + homePkgJson + ' fs is ' + fs);
      let json = fs.readFileSync(homePkgJson);
      //out('Got JSON string ' + json);
      let jObj = JSON.parse(json);
      //out('Got JSON ' + jObj);
      out(jObj.version);
      this.done = true;
    }
  }
  getDir(): string { return this.dir; }
  getHome(): string { return this.home; }
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
  
  
  run(cmd: string, args: string[], ctx: CliCtx, options?: any): SpawnSyncReturns<Buffer> {
    var cc = cmd;
    if (args != undefined) {
      for (var i=0; i < args.length; i++) {
        cc = cc + ' ' + args[i];
      }
    }
    return this.logCmd(cc, spawnSync(cmd, args, options), ctx, options);
  }
  out(message: string) { console.log(message); }
  setDir(): void { 
    let arg: CliCtxArg = this.map.get(DIR.cmd);
    var dir: string = process.cwd();
    if (arg == undefined) {
      if (this.map.has('debug')) {
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
    this.dir = Paths.toOsPath(dir);
    if (this.map.has('debug')) {
      out('after toOsPath CliCtx.dir is ' + this.dir);
    }
  }
 
  private logCmd(cmdWithArgs: string, spawnSyncReturns: SpawnSyncReturns<Buffer>, ctx: CliCtx, options?: any ): SpawnSyncReturns<Buffer> {
    out('ran ' + cmdWithArgs  );
    if (options != undefined) {
      if (options.cwd != undefined) {
        out('\tin ' + options.cwd);
      } else {
        out('\tin ' + ctx.getDir());
      }
    } else {
      out('\tin ' + ctx.getDir());
    }
    out('\tand the spawnSyncReturns had;');
    if (spawnSyncReturns.error != undefined) {
      out('\tError: ' + spawnSyncReturns.error);
      out('\t\t' + spawnSyncReturns.error.message);
    }  
    if (spawnSyncReturns.stderr != undefined) {
      out('\tStderr: ' + spawnSyncReturns.stderr);
    }
    if (spawnSyncReturns.stdout != undefined) {
      out('\tStdout: ' + spawnSyncReturns.stdout);
    }
    return spawnSyncReturns;
  }
}

export class FsContext {
  private cliCtx: CliCtx;

  constructor(cliCtx: CliCtx) {
    this.cliCtx = cliCtx;
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

  constructor(info: I_DependencySLinkGroup, ctx: CliCtx) {
    this.group = info.group;
    this.projects = DependencySLinkProject.to(this.group, info.projects, ctx);
    this.unixIn = ctx.getHome() + '/node_modules/' + this.group;
  }
  getGroup(): string { return this.group;}
  getProjects(): DependencySLinkProject[] { return this.projects;}
  getIn(): string { return this.unixIn;}
}

export class DependencySLinkProject {
  static to(group: string, projects: I_DependencySLinkProject[], ctx: CliCtx): DependencySLinkProject[] {
    let r = new Array(projects.length);
    for (var i=0; i < projects.length; i++) {
      r[i] = new DependencySLinkProject(group, projects[i], ctx);
    }
    return r;
  }
  private project: string;
  private modulePath: string;
  private unixTo: string;

  constructor(group: string, info: I_DependencySLinkProject, ctx: CliCtx) {
    this.project = info.project;
    this.modulePath = info.modulePath;
    this.unixTo = '../../../' + info.project;
  }

  getProjectName(): string { return this.project; }
  getModluePath(): string { return this.modulePath; }
  getUnixTo(): string { return this.unixTo; }

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
    this.name =slink.project + '@slink';
    if (slink.destPath == undefined) {
      this.unixIn = 'src';
    } else {
      this.unixIn = slink.destPath;
    }
    if (slink.srcPath == undefined) {
      this.unixTo  = '../../' + slink.project + '/src';
    } else {
      this.unixTo  = '../../' + slink.project + slink.srcPath;
    }
  }
  getUnixIn(): string { return this.unixIn;}
  getName(): string { return this.name; }
  getUnixTo(): string { return this.unixTo; }
  toString(): string {
    return 'DependencySLink [name=\'' + this.name + '\', unixIn=\'' + this.unixIn +
      '\', unixTo=\'' + this.unixTo + '\']';
  }
}
//console.log('hello slink2 ');
const DEFAULT: I_CliCtxFlag = {cmd: "default", description: "Deletes stuff in node_modules and adds the symbolic links\n" +
  "\t\tdetails are here;\n" +
  "\t\thttps://github.com/adligo/slink.ts.adligo.org", flag: true, letter: "d"}
const DIR: I_CliCtxFlag = {cmd: "dir", description: "A parameter passing the working directory to run the application in, \n" +
    "conventionally through --dir `pwd`.  Note the Backticks.", flag: false}
let flags: I_CliCtxFlag[] = [DEBUG, DIR, DEFAULT, HELP, VERSION];
let ctx = new CliCtx(flags, process.argv, 2);
if (!ctx.isDone()) {
  ctx.setDir();
  let currentPkgJson = ctx.getDir() + getPathSeperator() + 'package.json';
  //console.log('looking at ' + currentPkgJson);
  if (currentPkgJson.length >= 20) {}
    let slinkHomeCheck = currentPkgJson.substring(currentPkgJson.length - 20, currentPkgJson.length);
    //console.log('slinkHomeCheck ' + slinkHomeCheck);
    if ('/slink/package.json' == currentPkgJson) {
      throw Error('The current working directory is coming from the slink installation,' +
        'please set the current working directory using --dir <someDirectory/>.');
    }
  let currentPkgJsonOs =  currentPkgJson;
  out('reading ' + currentPkgJsonOs);
  let json = JSON.parse(fs.readFileSync(currentPkgJsonOs));
  var slinks : I_DependencySrcSLink[] = json.dependencySrcSLinks;
  var foundSrcSlinks : boolean = false;
  if (slinks == undefined || slinks.length == 0) {
  } else {
    foundSrcSlinks = true;
    for (var i=0; i < slinks.length; i++) {
      let dl = new DependencySrcSLink(slinks[i], ctx);
      out(dl.toString());
      let unixIn: string[] = Paths.toParts(dl.getUnixIn());
      //console.log('unix in is ' + unixIn)
      let unixTo: string[] = Paths.toParts(dl.getUnixTo());
      //console.log('unix to is ' + unixTo)
      let slinkIn: string[] = Paths.findPath(ctx.getDir(), unixIn);
      let slinkTo: string[] = Paths.find(slinkIn, unixTo);


      if (ctx.isWindows()) {
          //existsSync s broken!

          if (ctx.isBash()) {
            let ssr: SpawnSyncReturns<Buffer> = ctx.run('ls',[ Paths.toUnixPath(slinkIn.concat(dl.getName()))], ctx);
            if (ssr.output.toString().includes('No such file or directory')) {

              ctx.run('rm',['-fr', dl.getName()], ctx, { cwd: Paths.toUnixPath(slinkIn)})
            }
          } else {
            ctx.run('rmdir',['/s', dl.getName()], ctx, { cwd: Paths.toWindowsPath(slinkIn)})
          }
      } else {
        if ( fs.existsSync(dl.getName(), { cwd: Paths.toUnixPath(slinkIn)})) {
          ctx.run('rm',['-fr',dl.getName()], ctx, { cwd: Paths.toUnixPath(slinkIn)})
        }
      }

      if (ctx.isWindows()) {
        if (ctx.isBash()) {
          ctx.run('ln',['-s', '-T', Paths.toUnixPath(slinkTo),dl.getName()], ctx, { cwd: Paths.toWindowsPath(slinkIn)});
        } else {
          ctx.run('mklink ', ['/J', dl.getName(), Paths.toWindowsPath(slinkTo)], ctx, { cwd: Paths.toWindowsPath(slinkIn)});
        }
      } else {
        ctx.run('ln',['-s', '-T',  Paths.toUnixPath(slinkTo),dl.getName()], ctx, { cwd: Paths.toUnixPath(slinkIn)});
      }
    }
  }

  var linkGroups : I_DependencySLinkGroup[] = json.dependencySLinkGroups;
  var foundSLinkGroups : boolean = false;
  if (linkGroups == undefined || linkGroups.length == 0) {
  } else {
    for (var i=0; i < linkGroups.length; i++) {
      foundSLinkGroups = true;
      let g = new DependencySLinkGroup(linkGroups[i], ctx);
      let gdir = 'node_modules/' + g.getGroup();
      out('Deleting ' + gdir);
      if (ctx.isWindows()) {
        if (ctx.isBash()) {
          ctx.run('rm',['-fr', Paths.toUnix(gdir)], ctx)
        } else {
          ctx.run('rmdir',['/s', Paths.toOsPath(gdir)], ctx)
        }
      } else {
        ctx.run('rm',['-fr', Paths.toOsPath(gdir)], ctx)
      }
      out('Creating ' + gdir);
      if (ctx.isWindows()) {
        if (ctx.isBash()) {
          ctx.run('mkdir',[Paths.toUnix(gdir)], ctx);
        } else {
          ctx.run('mkdir',[Paths.toOsPath(gdir)], ctx);
        }
      } else {
        ctx.run('mkdir',[Paths.toOsPath(gdir)], ctx);
      }

      let inDir = Paths.toOsPath(g.getIn());
      out('Linking in ' + inDir);
      g.getProjects().forEach((p) => {
        out(p.toString());
        if (ctx.isWindows()) {
          if (ctx.isBash()) {
            ctx.run('ln',['-s', '-T', Paths.toUnix(p.getUnixTo()), Paths.toUnix(p.getModluePath())], ctx);
          } else {
            ctx.run('mklink ', ['/J', Paths.toOsPath(p.getUnixTo()), Paths.toOsPath(p.getModluePath())], ctx);
          }
        } else {
          ctx.run('ln',['-s', '-T', Paths.toOsPath(p.getUnixTo()), Paths.toOsPath(p.getModluePath())], ctx);
        }
      });
    }
  }

  if (!foundSLinkGroups || !foundSrcSlinks) {
    if (!foundSLinkGroups && !foundSrcSlinks) {
      out('No dependencySLinkGroups or dependencySrcSLinks found in \n\t' + currentPkgJsonOs);
    } else if (!foundSLinkGroups) {
      out('No dependencySLinkGroups found in \n\t' + currentPkgJsonOs);
    } else {
      out('No dependencySrcSLinks found in \n\t' + currentPkgJsonOs);
    }
  }
}
//console.log('CliArgParser created with home\n\t' + ctx.getHome());
