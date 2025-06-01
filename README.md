# slink.ts.adligo.org
This is a simple Type Script Application that will create and store symbolic link data into your package.json file under the dependencySLinks or dependencySLinkGroups sections. This can help you improve the speed of changing upstream Javascript or Typescript in a multiple project dependency system.  

## Install slink
To install slink run the following command;

```
npm install -g @ts.adligo.org/slink
```

## Uninstall the package;

```
npm uninstall -g @ts.adligo.org/slink
```

## Run slink
The following commands include the suggested usage from GitBash.

```
slink --debug
slink --version
slink --help
slink
slink --path `pwd`
```

## Alternativly you can build slink from scratch @see the git repository;

[SLink](https://github.com/adligo/slink.ts.adligo.org)

## sharedNodeModuleProjectSLinks

This will look for projects in the associated array of strings in entry order and attempt to link node_modules to the parent project.  This allows sharing of node_modules installations for multiple projects.  We are testing it now ...

## sharedNodeModuleProjectSLinkEnvVar

This provides slink with a list of environment variables to scan for a node_modules directory, the path should be absolute.   We are testing it now ...

## dependencySrcSLinks @deprecated!

Note this has been deprecated as it didn't work as well as ../.. in VsCode!  Don't use it!
Instead use paths like the following in your imports;
 ../../<project_name/>/src/<module_file_name/>

These are the fastest and simplest links you can store in your package.json file.  By default they will link
to another project checked out in the same folder as the current project.  Also by default slink will place a symbolic link named &lt;project_name&gt;@slink in your source folder.

In Example, under the root package.json object add the attribute;

```
  "dependencySrcSLinks": [{
    "project": "i_io.ts.adligo.org"
  }],
```
Then import the code in your TypeScript file;

```
  import {I_Out} from './i_io.ts.adligo.org@slink/i_io.mts';
```

## dependencySLinkGroups @deprecated!

Note this has been deprecated as it didn't work as well as ../.. in VsCode!  Don't use it!
Instead use paths like the following in your imports;
 ../../<project_name/>/src/<module_file_name/>
 
These are links in your node_modlue folder to projects that are checkout in the same directory in the current folder.  When using these kind of links you should continue to import your node modules as usual with dependencies in package.json.  The settings here will delete the node_modules and create symbolic links to the projects checked out in the parent folder.

In Example, under the root package.json object add the attribute;

```
  "dependencySLinkGroups": [{
    "group": "@ts.adligo.org",
    "projects": [{
      "project": "io.ts.adligo.org",
      "modulePath": "io"}]
  }],
```

## Install Locally
You can install this slink command line application locally with npm;

```
cd slink.mts.adligo.org
npm run build
```


## Compile / Run the TypeScript Compile (creates a bin and dist folder)

```
 npm run tsc
```

## Development Install it from the local code

```
npm install -g .
```

## Release Slink

If you have a working copy of slink from a npm install you will not need to do this.  
With out a working installation of slink you will need to run two npm installs one in 
slink.ts.adligo.org and one in slink_tests.ts.adligo.org.  Then you can run npm run build for slink and npm run tests (i.e. npm run testsWindows) in slink_tests.
Once that's done run the following from slink.ts.adligo.org ;

```
npm publish 
```

## Note for Windows Users

Creating a symbolic link is kind of a huge pain in Windows.  First try to see if you can do it without slink using this short tutorial;

[Symlinks on Windows](SYMLINKS_WINDOWS.md);