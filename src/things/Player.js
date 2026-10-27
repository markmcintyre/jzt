import { Point, utilities, Direction, DelayedEventScheduler } from '../basic.js';
import { Colors } from '../graphics.js';
import { getMessage } from '../i18n.js';
import { ThingFactory } from './thing-registry.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';


const MOVE_ACTION = 0;
const SHOOT_ACTION = 1;
const TORCH_TTL = 60000;
const MAX_TORCH_STRENGTH = 4;

class Player extends UpdateableThing {
  constructor(board) {
    super(board);

    this.name = 'Player';
    this.spriteIndex = 2;
    this.point = new Point(-1, -1);
    this.foreground = Colors.BrightWhite;
    this.background = Colors.Blue;
    this.conveyable = true;

    if (board) {
      this.eventScheduler = new DelayedEventScheduler(board.game.CYCLE_TICKS * 2, 0);
    }

    this.game = undefined;
    this.speed = 1;
    this.glow = true;
  }

  /**
   * Serializes this Player instance. Note that players don't actually
   * get serialized. Instead, any tile under the player is returned.
   */
  serialize() {
    return this.under ? this.under.serialize() : 0;
  }

  /**
   * Receives a request to be pushed in a given direction.
   *
   * @param direction A direction in which this Thing is requested to move.
   */
  push(direction) {
    this.move(direction);
  }

  /**
   * Moves this Thing in a provided Direction and returns its success.
   *
   * @param direction A Direction in which to move this Thing.
   * @return true if the move was successful, false otherwise.
   */
  move(direction) {
    // Remember our current location
    var startingPoint = this.point.clone(),
      newLocation = this.point.add(direction),
      thing;

    // First, check if the direction is outside the board
    if (this.board.isOutside(newLocation)) {
      // Find out which direction we're moving to
      direction = this.point.directionTo(newLocation);
      this.board.movePlayerOffBoard(direction);

      // This isn't a typical board move
      return false;
    }

    // If we're not moving off board, inspect the thing we're moving to
    thing = this.board.getTile(newLocation);

    // If there's a tile there, send it a touch message
    if (thing) {
      thing.sendMessage('TOUCH');
    }

    // If the player wasn't already moved as a result of above actions, do our move
    if (this.point.equals(startingPoint)) {
      return this.board.moveTile(this.point, newLocation);
    }

    // Otherwise this wasn't a typical move anymore
    return false;
  }

  /**
   * Shoots a player bullet in a provided Direction.
   *
   * @param A Direction in which to shoot a player bullet.
   */
  shoot(direction) {
    // If we can't shoot on this board, return
    if (this.board.canPlayerShoot(true) <= 0) {
      this.play('02');
      return;
    }

    if (this.getCounterValue('AMMO') > 0) {
      this.adjustCounter('AMMO', -1);
      ThingFactory.shoot(this.board, this.point.add(direction), direction, true);
    } else {
      this.board.setDisplayMessage(getMessage('status.noammo'));
    }
  }

  /**
   * Performs an update tick of this Player instance, moving or shooting
   * in its direction, as necessary.
   */
  doTick() {
    var event = this.eventScheduler.takeEvent();

    if (event) {
      if (event.type === MOVE_ACTION) {
        this.move(event.direction);
      } else if (event.type === SHOOT_ACTION) {
        this.shoot(event.direction);
      }
    }
  }

  /**
   * Updates this Player for a single execution cycle. During its update,
   * Player will check for keypresses and move accordingly.
   */
  update() {
    var k = this.game.keyboard,
      key = k.getMostRecentPress([k.UP, k.RIGHT, k.DOWN, k.LEFT]);

    if (k.isPressed(k.SHIFT) || k.isPressed(k.SPACE)) {
      if (key === k.UP) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.UP), { type: SHOOT_ACTION, direction: Direction.North });
      } else if (key === k.RIGHT) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.RIGHT), { type: SHOOT_ACTION, direction: Direction.East });
      } else if (key === k.DOWN) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), { type: SHOOT_ACTION, direction: Direction.South });
      } else if (key === k.LEFT) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.LEFT), { type: SHOOT_ACTION, direction: Direction.West });
      } else {
        this.eventScheduler.cancelEvent();
      }
    } else {
      if (key === k.UP) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.UP), { type: MOVE_ACTION, direction: Direction.North });
      } else if (key === k.RIGHT) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.RIGHT), { type: MOVE_ACTION, direction: Direction.East });
      } else if (key === k.DOWN) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.DOWN), { type: MOVE_ACTION, direction: Direction.South });
      } else if (key === k.LEFT) {
        this.eventScheduler.scheduleEvent(k.isPressed(k.LEFT), { type: MOVE_ACTION, direction: Direction.West });
      } else {
        this.eventScheduler.cancelEvent();
      }

      // If T has been pressed, and we have 10 seconds or less on our current torch
      if (k.isPressed([k.T])) {
        this.useTorch();
      }
    }

    super.update();

    // To stay sufficiently responsive, the player torch has to be initialized explicitly here
    this.board.initializeTorch(this);
  }

  /**
   * Uses a torch, illuminating surrounding tiles if a given board is
   * dark.
   */
  useTorch() {
    // If the player has more than 10 seconds left on the current torch,
    // then they don't need another yet.
    if (this.game.getCounterValue('TORCHLIFE') > 10000) {
      return;
    }

    // If the player has torches available...
    if (this.game.getCounterValue('TORCHES') > 0) {
      // If the room isn't dark, let the player keep the torch
      if (!this.board.dark) {
        this.board.setDisplayMessage(getMessage('status.notdark'));
        return;
      }

      // Decrease our torch count
      this.game.adjustCounter('TORCHES', -1);

      // Specify that we're now using a torch
      this.game.setCounterValue('TORCHLIFE', TORCH_TTL);
    } else {
      // Display a message indicating we have no torches
      this.board.setDisplayMessage(getMessage('status.notorches'));
    }
  }

  /**
   * Retrieves a torch area for this Player, if the player's torch is currently active.
   */
  getTorch() {
    var torchLife = this.game.getCounterValue('TORCHLIFE'),
      torchStrength = MAX_TORCH_STRENGTH;

    // If we've got a torch...
    if (torchLife > 0) {
      // Start shrinking the radius when there's only 20 seconds left
      if (torchLife < 20000) {
        torchStrength = Math.ceil((torchLife * MAX_TORCH_STRENGTH) / (TORCH_TTL / 3));
      }

      return utilities.generateCircleData(this.point, torchStrength);
    }
  }

  /**
   * Delivers a provided message to this Thing.
   *
   * @param messageName a name of a message to deliver.
   */
  sendMessage(message) {
    if (message === 'SHOT' || message === 'BOMBED') {
      this.play('t--c+c-c+d#', true);
      this.adjustCounter('HEALTH', -10);
      this.board.playerHurt();
    }
  }
}

defineThing('Player', Player);
export { Player };
