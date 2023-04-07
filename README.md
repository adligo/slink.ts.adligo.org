# slink.ts.adligo.org
This is a simple Type Script Application that will create symbolic links from webpack config files with links created by webpack-link inside of your source folder, which improves speed of changing upstream Javascript or Typescript in a multiple project system.

## Summary of Creating a CLI tool 
1) Edit package.json to have a bin section like;
```

```
2) Install with;
```
npm install -g .
```

## Summary of Publishing your CLI tool
1) Create an account at https://www.npmjs.com/
2) Create a organzation (i.e. ts.adligo.org)
3) Login on your local gitbash with a command like;
```
npm login --scope=@ts.adligo.org
```
4) Run the publish command
```
npm publish --access public
```

## Citations
https://docs.npmjs.com/configuring-your-npm-client-with-your-organization-settings
https://medium.com/@manavshrivastava/lets-build-a-cli-command-line-interface-with-node-js-d3b5faacc5ea
