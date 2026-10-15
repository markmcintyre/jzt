import { Point } from './basic.js';
import { Colors, ColorUtilities } from './graphics-colors.js';
export class SpriteGrid {
  constructor(width, height, graphics) { this.width = width; this.height = height; this.graphics = graphics; this.tiles = []; }
  setTile(point, spriteIndex, foreground, background) { this.tiles[point.x + point.y * this.width] = { sprite: spriteIndex ? this.graphics.getSprite(spriteIndex) : undefined, foreground: foreground || Colors.White, background }; }
  setColor(point, foreground, background) { const tile = this.tiles[point.x + point.y * this.width]; if (tile) { tile.foreground = foreground || tile.foreground; tile.background = background || tile.background; } }
  clear() { this.tiles = []; }
  addText(point, text, foreground, background) {
    const textPoint = point.clone(); text = this.graphics.textToSprites(text);
    for (let index = 0; index < text.length; index += 1) { textPoint.x = point.x + index; this.tiles[textPoint.x + textPoint.y * this.width] = { sprite: text[index], foreground, background }; }
  }
  addArt(startingPoint, artString) {
    let point = startingPoint.clone(), color;
    for (let index = 0; index < artString.length; index += 1) {
      let symbol = artString.charAt(index);
      if (symbol === '\n') { point.x = startingPoint.x; point.y += 1; } else {
        symbol = this.graphics.convertSpecialCharacter(symbol);
        if (index + 1 <= artString.length) { index += 1; color = ColorUtilities.getColor(artString.charAt(index)); }
        this.setTile(point, symbol, color); point.x += 1;
      }
    }
  }
  getTile(point) { return this.tiles[point.x + point.y * this.width]; }
  draw(context, point) {
    const spritePoint = new Point(0, 0);
    for (spritePoint.x = 0; spritePoint.x < this.width; spritePoint.x += 1) for (spritePoint.y = 0; spritePoint.y < this.height; spritePoint.y += 1) {
      const tile = this.getTile(spritePoint); if (tile) { if (tile.sprite) tile.sprite.draw(context, spritePoint.add(point), tile.foreground, tile.background); else this.graphics.fillTile(context, spritePoint.add(point), tile.background); }
    }
  }
}
