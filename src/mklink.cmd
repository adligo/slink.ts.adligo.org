set name=%1
# target is the name of the 
set target=%2
echo "linking %target% to %name%"
mklink /D %name% %target%