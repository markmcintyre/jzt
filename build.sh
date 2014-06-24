#!/bin/bash

# Remove our target directory, if it exists
rm -rf target

# Copy our site contents to target
cp -r site target

# Copy over our license, replacing {{JZT:YEAR}} with the current year
YEAR=`date +'%Y'`
sed "s/{{JZT:YEAR}}/$YEAR/g" license.txt > ./target/js/jzt.min.js
sed "s/{{JZT:YEAR}}/$YEAR/g" license.txt > ./target/js/jzt-ux.min.js

# Next, append our uglified JavaScript
#uglifyjs ./script/audio.js ./script/basic.js ./script/board.js ./script/commands.js ./script/file-management.js ./script/graphics.js ./script/i18n.js ./script/input.js ./script/jzt.js ./script/jztscript.js ./script/lz-string-1.3.3.js ./script/parser.js ./script/popup.js ./script/script.js ./script/scroll.js ./script/things.js -c -m >> ./target/js/jzt.min.js
#uglifyjs ./script/jzt-ux.js >> ./target/js/jzt-ux.min.js
cat ./script/audio.js ./script/basic.js ./script/board.js ./script/file-management.js ./script/graphics.js ./script/i18n.js ./script/input.js ./script/jzt.js ./script/lz-string-1.3.3.js ./script/things.js ./script/parser.js ./script/popup.js ./script/jzt-script-parser.js ./script/jzt-script.js ./script/jzt-script-commands.js ./script/scroll.js >> ./target/js/jzt.min.js
cp ./script/jzt-ux.js ./target/js/jzt-ux.min.js

# Replace our copyright year
sed "s/{{JZT:YEAR}}/$YEAR/g" ./target/index.html > ./target/index.html.new
mv ./target/index.html.new ./target/index.html