
/**
 * Sprite represents a subsection of a larger graphic that can be drawn independetly
 * at a location.
 *
 * @param point A point defining the top-left sprite origin
 * @param owner A Graphics instance to which this Sprite belongs
 */
export class Sprite {
  constructor(point, owner) {
    this.point = point;
    this.owner = owner;
  }
  /**
   * Draws this Sprite instance on a provided context at a provided Point using a given
   * foreground and background color.
   *
   * @param context A 2D graphics context
   * @param point A Point
   * @param foreground A foreground color.
   * @param background A background color.
   */
  draw(context, point, foreground, background) {
    var blink, destinationX, destinationY;

    /*
     * Back in the DOS days, a bright background would actually signal
     * that the foreground color should blink. We're doing the same.
     */
    if (background && background.isLight()) {
      blink = true;
      background = background.darken();
    }

    destinationX = point.x * this.owner.TILE_SIZE.x;
    destinationY = point.y * this.owner.TILE_SIZE.y;

    // Draw the background
    if (background) {
      context.fillStyle = background.rgbValue;
      context.fillRect(destinationX, destinationY, this.owner.TILE_SIZE.x, this.owner.TILE_SIZE.y);
    }

    // If we aren't blinking, or if the blink state is off, draw our sprite
    if (!blink || !this.owner.blinkState) {
      context.drawImage(
        this.owner.colorSpriteSources[foreground.index],
        this.point.x,
        this.point.y,
        this.owner.SPRITE_SIZE.x,
        this.owner.SPRITE_SIZE.y,
        destinationX,
        destinationY,
        this.owner.TILE_SIZE.x,
        this.owner.TILE_SIZE.y,
      );
    }
  }
}

