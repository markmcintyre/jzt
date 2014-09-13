#!/bin/bash

# Remove our target directory, if it exists
rm -rf target

# Copy our site contents to target
cp -r site target

# Copy over our license, replacing {{JZT:YEAR}} with the current year
YEAR=`date +'%Y'`
sed "s/{{JZT:YEAR}}/$YEAR/g" license.txt > ./target/js/jzt.min.js

# Next, append our uglified JavaScript
uglifyjs ./script/preparation.js ./script/audio.js ./script/basic.js ./script/board.js ./script/file-management.js ./script/graphics.js ./script/i18n.js ./script/input.js ./script/jzt.js ./script/thirdparty/lz-string-1.3.3.js ./script/things.js ./script/lexer.js ./script/parser.js ./script/popup.js ./script/jzt-script-commands.js ./script/jzt-script-parser.js ./script/jzt-script.js ./script/scroll.js ./script/ux/ux-settings.js ./script/ux/ux-highscore.js ./script/ux/ux-fullscreen.js -c -m >> ./target/js/jzt.min.js

# Replace our copyright year
sed "s/{{JZT:YEAR}}/$YEAR/g" ./target/index.html > ./target/index.html.new
mv ./target/index.html.new ./target/index.html
