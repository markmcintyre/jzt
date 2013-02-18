window.jzt = window.jzt || {};

jzt.Graphics = function(game) {
  
    this.SPRITE_DATA_WIDTH = 128;
    this.SPRITE_DATA_HEIGHT = 256;
    this.SPRITE_DATA = 'data:image/png;base64,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';
    
    this.sprites = [];
    this.spriteSize = game.SPRITE_SIZE;
    this.tileSize = game.TILE_SIZE;
    this.spriteSource = new Image();
    this.spriteSource.src = this.SPRITE_DATA;
    
    this.colors = {
        black: new jzt.Color('black', 0, 0 ,0),
        blue: new jzt.Color('blue', 0, 0, 170),
        green: new jzt.Color('green', 0, 170, 0),
        cyan: new jzt.Color('cyan', 0, 170, 170),
        red: new jzt.Color('red', 170, 0, 0),
        magenta: new jzt.Color('magenta', 170, 0, 170),
        brown: new jzt.Color('brown', 170, 85, 0),
        white: new jzt.Color('white', 170, 170, 170),
        darkGray: new jzt.Color('darkGray', 85, 85, 85),
        brightBlue: new jzt.Color('brightBlue', 85, 85, 255),
        brightGreen: new jzt.Color('brightGreen', 85, 255, 85),
        brightCyan: new jzt.Color('brightCyan', 85, 255, 255),
        pink: new jzt.Color('pink', 255, 85, 85),
        brightMagenta: new jzt.Color('brightMagenta', 255, 85, 255),
        yellow: new jzt.Color('yellow', 255, 255, 85),
        brightWhite: new jzt.Color('brightWhite', 255, 255, 255) 
    };
    
    this.foregroundColors = [
        this.colors.brightWhite,
        this.colors.brightBlue,
        this.colors.brightGreen,
        this.colors.brightCyan,
        this.colors.pink,
        this.colors.brightMagenta,
        this.colors.yellow
    ];
    
    this.colorSprites = {};
    
    var instance = this;
    this.spriteSource.onload = function() {
        
        // Create offscreen canvases
        for(var colorIndex = 0; colorIndex < instance.foregroundColors.length; ++colorIndex) {
            
            var buffer = document.createElement('canvas');
            buffer.width = this.width;
            buffer.height = this.height;
            //document.body.appendChild(buffer);

            var context = buffer.getContext('2d');
            
            var color = instance.foregroundColors[colorIndex];
            context.drawImage(this, 0, 0);
            var imageData = context.getImageData(0, 0, this.width, this.height);
            var rgba = imageData.data;
            
            var pixelCount = this.width * this.height * 4;
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
            
            context.putImageData(imageData, 0, 0);
            instance.colorSprites[color.name] = buffer;
            
        }
        
        // Create sprites
        var tilesPerRow = this.width / instance.spriteSize.x;
        var tilesPerColumn = this.height / instance.spriteSize.y;
        console.log('Tiles per row: %d, per col: %d', tilesPerRow, tilesPerColumn);
    
        for(var row = 0; row < tilesPerColumn; ++row) {
            for(var column = 0; column < tilesPerRow; ++column) {
            
                var spritePoint = new jzt.Point(column * instance.spriteSize.x, row * instance.spriteSize.y);
                var sprite = new jzt.Sprite(spritePoint, instance);
                console.log('Sprite %d: %dx%d', instance.sprites.length, sprite.point.x, sprite.point.y);
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

jzt.Sprite.prototype.draw = function(context, point, background, foreground) {
    
    var backgroundColor = this.owner.colors.hasOwnProperty(background) && this.owner.colors[background] || this.owner.colors.black;
    var foregroundColor = this.owner.colors.hasOwnProperty(foreground) && this.owner.colors[foreground] || this.owner.colors.yellow;
    
    var destinationX = point.x * this.owner.tileSize.x;
    var destinationY = point.y * this.owner.tileSize.y;
    
    var imageSource = this.owner.colorSprites[foregroundColor.name];
    
    context.fillStyle = backgroundColor.value;
    context.fillRect(destinationX, destinationY, this.owner.tileSize.x, this.owner.tileSize.y);
    context.drawImage(imageSource, this.point.x, this.point.y, this.owner.spriteSize.x, this.owner.spriteSize.y,
        destinationX, destinationY, this.owner.tileSize.x, this.owner.tileSize.y);

};

jzt.Color = function(name, r, g, b) {
    this.name = name;
    this.r = r;
    this.g = g;
    this.b = b;
    this.value = '#' + this._byteToHex(r) + this._byteToHex(g) + this._byteToHex(b);
}

jzt.Color.prototype._byteToHex = function(number) {
    var value = number.toString(16);
    if(value.length <= 1) {
        value = '0' + value;
    }
    return value;
};