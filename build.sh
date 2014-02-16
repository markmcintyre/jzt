#!/bin/bash

# Remove our target directory, if it exists
rm -rf target

# Make our target directly, if it doesn't already exist
mkdir -p target

# Copy over our license, replacing {{JZT:YEAR}} with the current year
YEAR=`date +'%Y'`
sed "s/{{JZT:YEAR}}/$YEAR/g" license.txt > ./target/jzt.min.js

# Next, append our uglified JavaScript
uglifyjs ./script/audio.js ./script/basic.js ./script/board.js ./script/commands.js ./script/file-management.js ./script/graphics.js ./script/i18n.js ./script/input.js ./script/jzt.js ./script/jztscript.js ./script/lz-string-1.3.3.js ./script/parser.js ./script/popup.js ./script/script.js ./script/scroll.js ./script/things.js -c -m >> ./target/jzt.min.js

# Copy over our HTML/CSS Files
sed "s/{{JZT:YEAR}}/$YEAR/g" index.html > ./target/index.html
cp ./css/main.css ./target/main.css