#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
    *CYGWIN*|*MINGW*|*MSYS*)
        if command -v cygpath > /dev/null 2>&1; then
            basedir=`cygpath -w "$basedir"`
        fi
    ;;
esac

if [ -x "$basedir/node" ]; then
  #echo 1 # this one is the one I actually call
  exec "$basedir/node"  "--disable-warning=DEP0190"  "$basedir/node_modules/@ts.adligo.org/slink/dist/slink.mjs" "$@"
else
  #echo 2
  exec node --disable-warning=DEP0190 "$basedir/node_modules/@ts.adligo.org/slink/dist/slink.mjs" "$@"
fi