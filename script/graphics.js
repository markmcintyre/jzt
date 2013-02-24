window.jzt = window.jzt || {};

jzt.Graphics = function(game) {
  
    this.SPRITE_DATA_WIDTH = 128;
    this.SPRITE_DATA_HEIGHT = 256;
    this.SPRITE_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAEAAQMAAABBN+zkAAAABlBMVEUAAAD///+l2Z/dAAAGDElEQVRYw8WXz2sbRxTHhxT2NCju7VEZ+5I/YGhBWdrBhtJ/offBCdMcltanjaDDJrnkTyiEnnvp/xDYSjD0MPhYBFKNT/KlFEHA0UHM9vtmJVkS+dXEbZ5W9uqzb+f9mLdvZoVYSoPPllyDqlqBA338CGdPcIWIQcd+cY+E+GVc7GnN4DN7/IhYI+a6Eo0efm7VvXEC7rKhS/usD6CFeD6M8RLXv34etLp3KcSzS2hUCVDSeNK4nIhvCdXpd2mMfI/N6mGg2SWxY3uiNduniyntuF6/KpZ3Bmt5fAt/3AaoM7KPPBKwMnjR0XZs4MkKzA4qO87hXgJ7UcyPyI4LvoWUuJNHESPZH9MY0tQ2d0mjm0CMdeNcGqNbxKrVcDlbEd08aqpIxTsxT350ZSTSbCXusacYg2/Z9N+JDxba/mkZqI3LFkZyJddI28KLQl37oe8Ug0FhlEy/kFAtYu1zoaRlnYxNFE6WACmJMoGMJgBNJSIbZKDCSiPZik9NSGOAmKThfeDKxCnV7aBPS8GOATzeikW9JrgPF03OyZhH55b5t7n3+7Xx3nOoxothP8t0XWfeY3aFAiCZFUuA+ZVijFkNi4V0FXsqCUBlMfPkMw41I9xiMpl5xUBVkkG9BFyZiMqS99IDyGSFhK6iO3BOub5Q8OPGA3+d7C30PEbt9cF0NvROuNzawlrrSVpzOfXCF3ZgT04GCTRXAN7W9sGDGqAwTfTi3Lva9vt1JNk343OAmDTOPYPhGWsAGCSZQmGGSPXE86AJ2BMGtWezxjKwDJxnx2Zfet2fRnbsPwh9F+RCLNzCNX4IabTQBSbKWz9OYKgeS9+CZwB2+FTV/MwAGALQVqoLBs6jNwKQJnXKwPhCAqBulMpbYDMGmozaT+APRO5tY+k31UngnIG2QxqqjMHMTZ12ZIe60bdSU5G77nd2mubbRb0VkLgQ+0jMBWUXeYsMLBeo0GxVpAzu8zO+BP0+PDVlkXcsTSeYOVn4ws9CSVlBjUUOna1DNMFS1qcxgwBQvxoUK+CDT8C2oHSudMiKzqZ6bNf1IbkFbkrYBX3ucDdQNx06Lbeyhkd7sgugPCknbhFQPz4yyIUNpVcAiOgUk1YAWMNAc4ch4QFMDjAmr9ZAqmDH2ps18L2gkU2+B03YIRf7JeqjinCMZ2VVH9ny/xrI9Uq4PJm/Y+BcAHJPmBxRGUEoa6ED5UEVIvfKasXBCfyiHFERmhxSNVg23uUQWBqD60Oscy7P86IA8BLCPRixcDMI6M/OmRhjCwahDhBb13VahBF+AroF0NDBM5DrMWTpSkiGcbTWANmWH++39tIrnhekQhk0RcS86CAtR0hFH8uGoGJou9BBhBQIXaG6by1PVWjv9X5o8EQL+32AkyHA9XpGJyTMVxHnLTCNrYTrhmtAP0CjWoMhNABGa1AZArCTNaApg/jwDFbKsnKOFvTiOpJlXkZCbJfH6eYD8yYpNxOE5UxMNBdKnbZ4Ci2vRAoUAzaKZJmJT2AwWHsxPcpTRpK53IXJVcptCNQbYYX1wcbKqVQOSKdjcI6x6kwpGvVEYHDGJjJjNTQSwGi+zs7ONMbYAD//xDVQalemVoQMHO3Mq8x2QjzM3q0+Pv32T3jYE6LXw4FRv/n14TZ4X415T8yvevGqN7/WoKyXZSuN+fwqQuMqxvl8pdHD0Utlu7RyDf4fjbTXYSLS5ybBYe/u8cvmbvOyWWsotey8h03Dx91jXE4a6Y2IU9ZLWRUfC/BB/OX3s9nt5mYAjsND/NvSoA2NpmmODw+Pm2aOtMxus189/nIyPy54u/TjavHBarXP67kXjKocLeQT5RhgD2pLKjyJDBv4MtSFqewETV9WFcBkVBdqZAlr5dF47LwYQYMYxMKOx9AY+ZUGwIslMCNHGqAdA8CPDLcfix7WWomnhqr8by3qfb96/7zxF7oE0B1vj1YduQNQ8K6q7dlKdleAq597ZDftMwCMS02ZdxHcpmXxO4MKWze06QTmjm9hjYot/dWui7wPGaGzI97lQqkkjdL2pgU8BQDLFZU1GrxRtx7uvzGUfwH+AU5y3R4xFQunAAAAAElFTkSuQmCC';
    
    this.game = game;
    this.sprites = [];
    this.spriteSize = game.SPRITE_SIZE;
    this.tileSize = game.TILE_SIZE;
    this.spriteSource = new Image();
    this.spriteSource.src = this.SPRITE_DATA;
    this.colorSpriteSource = undefined;
    
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
        
        instance.ready = true;
        
    };
    
};

jzt.Graphics.prototype.isReady = function() {
    return this.ready;
}

jzt.Graphics.prototype.getSprite = function(index) {
    return this.sprites[index];
};

jzt.Sprite = function(point, owner) {
    this.point = point;
    this.owner = owner;
};

jzt.Sprite.prototype.draw = function(context, point, colorCode) {
    
    var background = jzt.colors.Colors[colorCode.charAt(0)];
    var foreground = jzt.colors.Colors[colorCode.charAt(1)];
    
    /*
     * Back in the DOS days, a bright background would actually signal
     * that the foreground color should blink.
     */
    if(background.index > 8) {
        var blink = true;
        background = jzt.colors.Colors[background.index - 8];
    }
    
    var destinationX = point.x * this.owner.tileSize.x;
    var destinationY = point.y * this.owner.tileSize.y;

    // Draw the background
    context.fillStyle = background.rgbValue;
    context.fillRect(destinationX, destinationY, this.owner.tileSize.x, this.owner.tileSize.y);
    
    // If we aren't blinking, or if the blink state is off, draw our sprite
    if(!blink || ! this.owner.game.blinkState) {
        
        var yOffset = foreground.index * this.owner.SPRITE_DATA_HEIGHT;
        
        context.drawImage(this.owner.colorSpriteSource, this.point.x, yOffset + this.point.y, this.owner.spriteSize.x, this.owner.spriteSize.y,
            destinationX, destinationY, this.owner.tileSize.x, this.owner.tileSize.y);
            
    }
 
};

jzt.colors = jzt.colors || {};

jzt.colors.Color = function(name, index, r, g, b) {
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
    '0': new jzt.colors.Color('BLACK',         0,  0,   0,   0  ),
    '1': new jzt.colors.Color('BLUE',          1,  0,   0,   170),
    '2': new jzt.colors.Color('GREEN',         2,  0,   170, 0  ),
    '3': new jzt.colors.Color('CYAN',          3,  0,   170, 170),
    '4': new jzt.colors.Color('RED',           4,  170, 0,   0  ),
    '5': new jzt.colors.Color('MAGENTA',       5,  170, 0,   170),
    '6': new jzt.colors.Color('BROWN',         6,  170, 85,  0  ),
    '7': new jzt.colors.Color('WHITE',         7,  170, 170, 170),
    '8': new jzt.colors.Color('DARKGRAY',      8,  85,  85,  85 ),
    '9': new jzt.colors.Color('BRIGHTBLUE',    9,  85,  85,  255),
    'A': new jzt.colors.Color('BRIGHTGREEN',   10, 85,  255, 85 ),
    'B': new jzt.colors.Color('BRIGHTCYAN',    11, 85,  255, 255),
    'C': new jzt.colors.Color('PINK',          12, 255, 85,  85 ),
    'D': new jzt.colors.Color('BRIGHTMAGENTA', 13, 255, 85,  255),
    'E': new jzt.colors.Color('YELLOW',        14, 255, 255, 85 ),
    'F': new jzt.colors.Color('BRIGHTWHITE',   15, 255, 255, 255)  
};

jzt.colors.COLOR_COUNT = 16;

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