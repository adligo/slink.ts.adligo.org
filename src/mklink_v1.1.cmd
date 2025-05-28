set name=%1
# target is the name of the 
set target=%2
echo "mklink.cmd v 1.1"
echo "linking %target% to %name%"
mklink /J %name% %target%