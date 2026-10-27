import { Direction } from '../basic.js';
import { Colors } from '../graphics.js';

import { UpdateableThing } from './UpdateableThing.js';


class Duplicator extends UpdateableThing {
  constructor(board) {
    super(board);
    this.MAX_STEPS = 20;
    this.copyDirection = Direction.East;
    this.speed = 10;
    this.spriteIndex = 250;
    this.background = undefined;
    this.currentStep = 0;
    this.foreground = Colors.BrightWhite;
  }
  serialize() {
    var result = super.serialize();
    delete result.color;
    result.copyDirection = Direction.getShortName(this.copyDirection);
    return result;
  }

  deserialize(data) {
    super.deserialize(data);
    this.background = undefined;
    this.foreground = Colors.BrightWhite;

    if (data.copyDirection) {
      this.copyDirection = Direction.fromName(data.copyDirection);
    }
  }

  doTick() {
    var cloneThing,
      targetThing,
      isFreeSpace,
      clonePoint,
      targetPoint,
      cloned = false;

    this.currentStep += 1;
    if (this.currentStep >= this.MAX_STEPS) {
      this.currentStep = 0;

      // Grab our clone point and thing
      clonePoint = this.point.add(this.copyDirection);
      cloneThing = this.board.getTile(clonePoint);

      // Grab our target point
      targetPoint = this.point.add(Direction.opposite(this.copyDirection));

      // If our target point is on the board, see what's already there
      if (!this.board.isOutside(targetPoint)) {
        targetThing = this.board.getTile(targetPoint);
      } else {
        cloneThing = undefined;
      }

      // If we got a thing to clone...
      if (cloneThing) {
        // Determine if there is free space, or if we can make some by pushing an obstacle
        isFreeSpace = targetThing ? this.board.moveTile(this.point, targetPoint, false, true) : true;

        // If there is free space
        if (isFreeSpace) {
          cloned = true;

          // Create our new thing
          this.board.addThing(targetPoint, cloneThing.clone(), true);
        }
      }

      this.play(cloned ? 'scdefg' : '--g#f#');
    }

    this.spriteIndex =
      Duplicator.animationFrames[
        Math.round((this.currentStep / this.MAX_STEPS) * (Duplicator.animationFrames.length - 1))
      ];
  }
}
Duplicator.animationFrames = [250, 249, 7, 9, 111, 79];



export { Duplicator };
