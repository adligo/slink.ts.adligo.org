# Symlinks on Windows

### In order to use slink well, you will need to make sure you can create symlinks in windows first;

Try opening a Command Prompt (NOT Power shell, and NOT GitBash), as ADMINISTRATOR!
Try the following command

```
mklink /D foo someFolderOnYourComputer
```

Then in a GitBash prompt execute this command in the same directory;

```
ls -Al
```

You should see something like this with the arrow;

```
lrwxrwxrwx 1 scott 197121    24 May 17 18:32 foo -> log2_tests.ts.adligo.org/
```

The next pain thinking you will be able to find 'mklink' somewhere, you will NOT!  So the best solution I have found is to copy the
mklink.cmd file from src/mklink.cmd and put it in your GitBash path.  Then you should be able to call it from GitBash.  However, you will likely get an error like;
'You do not have sufficient privilege to perform this operation.'

In order to overcome this run your GitBash terminal as ADMINISTRATOR.  We recommend you use a dedicated GitTerminal for slink and nothing else when you need slink, to prevent other issues that could arise from running GitBash as ADMINISTRATOR (i.e. deleting your entire hard drive).  

Finally to get slink to work you will need a Environment Variable MKLINK_CMD to point to the mklink.cmd script.  For example, I have
something like the following in my ~/.bash_profile file.

```
export MKLINK_CMD=~/bin/mklink.cmd
```

Then you can reload this file in GitBash with;

```
source ~/.bash_profile
echo $MKLINK_CMD
```

Finally note I have the path to the windows command 'cmd' hard coded to ( C:\Windows\system32\cmd), you can simply recompile the source 
if you want to change this.


