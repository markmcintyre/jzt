/**
 * JZT Audio
 * Copyright © 2013 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

"use strict";

var jzt = jzt || {};
jzt.colors = jzt.colors || {};
var colorIndex;

/**
 * Graphics provides functions for drawing standard DOS CodePage 437 characters in the usual 16 colour
 * pallette to a graphics context. An optional callback can be provided that will signal when all graphics
 * have been loaded and initialized.
 *
 * @param onLoadCallback An optional callback function to be triggered when this Graphics is loaded and ready to use.
 */
jzt.Graphics = function(onLoadCallback) {
  
    var me = this;

    this.TILE_SIZE = new jzt.Point(16, 32);
    this.SPRITE_SIZE = new jzt.Point(8, 16);

    this.BLINK_RATE = 10;
    this.SPRITE_DATA_WIDTH = 128;
    this.SPRITE_DATA_HEIGHT = 256;

    this.DARK_IMAGE = undefined;
    this.NOISE_IMAGE = undefined;

    this.SPRITE_DATA = 'data:image/png;base64,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';
    
    this.blinkCycle = 0;
    this.blinkState = true;

    this.sprites = [];
    this.spriteSource = new Image();
    this.spriteSource.src = this.SPRITE_DATA;
    this.colorSpriteSources = [];
    this.onLoadCallback = onLoadCallback;
    
    // An anonymous function to finish initialization once our sprite source has been fully loaded
    this.spriteSource.onload = function() {
        
        var buffer;
        var context;
        var pixelCount;
        var color;
        var imageData;
        var rgba;
        var pixel;
        var tilesPerRow;
        var tilesPerColumn;
        var row;
        var column;
        var spritePoint;
        var sprite;
        
        // Create offscreen canvases
        for(color in jzt.colors.Colors) {
            if(jzt.colors.Colors.hasOwnProperty(color)) {

                // Create a buffer to store our sprite graphics
                buffer = document.createElement('canvas');
                buffer.width = this.width;
                buffer.height = this.height;

                // We will create a version of our sprite for each foreground color
                me.colorSpriteSources[color] = buffer;
                
                // Grab our 2D context
                context = buffer.getContext('2d');

                // Each pixel has an ARGB value
                pixelCount = this.width * this.height * 4;
                
                // Get our color
                color = jzt.colors.Colors[color];

                // Draw the black and white image first
                context.drawImage(this, 0, 0);

                // Grab the raw image data
                imageData = context.getImageData(0, 0, this.width, this.height);
                rgba = imageData.data;

                // For each of our pixels...
                for(pixel = 0; pixel < pixelCount; pixel += 4) {

                    /* For a black and white image, we only need to test one of the
                     * values to determine if we need to write a color or a transparent
                     * value.
                     */

                    // If we found an 'on' pixel
                    if(rgba[pixel] >= 255) {

                        // Assign our new pixel color
                        rgba[pixel] = color.r;
                        rgba[pixel+1] = color.g;
                        rgba[pixel+2] = color.b;

                        // Make it completely opaque
                        rgba[pixel+3] = 255;

                    }

                    // If we found an 'off' pixel
                    else {

                        // Make our pixel completely transparent
                        rgba[pixel + 3] = 0;

                    }

                }

                // Write our image data at the same location as it was read from
                context.putImageData(imageData, 0, 0);
                
            }

        }

        // Create our sprites
        tilesPerRow = this.width / me.SPRITE_SIZE.x;
        tilesPerColumn = this.height / me.SPRITE_SIZE.y;
    
        for(row = 0; row < tilesPerColumn; ++row) {
            for(column = 0; column < tilesPerRow; ++column) {
            
                spritePoint = new jzt.Point(column * me.SPRITE_SIZE.x, row * me.SPRITE_SIZE.y);
                sprite = new jzt.Sprite(spritePoint, me);
                me.sprites.push(sprite);
            
            }
        }

        // Create our noise image
        buffer = document.createElement('canvas');
        buffer.width = 256;
        buffer.height = 256;
        pixelCount = 256 * 256 * 4;
        context = buffer.getContext('2d');
        imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        rgba = imageData.data;
        for(pixel = 0; pixel < pixelCount; pixel += 4) {
            rgba[pixel] = 0;
            rgba[pixel+1] = 0;
            rgba[pixel+2] = 0;
            rgba[pixel+3] = Math.round(20 * Math.random());
        }
        context.putImageData(imageData, 0, 0);
        me.NOISE_IMAGE = buffer;

        // Create our darkness image
        buffer = document.createElement('canvas');
        buffer.width = me.TILE_SIZE.x;
        buffer.height = me.TILE_SIZE.y;
        context = buffer.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        sprite = me.getSprite(176);
        sprite.draw(context, new jzt.Point(0,0), jzt.colors.Grey, jzt.colors.Black);
        me.DARK_IMAGE = buffer;
        
        // Now that everything is initialized, trigger our load callback
        me.onLoadCallback();
        
    };
    
};

/**
 * Updates this Graphics's instance's blinking and color cycle state.
 */
jzt.Graphics.prototype.update = function() {

    // Increment our blink cycle counter
    this.blinkCycle++;

    // If we've passed the blink rate threshold...
    if(this.blinkCycle > this.BLINK_RATE) {

        // Adjust our blink state
        this.blinkState = ! this.blinkState;

        // Our color cycle uses the same rate
        jzt.colors.Cycle.update();

        // Reset the blink cycle
        this.blinkCycle = 0;
    }

};

jzt.Graphics.prototype.fillTile = function(c, point, color) {

    var destinationX = point.x * this.TILE_SIZE.x;
    var destinationY = point.y * this.TILE_SIZE.y;

    // Draw the tile
    if(color) {
        c.fillStyle = color.rgbValue;
        c.fillRect(destinationX, destinationY, this.TILE_SIZE.x, this.TILE_SIZE.y);
    }

};

/**
 * Gets a Sprite instance for a provided CodePage-437 character index.
 *
 * @param index A CodePage-437 character index
 * @return A sprite representing a provided CodePage-437 index.
 */
jzt.Graphics.prototype.getSprite = function(index) {
    return this.sprites[index];
};

/**
 * Converts a provided text string into an array of Sprite instances representing
 * CodePage-437 characters. Any text character that does not have an equivalent
 * CodePage-437 representation will be represented by a '?' character.
 *
 * @param text A text string to convert to Sprite instances
 * @return An array of Sprite instances
 */
jzt.Graphics.prototype.textToSprites = function(text) {

    var result = [];

    // For each character in our string...
    for(var index = 0; index < text.length; ++index) {

        // Convert the character into its CodePage-437 index
        var spriteIndex = this.convertSpecialCharacter(text.charAt(index));

        // Push the resulting Sprite onto our result
        result.push(this.getSprite(spriteIndex));

    }

    return result;

};

/**
 * Draws a provided text string to a provided graphics context at a provided Point using a 
 * provided background and foreground color.
 *
 * @param context A 2D graphics context onto which to draw our string
 * @param point A Point instance representing X,Y coordinates (in sprite blocks) where to draw
 * @param text A text string to draw, represented as Sprites
 * @param foreground A foreground Color.
 * @param background A background Color.
 */
jzt.Graphics.prototype.drawString = function(context, point, text, foreground, background) {
    this.drawSprites(context, point, this.textToSprites(text), foreground, background);
};

/**
 * Draws a provided array of Sprite instances to a given Point on a provided 2D graphics context
 * using a provided foreground and background color.
 *
 * @param context A 2D graphics context onto which to draw our sprites
 * @param point A Point instance representing X,Y coordinates (in sprite blocks) where to draw
 * @param sprites An array of Sprite instances
 * @param foreground A foreground Color.
 * @param background A background Color.
 */
jzt.Graphics.prototype.drawSprites = function(context, point, sprites, foreground, background) {
    point = point.clone();
    var sprite;
    foreground = foreground || jzt.colors.Yellow;
    background = background || undefined;
    for(var index = 0; index < sprites.length; ++index) {
        sprite = sprites[index];
        sprite.draw(context, point, foreground, background);
        point.x++;
    }
};

jzt.Graphics.characterTable = {
    '\u236A': 1,   // ☺ Happy Face
    '\u263B': 2,   // ☻ Black happy face
    '\u2665': 3,   // ♥ Heart Suit
    '\u2666': 4,   // ♦ Diamond Suit
    '\u2663': 5,   // ♣ Club Suit
    '\u2660': 6,   // ♠ Spade Suit
    '\u2022': 7,   // • Bullet
    '\u25D8': 8,   // ◘ Inverse Bullet
    '\u25CB': 9,   // ○ White Circle
    '\u25D9': 10,  // ◙ Inverse White Circle
    '\u2642': 11,  // ♂ Male Sign
    '\u2640': 12,  // ♀ Female Sign
    '\u266A': 13,  // ♪ Eighth Note
    '\u266B': 14,  // ♫ Beamed Eighth Notes
    '\u263C': 15,  // ☼ White Sun With Rays
    '\u25BA': 16,  // ► Black Right-Pointing Pointer
    '\u25C4': 17,  // ◄ Black Left-Pointing Pointer
    '\u2195': 18,  // ↕ Up Down Arrow
    '\u203C': 19,  // ‼ Double Exclamation Mark
    '\u00B6': 20,  // ¶ Pilcrow Sign
    '\u00A7': 21,  // § Section Sign
    '\u25AC': 22,  // ▬ Black Rectangle
    '\u218A': 23,  // ↨ Up Down Arrow With Base
    '\u2191': 24,  // ↑ Upwards Arrow
    '\u2193': 25,  // ↓ Downwards Arrow
    '\u2192': 26,  // → Rightwards Arrow
    '\u2190': 27,  // ← Leftwards Arrow
    '\u221F': 28,  // ∟ Right Angle
    '\u2194': 29,  // ↔ Left Right Arrow
    '\u25B2': 30,  // ▲ Black Up-Pointing Triangle
    '\u25BC': 31,  // ▼ Black Down-Pointing Triangle
    '\u2303': 127, // ⌂ House
    '\u00C7': 128, // Ç Capital C Cedilla
    '\u004C': 129, // ü Small u Diaeresis
    '\u00E9': 130, // e Small e Acute
    '\u00E2': 131, // â Small a Circumflex
    '\u00E4': 132, // ä Small a Diaeresis
    '\u00E0': 133, // à Small a Grave
    '\u00E5': 134, // å Small a Ring
    '\u00E7': 135, // ç Small c Cedilla
    '\u00EA': 136, // ê Small e Circumflex
    '\u00EB': 137, // ë Small e Diaeresis
    '\u00E8': 138, // è Small e Grave
    '\u00EF': 139, // ï Small u Diaeresis
    '\u00EE': 140, // î Small i Circumflex
    '\u00EC': 141, // ì Small i Grave
    '\u00C4': 142, // Ä Capital A Diaeresis
    '\u00C5': 143, // Å Capital A Ring
    '\u00C9': 144, // É Capital E Acute
    '\u00E6': 145, // æ Small AE
    '\u00C6': 146, // Æ Capital AE
    '\u00F4': 147, // ô Small o Circumflex
    '\u00F6': 148, // ö Small o Diaeresis
    '\u00F2': 149, // ò Small o Grave
    '\u00FB': 150, // û Small u Circumflex
    '\u00F9': 151, // ù Small u Grave
    '\u00FF': 152, // ÿ Small y Diaeresis
    '\u00D6': 153, // Ö Capital O Diaeresis
    '\u00DC': 154, // Ü Capital U Diaeresis
    '\u00A2': 155, // ¢ Cent Sign
    '\u00A3': 156, // £ Pound Sign
    '\u00A5': 157, // ¥ Yen Sign
    '\u20A7': 158, // ₧ Peseta Sign
    '\u0192': 159, // ƒ Small f with Hook
    '\u00E1': 160, // á Small a Acute
    '\u00ED': 161, // í Small i Acute
    '\u00F3': 162, // ó Small o Acute
    '\u00FA': 163, // ú Small u Acute
    '\u00F1': 164, // ñ Small n Tilde
    '\u00D1': 165, // Ñ Capital N Tilde
    '\u00AA': 166, // ª Feminine Ordinal Indicator
    '\u00BA': 167, // º Masculine Ordinal Indicator
    '\u00BF': 168, // ¿ Inverted Question Mark
    '\u2310': 169, // ⌐ Reversed Not Sign
    '\u00AC': 170, // ¬ Not Sign
    '\u00BD': 171, // ½ Vulgar Fraction One Half
    '\u00BC': 172, // ¼ Vulgar Fraction One Quarter
    '\u00A1': 173, // ¡ Inverted Exclamation Mark
    '\u00AB': 174, // « Left Pointing Double Angle Quotation Mark
    '\u00BB': 175, // » Right Pointing Double Angle Quotation Mark
    '\u2591': 176, // ░ Light Shade
    '\u2592': 177, // ▒ Medium Shade
    '\u2593': 178, // ▓ Dark Shade
    '\u2502': 179, // │ Box Drawing Light Vertical
    '\u2524': 180, // ┤ Box Drawing Light Vertical Left
    '\u2561': 181, // ╡ Box Drawing Vertical Single Left Double
    '\u2562': 182, // ╢ Box Drawing Vertical Double Left Single
    '\u2556': 183, // ╖ Box Drawing Down Double Left Single
    '\u2555': 184, // ╕ Box Drawing Down Single Left Double
    '\u2563': 185, // ╣ Box Drawing Vertical Double Left Double
    '\u2551': 186, // ║ Box Drawing Vertical Double
    '\u2557': 187, // ╗ Box Drawing Down Double Left Double
    '\u255D': 188, // ╝ Box Drawing Up Double Left Double
    '\u255C': 189, // ╜ Box Drawing Up Double Left Single
    '\u255B': 190, // ╛ Box Drawing Up Single Left Double
    '\u2510': 191, // ┐ Box Drawing Down Single Left Single
    '\u2514': 192, // └ Box Drawing Up Single Right Single
    '\u2534': 193, // ┴ Box Drawing Horizontal Single Up Single
    '\u252C': 194, // ┬ Box Drawing Horizontal Single Down Single
    '\u251C': 195, // ├ Box Drawing Vertical Single Right Single
    '\u2500': 196, // ─ Box Drawing Light Horizontal
    '\u253C': 197, // ┼ Box Drawing Light Horizontal Vertical
    '\u255E': 198, // ╞ Box Drawing Vertical Single Right Double
    '\u255F': 199, // ╟ Box Drawing Vertical Double Right Single
    '\u255A': 200, // ╚ Box Drawing Up Double Right Double
    '\u2554': 201, // ╔ Box Drawing Down Double Right Double
    '\u2569': 202, // ╩ Box Drawing Double Horizontal Up Double
    '\u2566': 203, // ╦ Box Drawing Double Horizontal Down Double
    '\u2560': 204, // ╠ Box Drawing Double Vertical Double Right
    '\u2550': 205, // ═ Box Drawing Double Horizontal
    '\u256C': 206, // ╬ Box Drawing Double Horizontal Double Vertical
    '\u2567': 207, // ╧ Box Drawing Double Horizontal Single Up
    '\u2568': 208, // ╨ Box Drawing Single Horizontal Double Up
    '\u2564': 209, // ╤ Box Drawing Double Horizontal Single Down
    '\u2565': 210, // ╥ Box Drawing Single Horizontal Double Down
    '\u2559': 211, // ╙ Box Drawing Double Up Single Right
    '\u2558': 212, // ╘ Box Drawing Single Up Double Right
    '\u2552': 213, // ╒ Box Drawing Single Down Double Right
    '\u2553': 214, // ╓ Box Drawing Double Down Single Right
    '\u256B': 215, // ╫ Box Drawing Double Vertical Single Horizontal
    '\u256A': 216, // ╪ Box Drawing Single Vertical Double Horizontal
    '\u2518': 217, // ┘ Box Drawing Single Up Single Left
    '\u250C': 218, // ┌ Box Drawing Single Down Single Right
    '\u2588': 219, // █ Full Block
    '\u2584': 220, // ▄ Lower Half Block
    '\u258C': 221, // ▌ Left Half Block
    '\u2590': 222, // ▐ Right Half Block
    '\u2580': 223, // ▀ Upper Half Block
    '\u03B1': 224, // α Greek Small Alpha
    '\u00DF': 225, // ß Greek Capital Beta
    '\u0393': 226, // Γ Greek Capital Gamma
    '\u03C0': 227, // π Greek Small Pi
    '\u03A3': 228, // Σ Greek Capital Sigma
    '\u03C3': 229, // σ Greek Small Sigma
    '\u00B5': 230, // µ Micro Sign
    '\u03C4': 231, // τ Greek Small Tau
    '\u03A6': 232, // Φ Greek Capital Phi
    '\u0398': 233, // Θ Greek Capital Theta
    '\u03A9': 234, // Ω Greek Capital Omega
    '\u03B4': 235, // δ Greek Small Delta
    '\u221E': 236, // ∞ Infinity
    '\u03C6': 237, // Greek Small Phi
    '\u03B5': 238, // Greek Small Epsilon
    '\u2229': 239, // ∩ Intersection
    '\u2261': 240, // ≡ Identical To
    '\u00B1': 241, // ± Plus Minus Sign
    '\u2265': 242, // ≥ Greater Than Or Equal To
    '\u2264': 243, // ≤ Less Than Or Equal To
    '\u2320': 244, // ⌠ Top Half Integral
    '\u2321': 245, // ⌡ Bottom Half Integral
    '\u00F7': 246, // ÷ Division
    '\u2248': 247, // ≈ Almost Equal To
    '\u00B0': 248, // ° Degrees
    '\u2219': 249, // ∙ Bullet Operator
    '\u00B7': 250, // · Middle Dot
    '\u221A': 251, // √ Square Root
    '\u207F': 252, // ⁿ Superscript Latin Small n
    '\u00B2': 253, // ² Squared
    '\u25A0': 254, // ■ Black Square
};

/**
 * Converts a provided special character into its ANSI equivalent.
 * 
 * @param character A Unicode character
 * @return An ANSI character code.
 */
jzt.Graphics.prototype.convertSpecialCharacter = function(character) {

    // Get our char code
    var characterCode = character.charCodeAt(0);

    // If it's a letter, than it's the same
    if(characterCode >= 32 && characterCode <= 126) {
        return characterCode;
    }

    // Otherwise, it might be special
    else if(jzt.Graphics.characterTable.hasOwnProperty(character)) {
        return jzt.Graphics.characterTable[character];
    }
    
    // If we haven't mapped, return a question mark.
    return 63;

};

/**
 * SpriteGrid represents a block of renderable sprites defined with their colours.
 *
 * @param width A width for this sprite grid
 * @param height A height for this sprite grid
 * @param graphics a Graphics instance to own this SpriteGrid
 */
jzt.SpriteGrid = function(width, height, graphics) {
    this.width = width;
    this.height = height;
    this.graphics = graphics;
    this.tiles = [];
};

/**
 * Assigns a tile to this SpriteGrid at a provided position.
 *
 * @param point a Point to which to assign a sprite
 * @param spriteIndex a sprite index
 * @param foreground a foreground Color
 * @param background a background Color
 */
jzt.SpriteGrid.prototype.setTile = function(point, spriteIndex, foreground, background) {

    this.tiles[point.x + point.y * this.width] = {
        sprite: spriteIndex ? this.graphics.getSprite(spriteIndex) : undefined,
        foreground: foreground,
        background: background
    };

};

/**
 * Clears this SpriteGrid's tiles.
 */
jzt.SpriteGrid.prototype.clear = function() {
    this.tiles = [];
};

/**
 * Adds text as sprites to this SpriteGrid.
 *
 * @param point a Point to which to add text
 * @param text A text string to add to this SpriteGrid
 * @param foreground A foreground Color
 * @param background A background Color
 */
jzt.SpriteGrid.prototype.addText = function(point, text, foreground, background) {

    var textPoint = point.clone();
    var index;

    text = this.graphics.textToSprites(text);

    for(index = 0; index < text.length; ++index) {
        textPoint.x = point.x + index;
        this.tiles[textPoint.x + textPoint.y * this.width] = {
            sprite: text[index],
            foreground: foreground,
            background: background
        };
    }

};

/**
 * Retrieves a tile from this SpriteGrid at a specific position
 * 
 * @param a Point for which to retrieve sprite data
 * @return An Object containing a sprite, foreground, and background color.
 */
jzt.SpriteGrid.prototype.getTile = function(point) {
    return this.tiles[point.x + point.y * this.width];
};

/**
 * Draws this SpriteGrid to a specified position on a provided graphics context.
 *
 * @param context A 2D graphics context
 * @param point a Point at which to draw our SpriteGrid
 */
jzt.SpriteGrid.prototype.draw = function(context, point) {

    var tile;
    var spritePoint = new jzt.Point(0, 0);
    for(spritePoint.x = 0; spritePoint.x < this.width; ++spritePoint.x) {
        for(spritePoint.y = 0; spritePoint.y < this.height; ++spritePoint.y) {
            tile = this.getTile(spritePoint);
            if(tile) {

                // If we have a sprite defined...
                if(tile.sprite) {
                    tile.sprite.draw(context, spritePoint.add(point), tile.foreground, tile.background);
                }

                // If we only have a color defined...
                else {
                    this.graphics.fillTile(context, spritePoint.add(point), tile.background);
                }

            }
        }
    }

};

/**
 * Sprite represents a subsection of a larger graphic that can be drawn independetly
 * at a location.
 *
 * @param point A point defining the top-left sprite origin
 * @param owner A Graphics instance to which this Sprite belongs
 */
jzt.Sprite = function(point, owner) {
    this.point = point;
    this.owner = owner;
};

/**
 * Draws this Sprite instance on a provided context at a provided Point using a given
 * foreground and background color.
 *
 * @param context A 2D graphics context
 * @param point A Point
 * @param foreground A foreground color.
 * @param background A background color.
 */
jzt.Sprite.prototype.draw = function(context, point, foreground, background) {
    
    var blink;
    var destinationX;
    var destinationY;

    /*
     * Back in the DOS days, a bright background would actually signal
     * that the foreground color should blink. We're doing the same.
     */
    if(background && background.isLight()) {
        blink = true;
        background = background.darken();
    }
    
    destinationX = point.x * this.owner.TILE_SIZE.x;
    destinationY = point.y * this.owner.TILE_SIZE.y;

    // Draw the background
    if(background) {
        context.fillStyle = background.rgbValue;
        context.fillRect(destinationX, destinationY, this.owner.TILE_SIZE.x, this.owner.TILE_SIZE.y);
    }
    
    // If we aren't blinking, or if the blink state is off, draw our sprite
    if(!blink || ! this.owner.blinkState) {
        
        context.drawImage(this.owner.colorSpriteSources[foreground.index], this.point.x, this.point.y, this.owner.SPRITE_SIZE.x, this.owner.SPRITE_SIZE.y,
            destinationX, destinationY, this.owner.TILE_SIZE.x, this.owner.TILE_SIZE.y);
            
    }
 
};

/**
 * Color represents a named RBG color.
 * 
 * @param code A Hex character representing a DOS color code
 * @param name A name of this color
 * @param index An index for this color
 * @param r A red value
 * @param g A green value
 * @param b A blue value
 */
jzt.colors.Color = function(code, name, index, r, g, b) {

    /**
     * Converts a byte into a Hexidecimal character digit.
     * 
     * @param number A number from 0 to 255 to convert
     * @return A hexidecimal representation
     */
    function byteToHex(number) {
        var value = number.toString(16);
        if(value.length <= 1) {
            value = '0' + value;
        }
        return value;
    }

    this.code = code;
    this.name = name;

    if(index !== undefined) {
        this.index = index;
    }

    if(r !== undefined && g !== undefined && b !== undefined) {
        this.r = r;
        this.g = g;
        this.b = b;

        this.rgbValue = '#' + byteToHex(r) + byteToHex(g) + byteToHex(b);
    }

};

jzt.colors.Color.prototype.darken = function() {
    var result = jzt.colors.Colors[this.index - 8];
    return result || this;
};

jzt.colors.Color.prototype.lighten = function() {
    var result = jzt.colors.Colors[this.index + 8];
    return result || this;
};

jzt.colors.Color.prototype.isLight = function() {
    return this.index >= 8;
};

jzt.colors.Color.prototype.isDark = function() {
    return this.index < 8;
};

jzt.colors.CyclingColor = function(code, name, cycleSequence) {
    jzt.colors.Color.call(this, code, name);
    this.cycleSequence = cycleSequence;
    this.code = code;
    this.name = name;
    this.cycleIndex = 0;
    this.update();
};
jzt.colors.CyclingColor.prototype = new jzt.colors.Color();
jzt.colors.CyclingColor.prototype.constructor = jzt.colors.CyclingColor;

jzt.colors.CyclingColor.prototype.update = function() {
    this.cycleIndex = this.cycleIndex + 1 < this.cycleSequence.length ? this.cycleIndex + 1 : 0;
    var sequenceColor = this.cycleSequence[this.cycleIndex];
    this.index = sequenceColor.index;
    this.r = sequenceColor.r;
    this.g = sequenceColor.g;
    this.b = sequenceColor.b;
    this.rgbValue = sequenceColor.rgbValue;
};

/**
 * Colors is an enumerated type representing defined DOS colors.
 */
jzt.colors.Colors = [
    new jzt.colors.Color('0', 'Black',         0,  0,   0,   0  ),
    new jzt.colors.Color('1', 'Blue',          1,  0,   0,   170),
    new jzt.colors.Color('2', 'Green',         2,  0,   170, 0  ),
    new jzt.colors.Color('3', 'Cyan',          3,  0,   170, 170),
    new jzt.colors.Color('4', 'Red',           4,  170, 0,   0  ),
    new jzt.colors.Color('5', 'Magenta',       5,  170, 0,   170),
    new jzt.colors.Color('6', 'Brown',         6,  170, 85,  0  ),
    new jzt.colors.Color('7', 'White',         7,  170, 170, 170),
    new jzt.colors.Color('8', 'Grey',          8,  85,  85,  85 ),
    new jzt.colors.Color('9', 'BrightBlue',    9,  85,  85,  255),
    new jzt.colors.Color('A', 'BrightGreen',   10, 85,  255, 85 ),
    new jzt.colors.Color('B', 'BrightCyan',    11, 85,  255, 255),
    new jzt.colors.Color('C', 'BrightRed',     12, 255, 85,  85 ),
    new jzt.colors.Color('D', 'BrightMagenta', 13, 255, 85,  255),
    new jzt.colors.Color('E', 'Yellow',        14, 255, 255, 85 ),
    new jzt.colors.Color('F', 'BrightWhite',   15, 255, 255, 255)
];

jzt.colors.getColor = function(hexDigit) {
    return jzt.colors.Colors[parseInt(hexDigit, 16)];
};

jzt.colors.deserializeForeground = function(colorCode) {

    var foregroundCode;

    if(colorCode.length === 2) {
        foregroundCode = colorCode.charAt(1);
    }
    else if(colorCode.length === 1) {
        foregroundCode = colorCode.charAt(0);
    }
        
    if(foregroundCode) {
        return foregroundCode === '*' ? jzt.colors.Cycle : jzt.colors.getColor(foregroundCode);
    }

    throw 'Invalid color code: ' + colorCode;

};

jzt.colors.deserializeBackground = function(colorCode) {

    var backgroundCode;

    if(colorCode.length === 2) {
        backgroundCode = colorCode.charAt(0);
        return backgroundCode === '*' ? undefined : jzt.colors.getColor(backgroundCode);
    }

    return undefined;

};

jzt.colors.serialize = function(background, foreground) {
    return (background === undefined ? '*' : background.code) +
        (foreground === undefined ? 'E' : foreground instanceof jzt.colors.CyclingColor ? '*' : foreground.code);
};

// Assign convenience accessors
for(colorIndex = 0; colorIndex < jzt.colors.Colors.length; ++colorIndex) {

    // Regular version
    jzt.colors[jzt.colors.Colors[colorIndex].name] = jzt.colors.Colors[colorIndex];

    // All caps version
    jzt.colors[jzt.colors.Colors[colorIndex].name.toUpperCase()] = jzt.colors.Colors[colorIndex];
    
}

// Assign a cycling color
jzt.colors.Cycle = new jzt.colors.CyclingColor('*', 'Cycle', [jzt.colors.BrightBlue, jzt.colors.BrightGreen, jzt.colors.BrightCyan, jzt.colors.BrightRed, jzt.colors.BrightMagenta, jzt.colors.Yellow, jzt.colors.BrightWhite]);