# slink.ts.adligo.org
This is a simple Type Script Application that will create and store symbolic link data into your package.json file under the dependencySLinks or dependencySLinkGroups sections. This can help you improve the speed of changing upstream Javascript or Typescript in a multiple project dependency system.  

## Install slink
To install slink run the following command;

```
npm install -g @ts.adligo.org/slink
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

## dependencySrcSLinks 
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

## dependencySLinkGroups
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
cd slink.ts.adligo.org
npm run build
```
## Uninstall the package;

```
npm uninstall -g @ts.adligo.org/slink
```

## Compile / Run the TypeScript Compile (creates a bin and dist folder)

```
 npm run tsc
```

## Development Install it from the local code

```
npm install -g .
```
