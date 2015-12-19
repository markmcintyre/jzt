/**
 * JZTScript Commands
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

/*jslint node:true */

'use strict';

var ThingFactory = require('things').ThingFactory,
    Direction = require('basic').Direction,
    ConstructorError = require('basic').ConstructorError,
    GameState = require('jzt').GameState,
    getBoardMessage = require('i18n').getBoardMessage;

/**
 * {@code CommandResult} is an object containing definitions of
 * command results. The values are NORMAL, CONTINUE, and REPEAT.
 * NORMAL: Returned when a Command executes normally.
 * CONTINUE: Requests that the next command be executed immediately.
 * REPEAT: Requests that the same command be executed again next cycle.
 */
var CommandResult = Object.freeze({
    NORMAL: 0,
    CONTINUE: 1,
    CONTINUE_AFTER_JUMP: 2,
    REPEAT: 3
});

/**
 * Direction Modifier Enumerated Types
 *
 * Each direction modifier has an associated token value, a display name, and a process function.
 * The process function takes a direction and returns a final, calculated direction value.
 */
var DirectionModifier = Object.freeze({
    CW:   {name: 'Clockwise',              type: 'modifier', process: function (d) { return Direction.clockwise(d); }},
    CCW:  {name: 'Counter-clockwise',      type: 'modifier', process: function (d) { return Direction.counterClockwise(d); }},
    OPP:  {name: 'Opposite',               type: 'modifier', process: function (d) { return Direction.opposite(d); }},
    RNDP: {name: 'Perpendicularly Random', type: 'modifier', process: function (d) { return Direction.randomPerpendicular(d); }}
});


/**
 * Direction Enumerated Types
 *
 * Each direction has an associated token value, a display name, and a process function.
 * The process function takes a JztObject and returns a final, calculated direction value.
 */
var Direction = Object.freeze({
    SEEK:  {name: 'Toward player',            type: 'terminal', process: function (o) { return o.getPlayerDirection(); }},
    SMART: {name: 'Smart seek',               type: 'terminal', process: function (o) { return o.getSmartDirection() || o.getPlayerDirection(); }},
    FLOW:  {name: 'Current orientation',      type: 'terminal', process: function (o) { return o.orientation; }},
    RAND:  {name: 'Random direction',         type: 'terminal', process: function () { return Direction.random(); }},
    RANDF: {name: 'Random free direction',    type: 'terminal', process: function (o) { return Direction.random(o.getFreeDirections()); }},
    RANDB: {name: 'Random blocked direction', type: 'terminal', process: function (o) { return Direction.random(o.getBlockedDirections()); }},
    RNDEW: {name: 'Randomly East or West',    type: 'terminal', process: function () { return Direction.randomEastWest(); }},
    RNDNS: {name: 'Randomly North or South',  type: 'terminal', process: function () { return Direction.randomNorthSouth(); }},
    RNDNE: {name: 'Randomly North or East',   type: 'terminal', process: function () { return Direction.randomNorthEast(); }},
    NORTH: {name: 'North',                    type: 'terminal', process: function () { return Direction.North; }},
    EAST:  {name: 'East',                     type: 'terminal', process: function () { return Direction.East; }},
    SOUTH: {name: 'South',                    type: 'terminal', process: function () { return Direction.South; }},
    WEST:  {name: 'West',                     type: 'terminal', process: function () { return Direction.West; }},
    N:     {name: 'North shorthand',          type: 'terminal', process: function () { return Direction.North; }},
    E:     {name: 'East shorthand',           type: 'terminal', process: function () { return Direction.East; }},
    S:     {name: 'South shorthand',          type: 'terminal', process: function () { return Direction.South; }},
    W:     {name: 'West shorthand',           type: 'terminal', process: function () { return Direction.West; }}
});

/**
 * Label
 *
 * A label is a named line identifier used to jump to instruction locations within
 * a script. A label isn't strictly a command and can't be executed; instead, it's
 * used as a marker in a parsed script result.
 */
function Label(name) {

    if (!(this instanceof Label)) {
        throw ConstructorError;
    }

    this.name = name;
}

/**
 * DirectionExpression
 *
 * A DirectionExpression consists of a direction terminal and a series of optional
 * modifiers that transform the direction into a final result.
 */
function DirectionExpression(terminal) {

    if (!(this instanceof DirectionExpression)) {
        throw ConstructorError;
    }

    this.modifiers = [];
    this.terminal = terminal;
    this.count = 1;
}

/**
 * Executes this DirectionExpression and returns a concrete Direction instance.
 */
DirectionExpression.prototype.getResult = function (owner) {

    // Get our direction from our expression
    var direction = this.terminal.process(owner),
        modifiers = this.modifiers.slice(0);

    while (modifiers.length) {
        direction = modifiers.pop().process(direction);
    }

    // Return our result
    return direction;
};

/**
 * BecomeCommand
 *
 * When executed, a provided owner Thing will be replaced with another Thing specified
 * by this command's template.
 */
function BecomeCommand(thingTemplate) {

    if (!(this instanceof BecomeCommand)) {
        throw ConstructorError;
    }

    this.thingTemplate = thingTemplate;

}

/**
 * Replace a provided owner with another Thing based on this command's
 * associated thing template.
 */
BecomeCommand.prototype.execute = function (owner) {

    // Create our new thing
    var newThing = ThingFactory.deserialize(this.thingTemplate, owner.board);

    // Replace our owner's tile with the new thing
    owner.board.replaceTile(owner.point, newThing);

};

/**
 * ChangeCommand
 *
 * When executed, a board will have all instances of things
 * specified by this commands template by another type of Thing.
 */
function ChangeCommand(fromTemplate, toTemplate) {
    if (!(this instanceof ChangeCommand)) {
        throw ConstructorError;
    }

    this.fromTemplate = fromTemplate;
    this.toTemplate = toTemplate;
}

/**
 * Replaces all things on a provided owner's board matching this command's fromTemplate.
 */
ChangeCommand.prototype.execute = function (owner) {
    owner.board.changeTiles(this.fromTemplate, this.toTemplate);
    return CommandResult.CONTINUE;
};

/**
 * CharCommand
 *
 * A command that changes an owner's character code to a specified value.
 */
function CharCommand(value) {
    if (!(this instanceof CharCommand)) {
        throw ConstructorError;
    }
    this.value = value;
}

/**
 * Changes a provided owner's character value.
 */
CharCommand.prototype.execute = function (owner) {
    owner.spriteIndex = this.value;
};

/**
 * DieCommand
 *
 * A Command that removes an owner from its board.
 */
function DieCommand(magnetically) {
    if (!(this instanceof DieCommand)) {
        throw ConstructorError;
    }
    this.magnetically = magnetically;
}

/**
 * Removes a provided owner from its associated board.
 */
DieCommand.prototype.execute = function (owner) {
    owner.remove();
    if (this.magnetically) {
        owner.board.player.push(Direction.opposite(owner.getPlayerDirection()));
    }
};

/**
 * EndCommand
 *
 * A command that halts script execution on its owner's script context.
 */
function EndCommand() {
    if (!(this instanceof EndCommand)) {
        throw ConstructorError;
    }
}

/**
 * Halt script execution on a provided owner's script context.
 */
EndCommand.prototype.execute = function (owner) {
    owner.scriptContext.stop();
};

/**
 * GiveCommand
 *
 * Increases a game counter by a specified amount.
 */
function GiveCommand(counter, amount) {
    if (!(this instanceof GiveCommand)) {
        throw ConstructorError;
    }
    this.counter = counter.toUpperCase();
    this.amount = amount;
}

/**
 * Increases a counter on this owner's game by an amount specified
 * by this command.
 */
GiveCommand.prototype.execute = function (owner) {
    owner.board.game.adjustCounter(this.counter, this.amount);
    return CommandResult.CONTINUE;
};

/**
 * IfCommand
 *
 * Jumps to a new execution location if an expression evaluates to true.
 */
function IfCommand(label, expression) {
    if (!(this instanceof IfCommand)) {
        throw ConstructorError;
    }
    this.label = label;
    this.expression = expression;
}

/**
 * Jumps to an owner's label if this command's expression evaluates to true.
 */
IfCommand.prototype.execute = function (owner) {
    if (this.expression.getResult(owner)) {
        owner.scriptContext.jumpToLabel(this.label);
        return CommandResult.CONTINUE_AFTER_JUMP;
    }
    return CommandResult.CONTINUE;
};

/**
 * LockCommand
 *
 * When executed, an owner will no longer be able to receive messages
 * from other scripts.
 */
function LockCommand() {
    if (!(this instanceof LockCommand)) {
        throw ConstructorError;
    }
}

/**
 * Locks the provided owner so that it can no longer receive messages from other scripts.
 */
LockCommand.prototype.execute = function (owner) {
    owner.locked = true;
    return CommandResult.CONTINUE;
};

/**
 * MoveCommand
 *
 * When executed, an owner will be moved according to this command's
 * direction expression and options.
 */
function MoveCommand(directionExpression, forceful) {
    this.directionExpression = directionExpression;
    this.forceful = forceful;
}

/**
 * Executes this MoveCommand, moving a provided owner on the board
 * according to the result of this command's direction expression and
 * options.
 */
MoveCommand.prototype.execute = function (owner) {

    return this.forceful ? this.forcefulMove(owner) : this.move(owner);

};

/**
 * Moves a provided owner gently in a direction according to
 * this command's direction expression result.
 */
MoveCommand.prototype.move = function (owner) {

    var heap = owner.scriptContext.heap,
        direction = this.directionExpression.getResult(owner),
        count = '<count>';

    if (!heap[count]) {
        heap[count] = this.directionExpression.count;
    }

    // If a direction is available
    if (direction) {

        // If we are to go a number of times...
        if (heap[count] > 0) {

            heap[count] -= 1;

            if (owner.move(direction)) {
                return CommandResult.REPEAT;
            }

        } else {
            delete heap[count];
        }

    }

};

/**
 * Moves a provided owner forcefully in a direction according to
 * this command's direction expression result.
 */
MoveCommand.prototype.forcefulMove = function (owner) {

    var direction,
        heap = owner.scriptContext.heap,
        count = '<count>',
        stuck = '<stuck>',
        success;

    if (!heap[count]) {
        heap[count] = this.directionExpression.count;
    }


    // Depending on if we are stuck or not...
    if (!heap[stuck]) {
        // We're not stuck, so calculate our next direction
        direction = this.directionExpression.getResult(owner);
    } else {
        // We are stuck, continue trying that direction
        direction = Direction.fromName(heap[stuck]);
    }

    // If a direction is available
    if (direction) {

        success = owner.move(direction);

        // If we were not successful, we're stuck
        if (!success) {

            heap[stuck] = Direction.getShortName(direction);

            // We will try again until we're free
            return CommandResult.REPEAT;

        }

        // We aren't stuck, so count our moves down
        heap[count] -= 1;
        if (heap[count] > 0) {
            delete heap[stuck];
            return CommandResult.REPEAT;
        }

        // We're not moving anymore...
        delete heap[count];
        delete heap[stuck];

    }

};

/**
 * PlayCommand
 *
 * When executed, has the owner play a specified audio sequence.
 */
function PlayCommand(sequence) {
    this.sequence = sequence;
}

/**
 * Play this command's audio sequence with the owner.
 */
PlayCommand.prototype.execute = function (owner) {
    owner.play(this.sequence, true);
    return CommandResult.CONTINUE;
};

/**
 * PutCommand
 *
 * Put is a command that, when executed, adds a new instance of a provided
 * template at a space in a provided direction relative to an owner.
 */
function PutCommand(thingTemplate, directionExpression) {
    this.thingTemplate = thingTemplate;
    this.directionExpression = directionExpression;
}

/**
 * Inserts a new instance of this command's thing template at a location
 * directly adjacent to a provided owner, if the space isn't already occupied.
 */
PutCommand.prototype.execute = function (owner) {

    var newThing,
        direction = this.directionExpression.getResult(owner),
        point = owner.point.add(direction),
        obstacle,
        isFreeSpace;

    // If our point is off the board, return immediately
    if (owner.board.isOutside(point)) {
        return;
    }


    // Get the tile in the way, if applicable
    obstacle = owner.board.getTile(point);

    // Determine if there is free space, or if we can make some by pushing an obstacle
    isFreeSpace = obstacle ? owner.board.moveTile(owner.point, point, false, true) : true;

    // Create our new thing
    newThing = ThingFactory.deserialize(this.thingTemplate, owner.board);


    // Depending on if there's space and a thing available...
    if (isFreeSpace && newThing) {

        // There's space, so add our thing
        owner.board.addThing(point, newThing);

    } else if (!isFreeSpace && !newThing) {

        // There's no free space, and we're putting emptiness,
        // so delete the existing tile.
        owner.board.deleteTile(point);

    }

};

/**
 * Restore Command
 *
 * When executed, an associated label is restored in a provided
 * owner's script context.
 */
function RestoreCommand(label) {
    this.label = label;
}

/**
 * Restores this command's associated label in a provided owner's
 * script context.
 */
RestoreCommand.prototype.execute = function (owner) {
    owner.scriptContext.restoreLabel(this.label);
    return CommandResult.CONTINUE;
};

/**
 * Say Command
 * When executed, a textual alert is requested to be displayed by
 * a provided owner.
 */
function SayCommand(text) {
    this.text = text;
}

/**
 * Display this command's textual alert via a provided owner.
 */
SayCommand.prototype.execute = function (owner) {
    var message = getBoardMessage(owner.board, this.text);
    owner.board.setDisplayMessage(message);
    return CommandResult.CONTINUE;
};

/**
 * ScrollCommand
 *
 * When executed, adds a line of text to a provided owner's
 * script context's scroll queue, with optional bold formatting
 * and an optional jump label for creating command options.
 */
function ScrollCommand(text, bold, label) {
    this.text = text;
    this.bold = bold;
    this.label = label;
    this.modifiesScroll = true;
}

/**
 * Adds a line of text based on this command's configuration to
 * a provided owner's script context's scroll queue.
 */
ScrollCommand.prototype.execute = function (owner) {
    var message = getBoardMessage(owner.board, this.text);
    owner.scriptContext.addScrollContent(message, this.bold, this.label);
    return CommandResult.CONTINUE;
};

/**
 * SendCommand
 *
 * When executed, sends a message to a provided recipient via a
 * specified owner. If a recipient is SELF, then the message is
 * delivered to the owner directly. If a recipient is ALL, then
 * the message is delivered to all scriptable things on the board.
 */
function SendCommand(recipient, message) {
    this.recipient = recipient;
    this.message = message;
}

/**
 * Sends a message to a provided recipient via a specified owner.
 * If a recipient is SELF, then the message is delivered to the owner
 * directly. If a recipient is ALL, then the message is delivered
 * to all scriptable things on the board.
 */
SendCommand.prototype.execute = function (owner) {

    var recipients,
        index;

    if (this.recipient === 'SELF') {
        owner.scriptContext.jumpToLabel(this.message);
        return CommandResult.CONTINUE_AFTER_JUMP;
    }

    if (this.recipient === 'ALL') {
        recipients = owner.board.getScripables();
    } else {
        recipients = owner.board.getScriptables(this.recipient);
    }

    for (index = 0; index < recipients.length; index += 1) {
        recipients[index].sendMessage(this.message);
    }

    return CommandResult.CONTINUE;

};

/**
 * SetCommand
 *
 * When executed, sets a counter to a provided value.
 */
function SetCommand(counter, value) {
    this.counter = counter;
    this.value = value;
}

/**
 * Sets a counter to this command's associated value.
 */
SetCommand.prototype.execute = function (owner) {
    owner.board.game.setCounterValue(this.counter, this.value);
};

/**
 * ShootCommand
 *
 * When executed, adds a directed bullet to an owner's board relative
 * to the position of the owner.
 */
function ShootCommand(directionExpression) {
    this.directionExpression = directionExpression;
}

/**
 * Places a directed bullet relative to the position of a provided owner.
 */
ShootCommand.prototype.execute = function (owner) {

    // Get our final direction
    var direction = this.directionExpression.getResult(owner);

    // If a direction is available
    if (direction) {

        // Play a shooting noise
        owner.play('c-f#');

        // Shoot
        ThingFactory.shoot(owner.board, owner.point.add(direction), direction, false);

    }

};

/**
 * StandCommand
 *
 * When executed, halts an owner from walking.
 */
function StandCommand() {
    if (!(this instanceof StandCommand)) {
        throw ConstructorError;
    }
}

/**
 * Halts a provided owner from walking.
 */
StandCommand.prototype.execute = function (owner) {
    owner.walkDirection = undefined;
};

/**
 * TakeCommand
 *
 * When executed, subtracts a provided value from a given counter.
 * If it is not possible to subtract the required amount, then execution
 * should jump to a specified label instead.
 */
function TakeCommand(counter, value, label) {
    this.counter = counter;
    this.value = value;
    this.label = label;
}

/**
 * Subtracts a provided value from a given counter.
 * If it is not possible to subtract the required amount, then execution
 * should jump to a specified label within a provided owner's context instead.
 */
TakeCommand.prototype.execute = function (owner) {

    // Depending on if there's enough counter available to take...
    if (owner.board.game.getCounterValue(this.counter) < this.value) {

        // There isn't enough counter, so if we've got a label...
        if (this.label) {

            // Jump!
            owner.scriptContext.jumpToLabel(this.label);
            return CommandResult.CONTINUE_AFTER_JUMP;

        }

    } else {

        // Take away our counter value
        owner.board.game.adjustCounter(this.counter, -1 * this.value);
        return CommandResult.CONTINUE;

    }
};

/**
 * ThrowStar Command
 *
 * When executed, launches a throwing star in a direction relative
 * to this command's provided owner.
 */
function ThrowStarCommand(directionExpression) {
    this.directionExpression = directionExpression;
}

/**
 * Launches a throwing star in a direction relative to a provided owner.
 */
ThrowStarCommand.prototype.execute = function (owner) {
    // Get our final direction
    var direction = this.directionExpression.getResult(owner);

    // If a direction is available
    if (direction) {

        // Shoot
        ThingFactory.shoot(owner.board, owner.point.add(direction), direction, false, true);

    }
};

/**
 * Torch Command
 *
 * When executes, sets an owner's torch radius to this command's associated
 * radius.
 */
function TorchCommand(radius) {
    this.radius = radius;
}

/**
 * Sets an owner's torch radius to this command's associated
 * radius.
 */
TorchCommand.prototype.execute = function (owner) {
    owner.setTorchRadius(this.radius);
};

/**
 * UnlockCommand
 *
 * When executed, sets a provided owner's locked state to false,
 * allowing it to once again receive messages from other
 * Scriptables.
 */
function UnlockCommand() {
    if (!(this instanceof UnlockCommand)) {
        throw ConstructorError;
    }
}

/**
 * Sets a provided owner's locked state to false,
 * allowing it to once again receive messages from other
 * Scriptables.
 */
UnlockCommand.prototype.execute = function (owner) {
    owner.locked = false;
    return CommandResult.CONTINUE;
};

/**
 * VictoryCommand
 *
 * When executed, sets the owner's game's state to Victory.
 */
function VictoryCommand() {
    if (!(this instanceof VictoryCommand)) {
        throw ConstructorError;
    }
}

/**
 * Sets a provided owner's game's state to victory.
 */
VictoryCommand.prototype.execute = function (owner) {
    owner.board.game.setState(GameState.Victory);
};

/**
 * WaitCommand
 *
 * When executed, pauses script execution for a number
 * of specified cycles.
 */
function WaitCommand(count) {
    this.count = count;
}

/**
 * Pauses script execution for a number
 * of specified cycles.
 */
WaitCommand.prototype.execute = function (owner) {

    var heap = owner.scriptContext.heap,
        cycles = '<cycles>';

    if (!heap[cycles]) {
        heap[cycles] = this.count;
    }

    heap[cycles] -= 1;
    if (heap[cycles] > 0) {
        return CommandResult.REPEAT;
    }

    // If we've got no more heap cycles, delete it entirely
    delete heap[cycles];

};

/**
 * WalkCommand
 *
 * When executed, instructs a provided owner to begin walking
 * in a direction as evaluated by this command's provided
 * direction expression;
 */
function WalkCommand(directionExpression) {
    this.directionExpression = directionExpression;
}

/**
 * Instructs a provided owner to begin walking
 * in a direction as evaluated by this command's provided
 * direction expression;
 */
WalkCommand.prototype.execute = function (owner) {
    var direction = this.directionExpression.getResult(owner);
    owner.walkDirection = direction;
    return CommandResult.CONTINUE;
};

/**
 * ZapCommand
 *
 * When executed, zaps a provided label from an owner's script
 * context.
 */
function ZapCommand(label) {
    this.label = label;
}

/**
 * Zaps a provided label from an owner's script context.
 */
ZapCommand.prototype.execute = function (owner) {
    owner.scriptContext.zapLabel(this.label);
    return CommandResult.CONTINUE;
};

// EXPRESSIONS ------------------------------------------------

/**
 * NotExpression
 */
function NotExpression(expression) {
    this.subExpression = expression;
}

NotExpression.prototype.getResult = function (owner) {
    return !this.subExpression.getResult(owner);
};

/**
 * AdjacentExpression
 */
function AdjacentExpression() {
    if (!(this instanceof AdjacentExpression)) {
        throw ConstructorError;
    }
}

AdjacentExpression.prototype.getResult = function (owner) {
    return owner.isPlayerAdjacent();
};

/**
 * BlockedExpression
 */
function BlockedExpression(directionExpression) {
    this.directionExpression = directionExpression;
}

BlockedExpression.prototype.getResult = function (owner) {
    return owner.isBlocked(this.directionExpression.getResult(owner));
};

/**
 * AlignedExpression
 */
function AlignedExpression(directionExpression) {
    this.directionExpression = directionExpression;
}

AlignedExpression.prototype.getResult = function (owner) {
    return this.directionExpression ? owner.isPlayerAligned(1, this.directionExpression.getResult(owner)) : owner.isPlayerAligned(1);
};

/**
 * PeepExpression
 */
function PeepExpression(radius) {
    this.radius = radius || 5;
}

PeepExpression.prototype.getResult = function (owner) {
    return owner.isPlayerVisible(this.distance);
};

/**
 * ExistsExpression
 */
function ExistsExpression(thingTemplate, count) {
    this.thingTemplate = thingTemplate;
    this.count = count;
}

ExistsExpression.prototype.getResult = function (owner) {
    return owner.board.hasTile(this.thingTemplate, this.count);
};

/**
 * TestingExpression
 */
function TestingExpression(counter, operand, value) {
    this.counter = counter;
    this.operand = operand;
    this.value = value;
}

TestingExpression.prototype.getResult = function (owner) {

    // Get our counter value
    var counterValue = owner.getCounterValue(this.counter);

    switch (this.operand) {
    case '>':
        return counterValue > this.value;
    case '<':
        return counterValue < this.value;
    case '>=':
        return counterValue >= this.value;
    case '<=':
        return counterValue <= this.value;
    case '=':
        return counterValue === this.value;
    }

    return undefined;
};

// PUBLIC INTERFACE -------------------------------------------

exports.CommandResult = CommandResult;

exports.DirectionModifier = DirectionModifier;
exports.Direction = Direction;

exports.DirectionExpression = DirectionExpression;

exports.Label = Label;

exports.BecomeCommand = BecomeCommand;
exports.ChangeCommand = ChangeCommand;
exports.CharCommand = CharCommand;
exports.DieCommand = DieCommand;
exports.EndCommand = EndCommand;
exports.GiveCommand = GiveCommand;
exports.IfCommand = IfCommand;
exports.LockCommand = LockCommand;
exports.MoveCommand = MoveCommand;
exports.PlayCommand = PlayCommand;
exports.PutCommand = PutCommand;
exports.ScrollCommand = ScrollCommand;
exports.SendCommand = SendCommand;
exports.SetCommand = SetCommand;
exports.TakeCommand = TakeCommand;
exports.ThrowStarCommand = ThrowStarCommand;
exports.TorchCommand = TorchCommand;
exports.RestoreCommand = RestoreCommand;
exports.SayCommand = SayCommand;
exports.ShootCommand = ShootCommand;
exports.StandCommand = StandCommand;
exports.UnlockCommand = UnlockCommand;
exports.VictoryCommand = VictoryCommand;
exports.WaitCommand = WaitCommand;
exports.WalkCommand = WalkCommand;
exports.ZapCommand = ZapCommand;

exports.NotExpression = NotExpression;
exports.AdjacentExpression = AdjacentExpression;
exports.BlockedExpression = BlockedExpression;
exports.AlignedExpression = AlignedExpression;
exports.PeepExpression = PeepExpression;
exports.ExistsExpression = ExistsExpression;
exports.TestingExpression = TestingExpression;
