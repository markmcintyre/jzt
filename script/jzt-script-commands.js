/**
 * JZTScript Commands
 * Copyright © 2014 Orangeline Interactive, Inc.
 * @author Mark McIntyre
 */

var jzt = jzt || {};
jzt.jztscript = jzt.jztscript || {};
jzt.jztscript.commands = (function(my){
    
    'use strict';
    
    /**
     * Direction Modifier Enumerated Types
     * 
     * Each direction modifier has an associated token value, a display name, and a process function.
     * The process function takes a direction and returns a final, calculated direction value.
     */
    var DirectionModifier = {
        CW:   {name: 'Clockwise',              process: function(d) {return jzt.Direction.clockwise(d);}},
        CCW:  {name: 'Counter-clockwise',      process: function(d) {return jzt.Direction.counterClockwise(d);}},
        OPP:  {name: 'Opposite',               process: function(d) {return jzt.Direction.opposite(d);}},
        RNDP: {name: 'Perpendicularly Random', process: function(d) {return jzt.Direction.randomPerpendicular(d);}}
    };
    Object.freeze(DirectionModifier);

    /**
     * Direction Enumerated Types
     *
     * Each direction has an associated token value, a display name, and a process function.
     * The process function takes a JztObject and returns a final, calculated direction value.
     */
    var Direction = {
        SEEK:  {name: 'Toward player',            process: function(o) {return o.getPlayerDirection();}},
        SMART: {name: 'Smart seek',               process: function(o) {return o.getSmartDirection() || o.getPlayerDirection();}},
        FLOW:  {name: 'Current orientation',      process: function(o) {return o.orientation;}},
        RAND:  {name: 'Random direction',         process: function()  {return jzt.Direction.random();}},
        RANDF: {name: 'Random free direction',    process: function(o) {return jzt.Direction.random(o.getFreeDirections());}},
        RANDB: {name: 'Random blocked direction', process: function(o) {return jzt.Direction.random(o.getBlockedDirections());}},
        RNDEW: {name: 'Randomly East or West',    process: function()  {return jzt.Direction.randomEastWest();}},
        RNDNS: {name: 'Randomly North or South',  process: function()  {return jzt.Direction.randomNorthSouth();}},
        RNDNE: {name: 'Randomly North or East',   process: function()  {return jzt.Direction.randomNorthEast();}},
        NORTH: {name: 'North',                    process: function()  {return jzt.Direction.North;}},
        EAST:  {name: 'East',                     process: function()  {return jzt.Direction.East;}},
        SOUTH: {name: 'South',                    process: function()  {return jzt.Direction.South;}},
        WEST:  {name: 'West',                     process: function()  {return jzt.Direction.West;}},
        N:     {name: 'North shorthand',          process: function()  {return jzt.Direction.North;}},
        E:     {name: 'East shorthand',           process: function()  {return jzt.Direction.East;}},
        S:     {name: 'South shorthand',          process: function()  {return jzt.Direction.South;}},
        W:     {name: 'West shorthand',           process: function()  {return jzt.Direction.West;}}
    };
    Object.freeze(Direction);
    
    /** 
     * Label
     */
    function Label(name) {
        
        if(!(this instanceof Label)) {
            throw jzt.ConstructorError;
        }
        
        this.name = name;
    }
    
    /**
     * DirectionExpression
     */
    function DirectionExpression(terminal) {
        
        if(!(this instanceof DirectionExpression)) {
            throw jzt.ConstructorError;
        }
        
        this.modifiers = [];
        this.terminal = terminal;
        this.count = 1;
    }
    
    DirectionExpression.prototype.execute = function(owner) {
        
        // Get our direction from our expression
        var direction = this.direction.process(owner);

        // Evaluate our modifiers into a direction
        var modifiers = this.modifiers.slice(0);
        while(modifiers.length) {
            direction = modifiers.pop().process(direction);
        }

        // Return our result
        return direction;
    };
    
    /**
     * BecomeCommand
     */
    function BecomeCommand(template) {
        
        if(!(this instanceof BecomeCommand)) {
            throw jzt.ConstructorError;
        }
        
        this.template = template;
        
    }

    BecomeCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * ChangeCommand
     */
    function ChangeCommand(fromTemplate, toTemplate) {
        if(!(this instanceof ChangeCommand)) {
            throw jzt.ConstructorError;
        }
        
        this.fromTemplate = fromTemplate;
        this.toTemplate = toTemplate;
    }
    
    ChangeCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * CharCommand
     */
    function CharCommand(value) {
        if(!(this instanceof CharCommand)) {
            throw jzt.ConstructorError;
        }
        this.value = value;
    }

    CharCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * DieCommand
     */
    function DieCommand(magnetically) {
        if(!(this instanceof DieCommand)) {
            throw jzt.ConstructorError;
        }
        this.magnetically = magnetically;
    }
    
    DieCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * EndCommand
     */
    function EndCommand() {
        if(!(this instanceof EndCommand)) {
            throw jzt.ConstructorError;
        }
    }

    EndCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * GiveCommand
     */
    function GiveCommand(counter, amount) {
        if(!(this instanceof GiveCommand)) {
            throw jzt.ConstructorError;
        }
        this.counter = counter.toLowerCase();
        this.amount = amount;
    }

    GiveCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * IfCommand
     */
    function IfCommand(label, expression) {
        if(!(this instanceof IfCommand)) {
            throw jzt.ConstructorError;
        }
        this.label = label;
        this.expression = expression;
    }

    IfCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * LockCommand
     */
    function LockCommand() {}
    
    LockCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * MoveCommand
     */
    function MoveCommand(directionExpression, options) {
        this.directionExpression = directionExpression;
        this.options = options;
    }
    
    MoveCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * PlayCommand
     */
    function PlayCommand(sequence) {
        this.sequence = sequence;
    }
    
    PlayCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * PutCommand
     */
    function PutCommand(template, directionExpression) {
        this.template = template;
        this.directionExpression = directionExpression;
    }
    
    PutCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * ScrollCommand
     */
    function ScrollCommand(text, bold, jumpLabel) {
        this.text = text;
        this.bold = bold;
        this.jumpLabel = jumpLabel;
    }
    
    ScrollCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * SendCommand
     */
    function SendCommand(recipient, message) {
        this.recipient = recipient;
        this.message = message;
    }
    
    SendCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * SetCommand
     */
    function SetCommand(counter, value) {
        this.counter = counter;
        this.value = value;
    }
    
    SetCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * TakeCommand
     */
    function TakeCommand(counter, count, label) {
        this.counter = counter;
        this.count = count;
        this.label = label;
    }
    
    TakeCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * ThrowStar Command
     */
    function ThrowStarCommand(directionExpression) {
        this.directionExpression = directionExpression;
    }
    
    ThrowStarCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * Torch Command
     */
    function TorchCommand(radius) {
        this.radius = radius;
    }
    
    TorchCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * Restore Command
     */
    function RestoreCommand(label) {
        this.label = label;
    }
    
    RestoreCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * Say Command
     */
    function SayCommand(text) {
        this.text = text;
    }
    
    SayCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * ShootCommand
     */
    function ShootCommand(directionExpression) {
        this.directionExpression = directionExpression;
    }
    
    ShootCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * StandCommand
     */
    function StandCommand() {}
    
    StandCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * UnlockCommand
     */
    function UnlockCommand() {}
    
    UnlockCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * WaitCommand
     */
    function WaitCommand(cycles) {
        this.cycles = cycles;
    }
    
    WaitCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * WalkCommand
     */
    function WalkCommand(directionExpression) {
        this.directionExpression = directionExpression;
    }
    
    WalkCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    /**
     * ZapCommand
     */
    function ZapCommand(label) {
        this.label = label;
    }
    
    ZapCommand.prototype.execute = function(owner) {
        this.todo = owner;
    };
    
    // Reveal public items
    my.DirectionModifier = DirectionModifier;
    my.Direction = Direction;
    
    my.DirectionExpression = DirectionExpression;
    
    my.Label = Label;
    
    my.BecomeCommand = BecomeCommand;
    my.ChangeCommand = ChangeCommand;
    my.CharCommand = CharCommand;
    my.DieCommand = DieCommand;
    my.EndCommand = EndCommand;
    my.GiveCommand = GiveCommand;
    my.IfCommand = IfCommand;
    my.LockCommand = LockCommand;
    my.MoveCommand = MoveCommand;
    my.PlayCommand = PlayCommand;
    my.PutCommand = PutCommand;
    my.ScrollCommand = ScrollCommand;
    my.SendCommand = SendCommand;
    my.SetCommand = SetCommand;
    my.TakeCommand = TakeCommand;
    my.ThrowStarCommand = ThrowStarCommand;
    my.TorchCommand = TorchCommand;
    my.RestoreCommand = RestoreCommand;
    my.SayCommand = SayCommand;
    my.ShootCommand = ShootCommand;
    my.StandCommand = StandCommand;
    my.UnlockCommand = UnlockCommand;
    my.WaitCommand = WaitCommand;
    my.WalkCommand = WalkCommand;
    my.ZapCommand = ZapCommand;
    
    return my;
    
}(jzt.jztscript.commands || {}));