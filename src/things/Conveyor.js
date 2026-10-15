import { Point } from '../basic.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


class Conveyor extends UpdateableThing {
  constructor(board) {
    super(board);
    this.clockwise = true;
    this.animationIndex = Math.floor(Math.random() * Conveyor.animationFrames.length - 1);
    this.spriteIndex = 179;
  }
  serialize() {
    var result = super.serialize();
    result.clockwise = this.clockwise;
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.clockwise = data.clockwise;
  }

  markPath(path) {
    var index,
      tile,
      obstacle,
      MoveAction = Conveyor.MoveAction;

    for (index = path.length - 1; index >= 0; index -= 1) {
      // Grab our tile of interest
      tile = this.board.getTile(path[index]);

      // If it exists and is conveyable...
      if (tile && tile.conveyable) {
        // If we're starting, our move is tentative on the final move
        if (index === path.length - 1) {
          path[index].action = MoveAction.TENTATIVE;
        } else {
          // If the path isn't off the board...
          if (!this.board.isOutside(path[index + 1])) {
            // Grab our obstacle
            obstacle = this.board.getTile(path[index + 1]);

            // If there is no obstacle, or it's surrenderable, then set our action to MOVE
            if (!obstacle || (!obstacle.conveyable && obstacle.surrenderable)) {
              path[index].action = MoveAction.MOVE;
            } else {
              // Take the same action as our previous path
              path[index].action = path[index + 1].action;
            }
          }
        }
      }
    }

    // If the last position is free, or if the last path action is MOVE or TENTATIVE...
    if (
      this.board.isFreeOrSurrenderable(path[0]) ||
      path[0].action === MoveAction.MOVE ||
      path[0].action === MoveAction.TENTATIVE
    ) {
      // Convert all TENTATIVE actions to MOVE actions
      for (index = 0; index < path.length; index += 1) {
        if (path[index].action === MoveAction.TENTATIVE) {
          path[index].action = MoveAction.MOVE;
        }
      }
    }
  }

  executePath(path) {
    var index, heldThing, thing;

    for (index = path.length - 1; index >= 0; index -= 1) {
      if (path[index].action === Conveyor.MoveAction.MOVE) {
        thing = this.board.getTile(path[index]);
        this.board.deleteTile(path[index]);

        if (index === path.length - 1) {
          heldThing = thing;
        } else {
          this.board.addThing(path[index + 1], thing);
        }
      }
    }

    if (heldThing) {
      this.board.addThing(path[0], heldThing);
    }
  }

  doTick() {
    var path;

    if (this.clockwise) {
      this.animationIndex += 1;
      if (this.animationIndex >= Conveyor.animationFrames.length) {
        this.animationIndex = 0;
      }

      path = [
        new Point(this.point.x - 1, this.point.y - 1),
        new Point(this.point.x, this.point.y - 1),
        new Point(this.point.x + 1, this.point.y - 1),
        new Point(this.point.x + 1, this.point.y),
        new Point(this.point.x + 1, this.point.y + 1),
        new Point(this.point.x, this.point.y + 1),
        new Point(this.point.x - 1, this.point.y + 1),
        new Point(this.point.x - 1, this.point.y),
      ];
    } else {
      this.animationIndex -= 1;
      if (this.animationIndex < 0) {
        this.animationIndex = Conveyor.animationFrames.length - 1;
      }

      path = [
        new Point(this.point.x - 1, this.point.y - 1),
        new Point(this.point.x - 1, this.point.y),
        new Point(this.point.x - 1, this.point.y + 1),
        new Point(this.point.x, this.point.y + 1),
        new Point(this.point.x + 1, this.point.y + 1),
        new Point(this.point.x + 1, this.point.y),
        new Point(this.point.x + 1, this.point.y - 1),
        new Point(this.point.x, this.point.y - 1),
      ];
    }

    this.markPath(path);
    this.executePath(path);

    this.spriteIndex = Conveyor.animationFrames[this.animationIndex];
  }
}

Conveyor.animationFrames = [179, 47, 45, 92];
Conveyor.MoveAction = { MOVE: 1, TENTATIVE: 2 };

defineThing('Conveyor', Conveyor);
export { Conveyor };
