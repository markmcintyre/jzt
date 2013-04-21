window.jzt = window.jzt || {};

jzt.Graphics = function(game, onLoadCallback) {
  
    this.SPRITE_DATA_WIDTH = 128;
    this.SPRITE_DATA_HEIGHT = 256;
    this.SPRITE_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAEAAQMAAABBN+zkAAAABlBMVEUAAAD///+l2Z/dAAAGBElEQVRYw8WXv4skRRTHC4WOmr01e7jLbWJwYaEwV0ixC+K/YGJU3El5QSEbtQMWfWdy/4OJmYn/g9DMycOguHAZmHHZaDeRY0DYm2Cp9vuqZ2Z/eHqnrlrT86M/87rej3r9XrVSq9HjdW1cgrZdg7v24DF+fY1/iARs+Q8eklLfzcK2tQLe9QePSSSysa3q7bP3vX44KyCe9XTmvxkDWKV+eJbzGf7/6Idk9cMzpb45g0RbABWJr/toiOSS1B5+XuYw26LWPku0OCMxbFsNasd0cko3TO9e5csbg8148hY+4hXQVeQfMwKwVniyZf3MwZI1WNxt/czAvAK2s1ruk58FuYS0umeyypn8V2WO2nXBxCKxU0DOXY6xzLETcjtIRCNa1I7JllrS+V42xY6dOhNZ0ZK3xVLMIZdctT+qfzzo+qkXoK/87aHE6HqDrA+sgr60w74XJpPgdF3OEFCrcsdG6dqLTCUqQqwbgBLEuoCK5gB9q7IoFKDTWqLoyk9dKnOAuCLBnCQz8ZO6YdKnjRLDAJ5c80X/gXP/fBiKsc5GFnGIfzDMu51jZnHVseJxVdmuq5ixukoDUF2FFcD61uoIq5ouLurYiqU1AegqV0xciasV4RJX1RVrAbqtBXQrIJkJrwIx1wxQFy2kTJvj3Rh1HCsNO27d8T8a2xd2mbNle/d0wRxVNN4H7z289u7FKdwPfuIfPJgUkM8B2Hf+0aMOILicWR1z7Px43GWqx+7oGCAXiWMWwM9FAsAhyJRCCfWcZdIC/AMBHYta5wV4AZHFsMWHbMenWQz7F1z/XXIodREvYgv97LNVNuB+Ys8DYP2k5gF8ivPgn+pO7hkAh9Xk6Gt9IiAyaiPzkbGkDwU4DnUBpLUZgK8ERHJ6t4AjeM4hB5rorQKOBZgX+NCVgEU8jTZuB7bZvlWKSn3T/K0bRfP1Q78WkDpRuwjMCVUnZkAOmgMytFonqYDP5B5fgfEYlrommC1Pv8yxcnXgwIvUUBUoe8Qw+i5llzxVYzoSkAC6V4OwBpy4AD+AJsYmIiq2OrXsN/lRSwm8OtJNMJYKdwt5s0WHzbWo4dae3wQQnjfzeJEkqbMAo3xqWAMETodYtADgHcCRkQqDYgHgzAD0BtQDcBvAo2RzKFUJRTgiFrsNBW4zDJNVWedHtfregHrTCVc/lm9aPOXibeUMvHKKkNbKJjJJBwVLvdXinMIZGXhFyhNCNVl1mdUUaI0pjjF8jNEYEwIA1xhSGOCLFIOE+hwjiksewCR1CcN3XVeaMNwvwA4AEjaxgHozR93EBqPCPNZagOqaHX+v99Ir7heEQjsURfi83EJY9hGKMdqGouDTDmTgISVCVbCf+SRLlYZrUVKcXSJKKcHIlGC6W9CPpFyDgscDcG1qVRylS0DHkGg3wOM3wHQDrBNt/hLQqYD8xXNoaZo2RrogvvRkFZepUtfT4/DqDfNno7kaILQzNbeSKF3Z4mmUvAYh0AJEKYLl5lzAZLKx4nTflIgUdSam+XmJbUo0mqLDcvK5jbqkA8IZBRxjrq7SmqYjlQQ8FxWV8xYSBWA27qr5c4s5roCn30oONDY2pRTB4f0b60rVDRf3qzfLj3c++RkWjpQajXBg1o+///I6+LsSy5Fano/y+Wh5KUHVqKrWEsvleYbEec7L5VpihGNU0nal5RL8NxJlryNElddtgr3R/YOX/f3+Zb+R0HpVeff6Xo77B/i7SJQnIgnZqERV/V9ADpK3PJ8t7vS3A3Ds7eHrmgRdkej7/mBv76DvlwjL4o7YNZK3BPP/Ba8f47xuPuhWu9LPWQlqDUrI2zoKwB7US+sjVWED36QuuNbPUfTrtgWYT7ugp57Qgvdns8hqCgkSkIOfzSAx5bUEwK8r4KaRLMAwBwBPnZQfjxo2aMmHjlrzwqpul9fPn7f+QFcAquOd6boib8nzg+yqhpqt6501kOyXGrlT9hkALpaiLLsIKdN1+ElAi60bynQByyiXiEQrmn4Z+qLsQ6ao7PB31Sh1TdOyvRmALAHAqqOKRI8n6sHC3T915S+A3wBO89vlg2hdWgAAAABJRU5ErkJggg==';
    
    this.game = game;
    this.sprites = [];
    this.spriteSize = game.SPRITE_SIZE;
    this.tileSize = game.TILE_SIZE;
    this.spriteSource = new Image();
    this.spriteSource.src = this.SPRITE_DATA;
    this.colorSpriteSource = undefined;
    this.onLoadCallback = onLoadCallback;
    
    var instance = this;
    this.spriteSource.onload = function() {
        
        var buffer = document.createElement('canvas');
        buffer.width = this.width;
        buffer.height = this.height * jzt.colors.COLOR_COUNT;
        instance.colorSpriteSource = buffer;
        //document.body.appendChild(buffer);
        
        var context = buffer.getContext('2d');
        var pixelCount = this.width * this.height * 4;
        
        // Create offscreen canvases
        for(var color in jzt.colors.Colors) {
            if(jzt.colors.Colors.hasOwnProperty(color)) {
                
                var color = jzt.colors.Colors[color];
                var yOffset = color.index * this.height;

                context.drawImage(this, 0, yOffset);
                var imageData = context.getImageData(0, yOffset, this.width, yOffset + this.height);
                var rgba = imageData.data;

                for(var pixel = 0; pixel < pixelCount; pixel += 4) {

                    // Only need to read the red value for a B&W image
                    if(rgba[pixel] >= 255) {
                        rgba[pixel] = color.r;
                        rgba[pixel+1] = color.g;
                        rgba[pixel+2] = color.b;
                        rgba[pixel+3] = 255;
                    }
                    else {
                        rgba[pixel + 3] = 0;
                    }

                }

                context.putImageData(imageData, 0, yOffset);
                
            }

        }

        // Create sprites
        var tilesPerRow = this.width / instance.spriteSize.x;
        var tilesPerColumn = this.height / instance.spriteSize.y;
    
        for(var row = 0; row < tilesPerColumn; ++row) {
            for(var column = 0; column < tilesPerRow; ++column) {
            
                var spritePoint = new jzt.Point(column * instance.spriteSize.x, row * instance.spriteSize.y);
                var sprite = new jzt.Sprite(spritePoint, instance);
                instance.sprites.push(sprite);
            
            }
        }
        
        instance.onLoadCallback();
        
    };
    
};

jzt.Graphics.prototype.isReady = function() {
    return this.ready;
}

jzt.Graphics.prototype.getSprite = function(index) {
    return this.sprites[index];
};

jzt.Graphics.prototype.textToSprites = function(text) {

    var result = [];

    for(var index = 0; index < text.length; ++index) {

        var spriteIndex = this.convertSpecialCharacter(text.charCodeAt(index));
        result.push(this.getSprite(spriteIndex));

    }

    return result;

};

jzt.Graphics.prototype.drawString = function(context, point, text, foreground, background) {
    this.drawSprites(context, point, this.textToSprites(text), foreground, background);
};

jzt.Graphics.prototype.drawSprites = function(context, point, sprites, foreground, background) {
    var point = point.clone();
    foreground = foreground || jzt.colors.Colors['E'];
    background = background || '*';
    for(var index = 0; index < sprites.length; ++index) {
        sprite = sprites[index];
        sprite.draw(context, point, foreground, background);
        point.x++;
    }
};

/**
 * Converts a provided special character into its ANSI equivalent.
 * 
 * @param characterCode A Unicode character
 * @return An ANSI character code.
 */
jzt.Graphics.prototype.convertSpecialCharacter = function(characterCode) {

    if(characterCode >= 32 && characterCode <= 126) {
        return characterCode;
    }

    switch(characterCode) {
        case 199: return 128;
        case 252: return 129;
        case 233: return 130;
        case 226: return 131;
        case 228: return 132;
        case 224: return 133;
        case 229: return 134;
        case 231: return 135;
        case 234: return 136;
        case 235: return 137;
        case 232: return 138;
        case 239: return 139;
        case 238: return 140;
        case 236: return 141;
        case 196: return 142;
        case 197: return 143;
        case 201: return 144;
        case 230: return 145;
        case 198: return 146;
        case 244: return 147;
        case 242: return 149;
        case 251: return 150;
        case 249: return 151;
        case 255: return 152;
        case 214: return 153;
        case 220: return 154;
        case 225: return 160;
        case 237: return 161;
        case 243: return 162;
        case 250: return 163;
        case 241: return 164;
        case 209: return 165;
        case 191: return 168;
        case 161: return 173;
        case 171: return 174;
        case 187: return 175;
    }

    // If we haven't mapped, return a question mark.
    return 63;

};

jzt.Sprite = function(point, owner) {
    this.point = point;
    this.owner = owner;
};

jzt.Sprite.prototype.draw = function(context, point, foreground, background) {
    
    /*
     * Back in the DOS days, a bright background would actually signal
     * that the foreground color should blink.
     */
    if(jzt.colors.isBlinkableAsBackground(background)) {
        var blink = true;
        background = jzt.colors.getNonBlinkingEquivalent(background);
    }
    
    var destinationX = point.x * this.owner.tileSize.x;
    var destinationY = point.y * this.owner.tileSize.y;

    // Draw the background
    if(background) {
        context.fillStyle = background.rgbValue;
        context.fillRect(destinationX, destinationY, this.owner.tileSize.x, this.owner.tileSize.y);
    }
    
    // If we aren't blinking, or if the blink state is off, draw our sprite
    if(!blink || ! this.owner.game.blinkState) {
        
        if(foreground == '*') {
            foreground = jzt.colors.COLOR_CYCLE[this.owner.game.colorCycleIndex];
        }

        var yOffset = foreground.index * this.owner.SPRITE_DATA_HEIGHT;
        
        context.drawImage(this.owner.colorSpriteSource, this.point.x, yOffset + this.point.y, this.owner.spriteSize.x, this.owner.spriteSize.y,
            destinationX, destinationY, this.owner.tileSize.x, this.owner.tileSize.y);
            
    }
 
};

jzt.colors = jzt.colors || {};

jzt.colors.Color = function(code, name, index, r, g, b) {
    this.code = code;
    this.name = name;
    this.index = index;
    this.r = r;
    this.g = g;
    this.b = b;
    this.rgbValue = '#' + this._byteToHex(r) + this._byteToHex(g) + this._byteToHex(b);
}

jzt.colors.Color.prototype._byteToHex = function(number) {
    var value = number.toString(16);
    if(value.length <= 1) {
        value = '0' + value;
    }
    return value;
};

jzt.colors.Colors = {
    '0': new jzt.colors.Color('0', 'BLACK',         0,  0,   0,   0  ),
    '1': new jzt.colors.Color('1', 'BLUE',          1,  0,   0,   170),
    '2': new jzt.colors.Color('2', 'GREEN',         2,  0,   170, 0  ),
    '3': new jzt.colors.Color('3', 'CYAN',          3,  0,   170, 170),
    '4': new jzt.colors.Color('4', 'RED',           4,  170, 0,   0  ),
    '5': new jzt.colors.Color('5', 'MAGENTA',       5,  170, 0,   170),
    '6': new jzt.colors.Color('6', 'BROWN',         6,  170, 85,  0  ),
    '7': new jzt.colors.Color('7', 'WHITE',         7,  170, 170, 170),
    '8': new jzt.colors.Color('8', 'DARKGRAY',      8,  85,  85,  85 ),
    '9': new jzt.colors.Color('9', 'BRIGHTBLUE',    9,  85,  85,  255),
    'A': new jzt.colors.Color('A', 'BRIGHTGREEN',   10, 85,  255, 85 ),
    'B': new jzt.colors.Color('B', 'BRIGHTCYAN',    11, 85,  255, 255),
    'C': new jzt.colors.Color('C', 'PINK',          12, 255, 85,  85 ),
    'D': new jzt.colors.Color('D', 'BRIGHTMAGENTA', 13, 255, 85,  255),
    'E': new jzt.colors.Color('E', 'YELLOW',        14, 255, 255, 85 ),
    'F': new jzt.colors.Color('F', 'BRIGHTWHITE',   15, 255, 255, 255)  
};

jzt.colors.COLOR_COUNT = 16;

jzt.colors.COLOR_CYCLE = [
    jzt.colors.Colors['9'],
    jzt.colors.Colors['A'],
    jzt.colors.Colors['B'],
    jzt.colors.Colors['C'],
    jzt.colors.Colors['D'],
    jzt.colors.Colors['E'],
    jzt.colors.Colors['F']
];

jzt.colors.isBlinkableAsBackground = function(color) {
    if(color) {
        return color.index > 8;
    }
    return false;
};

jzt.colors.getNonBlinkingEquivalent = function(color) {

    if(jzt.colors.isBlinkableAsBackground(color)) {
        return jzt.colors.Colors[color.index - 8];
    }
    return color;
};

jzt.colors.getBlinkingEquivalent = function(color) {
    if(!jzt.colors.isBlinkableAsBackground(color)) {
        return jzt.colors.Colors[color.index + 8];
    }
    return color;
};

jzt.colors.getColor = function(name) {
    
    name = name.toUpperCase();
    
    for(color in jzt.colors.Colors) {
        if(jzt.colors.Colors.hasOwnProperty(color)) {
            var color = jzt.colors.Colors[color];
            if(color.name == name) {
                return color;
            }
        }
    }
    return undefined;
};