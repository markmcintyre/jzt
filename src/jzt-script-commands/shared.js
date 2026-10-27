/** Shared JZTScript command dependencies. */
import { ThingFactory } from '../things/thing-registry.js';
import { Direction as BasicDirection } from '../basic.js';
import { GameState } from '../game-state.js';
import { getBoardMessage } from '../i18n.js';

export { ThingFactory, BasicDirection, GameState, getBoardMessage };

export const CommandResult = Object.freeze({ NORMAL: 0, CONTINUE: 1, CONTINUE_AFTER_JUMP: 2, REPEAT: 3 });
export const DirectionModifier = Object.freeze({
    CW: {name: 'Clockwise', type: 'modifier', process: d => BasicDirection.clockwise(d)},
    CCW: {name: 'Counter-clockwise', type: 'modifier', process: d => BasicDirection.counterClockwise(d)},
    OPP: {name: 'Opposite', type: 'modifier', process: d => BasicDirection.opposite(d)},
    RNDP: {name: 'Perpendicularly Random', type: 'modifier', process: d => BasicDirection.randomPerpendicular(d)}
});
export const Direction = Object.freeze({
    SEEK:{name:'Toward player',type:'terminal',process:o=>o.getPlayerDirection()}, SMART:{name:'Smart seek',type:'terminal',process:o=>o.getSmartDirection()||o.getPlayerDirection()}, FLOW:{name:'Current orientation',type:'terminal',process:o=>o.orientation}, RAND:{name:'Random direction',type:'terminal',process:()=>BasicDirection.random()}, RANDF:{name:'Random free direction',type:'terminal',process:o=>BasicDirection.random(o.getFreeDirections())}, RANDB:{name:'Random blocked direction',type:'terminal',process:o=>BasicDirection.random(o.getBlockedDirections())}, RNDEW:{name:'Randomly East or West',type:'terminal',process:()=>BasicDirection.randomEastWest()}, RNDNS:{name:'Randomly North or South',type:'terminal',process:()=>BasicDirection.randomNorthSouth()}, RNDNE:{name:'Randomly North or East',type:'terminal',process:()=>BasicDirection.randomNorthEast()}, NORTH:{name:'North',type:'terminal',process:()=>BasicDirection.North}, EAST:{name:'East',type:'terminal',process:()=>BasicDirection.East}, SOUTH:{name:'South',type:'terminal',process:()=>BasicDirection.South}, WEST:{name:'West',type:'terminal',process:()=>BasicDirection.West}, N:{name:'North shorthand',type:'terminal',process:()=>BasicDirection.North}, E:{name:'East shorthand',type:'terminal',process:()=>BasicDirection.East}, S:{name:'South shorthand',type:'terminal',process:()=>BasicDirection.South}, W:{name:'West shorthand',type:'terminal',process:()=>BasicDirection.West}
});
