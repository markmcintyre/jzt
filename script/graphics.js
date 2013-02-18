window.jzt = window.jzt || {};

jzt.Graphics = function(game) {
  
    this.SPRITE_DATA_WIDTH = 288;
    this.SPRITE_DATA_HEIGHT = 128;
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