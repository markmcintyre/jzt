import { Point } from '../basic.js';
import { Colors, colors } from '../graphics-colors.js';
import { Sprite } from './Sprite.js';
import { SPRITE_DATA } from './sprite-data.js';

let BLINK_RATE = 10;

/**
 * Graphics provides functions for drawing standard DOS CodePage 437 characters in the usual 16 colour
 * pallette to a graphics context. An optional callback can be provided that will signal when all graphics
 * have been loaded and initialized.
 *
 * @param onLoadCallback An optional callback function to be triggered when this Graphics is loaded and ready to use.
 */
export class Graphics {
  constructor(onLoadCallback) {
    var me = this;

    this.TILE_SIZE = new Point(16, 32);
    this.SPRITE_SIZE = new Point(8, 16);

    this.DARK_IMAGE = undefined;
    this.NOISE_IMAGE = undefined;

    this.blinkCycle = 0;
    this.blinkState = true;

    this.sprites = [];
    this.spriteSource = new Image();
    this.spriteSource.src = SPRITE_DATA;
    this.colorSpriteSources = [];
    this.onLoadCallback = onLoadCallback;

    // A function to finish initialization once our sprite source has been fully loaded
    this.spriteSource.onload = function () {
      var buffer,
        context,
        pixelCount,
        color,
        imageData,
        rgba,
        pixel,
        tilesPerRow,
        tilesPerColumn,
        row,
        column,
        spritePoint,
        sprite;

      // Create offscreen canvases
      for (color in colors) {
        if (colors.hasOwnProperty(color)) {
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
          color = colors[color];

          // Draw the black and white image first
          context.drawImage(this, 0, 0);

          // Grab the raw image data
          imageData = context.getImageData(0, 0, this.width, this.height);
          rgba = imageData.data;

          // For each of our pixels...
          for (pixel = 0; pixel < pixelCount; pixel += 4) {
            /* For a black and white image, we only need to test one of the
             * values to determine if we need to write a color or a transparent
             * value.
             */

            // If we found an 'on' pixel
            if (rgba[pixel] >= 255) {
              // Assign our new pixel color
              rgba[pixel] = color.r;
              rgba[pixel + 1] = color.g;
              rgba[pixel + 2] = color.b;

              // Make it completely opaque
              rgba[pixel + 3] = 255;
            } else {
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

      for (row = 0; row < tilesPerColumn; row += 1) {
        for (column = 0; column < tilesPerRow; column += 1) {
          spritePoint = new Point(column * me.SPRITE_SIZE.x, row * me.SPRITE_SIZE.y);
          sprite = new Sprite(spritePoint, me);
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
      for (pixel = 0; pixel < pixelCount; pixel += 4) {
        rgba[pixel] = 0;
        rgba[pixel + 1] = 0;
        rgba[pixel + 2] = 0;
        rgba[pixel + 3] = Math.round(20 * Math.random());
      }
      context.putImageData(imageData, 0, 0);
      me.NOISE_IMAGE = buffer;

      // Create our darkness image
      buffer = document.createElement('canvas');
      buffer.width = me.TILE_SIZE.x;
      buffer.height = me.TILE_SIZE.y;
      context = buffer.getContext('2d');
      context.imageSmoothingEnabled = false;
      sprite = me.getSprite(176);
      sprite.draw(context, new Point(0, 0), Colors.Grey, Colors.Black);
      me.DARK_IMAGE = buffer;

      // Now that everything is initialized, trigger our load callback
      me.onLoadCallback();
    };
  }
  update() {
    // Increment our blink cycle counter
    this.blinkCycle += 1;

    // If we've passed the blink rate threshold...
    if (this.blinkCycle > BLINK_RATE) {
      // Adjust our blink state
      this.blinkState = !this.blinkState;

      // Our color cycle uses the same rate
      Colors.Cycle.update();

      // Reset the blink cycle
      this.blinkCycle = 0;
    }
  }
  fillTile(c, point, color) {
    this.fillTileAt(c, point.x, point.y, color);
  }

  fillTileAt(c, x, y, color) {
    var destinationX = x * this.TILE_SIZE.x,
      destinationY = y * this.TILE_SIZE.y;

    // Draw the tile
    if (color) {
      c.fillStyle = color.rgbValue;
      c.fillRect(destinationX, destinationY, this.TILE_SIZE.x, this.TILE_SIZE.y);
    }
  }
  getSprite(index) {
    return this.sprites[index];
  }
  textToSprites(text) {
    var result = [],
      index,
      spriteIndex;

    // For each character in our string...
    for (index = 0; index < text.length; index += 1) {
      // Convert the character into its CodePage-437 index
      spriteIndex = this.convertSpecialCharacter(text.charAt(index));

      // Push the resulting Sprite onto our result
      result.push(this.getSprite(spriteIndex));
    }

    return result;
  }
  drawString(context, point, text, foreground, background) {
    this.drawSprites(context, point, this.textToSprites(text), foreground, background);
  }
  drawSprites(context, point, sprites, foreground, background) {
    var sprite, index;

    point = point.clone();
    foreground = foreground || Colors.Yellow;
    background = background || undefined;
    for (index = 0; index < sprites.length; index += 1) {
      sprite = sprites[index];
      sprite.draw(context, point, foreground, background);
      point.x += 1;
    }
  }
  /**
   * Converts a provided special character into its ANSI equivalent.
   *
   * @param character A Unicode character
   * @return An ANSI character code.
   */
  convertSpecialCharacter(character) {
    // Get our char code
    var characterCode = character.charCodeAt(0);

    // Determine if character mapping isn't necessary
    if (characterCode >= 32 && characterCode <= 126) {
      return characterCode;
    }

    // Mapping is necessary, but do we have a mapping for this character?
    if (Graphics.characterTable.hasOwnProperty(character)) {
      return Graphics.characterTable[character];
    }

    // If we haven't mapped, return a question mark.
    return 63;
  }
}

/**
 * Updates this Graphics's instance's blinking and color cycle state.
 */

/**
 * Gets a Sprite instance for a provided CodePage-437 character index.
 *
 * @param index A CodePage-437 character index
 * @return A sprite representing a provided CodePage-437 index.
 */

/**
 * Converts a provided text string into an array of Sprite instances representing
 * CodePage-437 characters. Any text character that does not have an equivalent
 * CodePage-437 representation will be represented by a '?' character.
 *
 * @param text A text string to convert to Sprite instances
 * @return An array of Sprite instances
 */

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

Graphics.characterTable = {
  '\u236A': 1, // ☺ Happy Face
  '\u263B': 2, // ☻ Black happy face
  '\u2665': 3, // ♥ Heart Suit
  '\u2666': 4, // ♦ Diamond Suit
  '\u2663': 5, // ♣ Club Suit
  '\u2660': 6, // ♠ Spade Suit
  '\u2022': 7, // • Bullet
  '\u25D8': 8, // ◘ Inverse Bullet
  '\u25CB': 9, // ○ White Circle
  '\u25D9': 10, // ◙ Inverse White Circle
  '\u2642': 11, // ♂ Male Sign
  '\u2640': 12, // ♀ Female Sign
  '\u266A': 13, // ♪ Eighth Note
  '\u266B': 14, // ♫ Beamed Eighth Notes
  '\u263C': 15, // ☼ White Sun With Rays
  '\u25BA': 16, // ► Black Right-Pointing Pointer
  '\u25C4': 17, // ◄ Black Left-Pointing Pointer
  '\u2195': 18, // ↕ Up Down Arrow
  '\u203C': 19, // ‼ Double Exclamation Mark
  '\u00B6': 20, // ¶ Pilcrow Sign
  '\u00A7': 21, // § Section Sign
  '\u25AC': 22, // ▬ Black Rectangle
  '\u218A': 23, // ↨ Up Down Arrow With Base
  '\u2191': 24, // ↑ Upwards Arrow
  '\u2193': 25, // ↓ Downwards Arrow
  '\u2192': 26, // → Rightwards Arrow
  '\u2190': 27, // ← Leftwards Arrow
  '\u221F': 28, // ∟ Right Angle
  '\u2194': 29, // ↔ Left Right Arrow
  '\u25B2': 30, // ▲ Black Up-Pointing Triangle
  '\u25BC': 31, // ▼ Black Down-Pointing Triangle
  '\u2303': 127, // ⌂ House
  '\u00C7': 128, // Ç Capital C Cedilla
  '\u00FC': 129, // ü Small u Diaeresis
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
 * SpriteGrid represents a block of renderable sprites defined with their colours.
 *
 * @param width A width for this sprite grid
 * @param height A height for this sprite grid
 * @param graphics a Graphics instance to own this SpriteGrid
 */



