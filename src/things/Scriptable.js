import { utilities, Direction } from '../basic.js';
import { JztScriptContext } from '../jzt-script-context.js';
import { defineThing } from './thing-registry.js';
import { UpdateableThing } from './UpdateableThing.js';

class Scriptable extends UpdateableThing {
  constructor(board) {
    super(board);
    this.name = 'UnknownScriptable';
    this.scriptContext = undefined;
    this.messageQueue = [];
    this.walkDirection = undefined;
    this.locked = false;
    this.orientation = undefined;
    this.spriteIndex = 1;
    this.torchRadius = undefined;
    this.pushable = false;
  }

  /**
   * Serializes this Thing to an object and returns it.
   *
   * @return A serialized version of this Thing.
   */
  serialize() {
    var result = super.serialize() || {};

    result.name = this.name;
    result.spriteIndex = this.spriteIndex;
    result.script = this.scriptName;

    utilities.storeOption(result, 'pushable', this.pushable, false);

    if (this.torchRadius > 0) {
      result.torchRadius = this.torchRadius;
    }

    if (this.scriptContext) {
      if (!this.scriptContext.inDefaultState()) {
        result.scriptContext = this.scriptContext.serialize();
      }
      if (this.messageQueue.length > 0) {
        result.messageQueue = this.messageQueue.slice(0);
      }
      utilities.storeOption(result, 'walkDirection', Direction.getName(this.walkDirection));
      utilities.storeOption(result, 'locked', this.locked, false);
      utilities.storeOption(result, 'orientation', Direction.getName(this.orientation));
    }

    return result;
  }

  /**
   * Deserializes a given data object and update's this Thing's state to
   * that data.
   *
   * @param data An object to be deserialized into this Thing.
   */
  deserialize(data) {
    super.deserialize(data);
    this.name = data.name || 'UnknownScriptable';
    this.spriteIndex = data.spriteIndex !== undefined ? data.spriteIndex : 1;
    this.setTorchRadius(data.torchRadius !== undefined ? data.torchRadius : 0);
    this.pushable = data.pushable !== undefined ? data.pushable : false;
    this.locked = data.locked;
    if (data.walkDirection) {
      this.walkDirection = Direction.fromName(data.walkDirection);
    }
    if (data.orientation) {
      this.orientation = Direction.fromName(data.orientation);
    }
    this.scriptName = data.script;
    var script = this.board.getScript(this.scriptName);
    if (script) {
      this.scriptContext = new JztScriptContext(script, this);
      if (data.scriptContext) {
        this.scriptContext.deserialize(data.scriptContext);
      }

      if (Array.isArray(data.messageQueue) && data.messageQueue.length > 0) {
        this.messageQueue = data.messageQueue.slice(0);
      }
    }
  }

  /**
   * Delivers a message to this Scriptable. This message will be passed
   * on to its Script during its next execution cycle if this ScriptableInstance
   * is not in a locked state.
   *
   * @param message A message to be delivered to this Scriptable.
   */
  sendMessage(message) {
    // If we are ready to receive a message...
    if (!this.locked) {
      // We disallow duplicate messages in a row
      if (this.messageQueue[this.messageQueue.length - 1] !== message) {
        this.messageQueue.push(message);
      }
    }
  }

  /**
   * Moves this Thing in a provided Direction and returns its success.
   *
   * @param direction A Direction in which to move this Thing.
   * @return true if the move was successful, false otherwise.
   */
  move(direction) {
    this.orientation = direction;
    return super.move(direction);
  }

  /**
   * Pushes this Scriptable in a provided Direction.
   */
  push(direction) {
    if (this.pushable) {
      this.move(direction);
    }
  }

  /**
   * Makes this Scriptable walk in its current walking direction.
   * Scriptables can walk while executing other instructions. If this
   * Scriptable walks into an obsticle and cannot continue walking,
   * it will receive a 'THUD' message and halt its walking direction.
   */
  walk() {
    if (this.walkDirection) {
      if (!this.move(this.walkDirection)) {
        this.sendMessage('THUD');
      }
    }
  }

  /**
   * Updates this Scriptable for a single execution cycle, including its
   * associated Script.
   */
  doTick() {
    this.walk();
    if (this.scriptContext) {
      this.scriptContext.executeTick();
    }
  }

  setTorchRadius(radius) {
    if (this.torchRadius !== radius && this.board && typeof this.board.invalidateLightSource === 'function') {
      this.board.invalidateLightSource(this);
    }
    this.torchRadius = radius;
  }

  getTorch() {
    if (this.torchRadius > 0) {
      return {radius:this.torchRadius};
    }
  }
}

defineThing('Scriptable', Scriptable);

export { Scriptable };
