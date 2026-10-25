import {Point} from './basic.js';
import {Colors} from './graphics.js';

class BoardRenderer {
  constructor(board, game) {
    this.board = board;
    this.game = game;
    this.customRenderSet = [];
    this.focusPoint = new Point(0, 0);
    this.windowSize = new Point(0, 0);
    this.windowOrigin = new Point(0, 0);
    this.windowLimit = new Point(0, 0);
  }

  initializeWindow() {
    const canvasWidth = this.game.context.canvas.width;
    const canvasHeight = this.game.context.canvas.height;
    const tileSize = this.game.resources.graphics.TILE_SIZE;

    this.windowSize.x = Math.floor(canvasWidth / tileSize.x);
    this.windowSize.y = Math.floor(canvasHeight / tileSize.y);
    this.windowLimit = new Point(this.board.width - this.windowSize.x, this.board.height - this.windowSize.y);

    this.updateWindowPosition();

    if (this.windowSize.x > this.board.width) {
      this.windowOrigin.x = -Math.round((this.windowSize.x - this.board.width) / 2);
    }

    if (this.windowSize.y > this.board.height) {
      this.windowOrigin.y = -Math.round((this.windowSize.y - this.board.height) / 2);
    }
  }

  updateWindowPosition() {
    if (this.focusPoint) {
      if (this.board.width > this.windowSize.x) {
        this.windowOrigin.x = this.focusPoint.x - Math.round(this.windowSize.x / 2);
        this.windowOrigin.x = this.windowOrigin.x < 0 ? 0 : this.windowOrigin.x > this.windowLimit.x ? this.windowLimit.x : this.windowOrigin.x;
      }

      if (this.board.height > this.windowSize.y) {
        this.windowOrigin.y = this.focusPoint.y - Math.round(this.windowSize.y / 2);
        this.windowOrigin.y = this.windowOrigin.y < 0 ? 0 : this.windowOrigin.y > this.windowLimit.y ? this.windowLimit.y : this.windowOrigin.y;
      }
    }
  }

  isOutsideWindow(point) {
    if (point.x < this.windowOrigin.x || point.x >= this.windowOrigin.x + this.windowSize.x) {
      return true;
    }
    if (point.y < this.windowOrigin.y || point.y >= this.windowOrigin.y + this.windowSize.y) {
      return true;
    }

    return false;
  }

  eachDisplayable(callback) {
    var point = new Point(0, 0),
      startY = this.windowOrigin.y,
      endY = startY + this.windowSize.y,
      startX = this.windowOrigin.x,
      endX = startX + this.windowSize.x;

    startX = startX < 0 ? 0 : startX;
    startY = startY < 0 ? 0 : startY;
    endX = endX > this.board.width ? this.board.width : endX;
    endY = endY > this.board.height ? this.board.height : endY;

    for (point.y = startY; point.y < endY; point.y += 1) {
      for (point.x = startX; point.x < endX; point.x += 1) {
        callback(this.board.tiles[point.x + point.y * this.board.width], point);
      }
    }
  }

  clearCustomRenderSet() {
    this.customRenderSet.length = 0;
  }

  addCustomRenderable(thing) {
    this.customRenderSet.push(thing);
  }

  render(c) {
    const board = this.board;
    const graphics = this.game.resources.graphics;
    const tileSize = graphics.TILE_SIZE;
    var canvasWidth = this.game.context.canvas.width,
      canvasHeight = this.game.context.canvas.height,
      index,
      startX,
      startY,
      endX,
      endY;

    this.updateWindowPosition();

    if (this.windowOrigin.x < 0 || this.windowOrigin.y < 0) {
      c.fillStyle = Colors.Grey.rgbValue;
      c.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    c.fillStyle = !this.game.isEditor && board.dark ? this.game.DARK_PATTERN : Colors.Black.rgbValue;
    startX = Math.max(-this.windowOrigin.x * tileSize.x, 0);
    startY = Math.max(-this.windowOrigin.y * tileSize.y, 0);
    endX = Math.min(board.width * tileSize.x, this.windowSize.x * tileSize.x);
    endY = Math.min(board.height * tileSize.y, this.windowSize.y * tileSize.y);
    c.fillRect(startX, startY, endX, endY);

    this.eachDisplayable((thing, point) => {
      var sprite,
        background;

      if (!this.game.isEditor && board.dark && !board.isLit(point, thing)) {
        return;
      }

      if (thing && !thing.hidden) {
        sprite = graphics.getSprite(thing.getSpriteIndex());
        background = thing.background;

        if (!background && thing.under && thing.under.background) {
          background = thing.under.background.isLight() ? thing.under.background.darken() : thing.under.background;
        } else if (!background && board.dark) {
          background = Colors.Black;
        }

        sprite.drawAt(
          c,
          point.x - this.windowOrigin.x,
          point.y - this.windowOrigin.y,
          thing.foreground,
          background,
        );
      } else if (!thing && board.dark) {
        graphics.fillTileAt(
          c,
          point.x - this.windowOrigin.x,
          point.y - this.windowOrigin.y,
          Colors.Black,
        );
      }
    });

    if (board.customRenderCount > 0) {
      board.eachDirect(function (thing) {
        if (thing && thing.render) {
          thing.render(c);
        }
      });
    } else {
      for (index = 0; index < this.customRenderSet.length; index += 1) {
        this.customRenderSet[index].render(c);
      }
    }

    if (board.displayMessage !== undefined) {
      this.renderMessage(c);
    }
  }

  renderMessage(c) {
    const board = this.board;
    const messagePoint = new Point();

    messagePoint.x = Math.floor((this.windowSize.x - board.displayMessage.length) / 2);
    messagePoint.y = this.windowSize.y - 1;

    this.game.resources.graphics.drawString(c, messagePoint, board.displayMessage, Colors.Cycle, Colors.Black);

    board.displayMessageTick -= 1;

    if (board.displayMessageTick <= 0) {
      board.displayMessage = undefined;
    }
  }
}

export {BoardRenderer};
