import {defineThing, freezeThingRegistry} from './thing-registry.js';
import {Scriptable} from './Scriptable.js';
import {ActiveBomb} from './ActiveBomb.js';
import {Ammo} from './Ammo.js';
import {Bear} from './Bear.js';
import {Blinker} from './Blinker.js';
import {BlinkWall} from './BlinkWall.js';
import {Bomb} from './Bomb.js';
import {Boulder} from './Boulder.js';
import {BreakableWall} from './BreakableWall.js';
import {Bullet} from './Bullet.js';
import {Centipede} from './Centipede.js';
import {Conveyor} from './Conveyor.js';
import {Door} from './Door.js';
import {Duplicator} from './Duplicator.js';
import {Explosion} from './Explosion.js';
import {FakeWall} from './FakeWall.js';
import {Forest} from './Forest.js';
import {Gem} from './Gem.js';
import {GeoFence} from './GeoFence.js';
import {Heart} from './Heart.js';
import {InvisibleWall} from './InvisibleWall.js';
import {Key} from './Key.js';
import {Lava} from './Lava.js';
import {LineWall} from './LineWall.js';
import {Lion} from './Lion.js';
import {Passage} from './Passage.js';
import {Player} from './Player.js';
import {Pusher} from './Pusher.js';
import {Ricochet} from './Ricochet.js';
import {River} from './River.js';
import {Ruffian} from './Ruffian.js';
import {Signpost} from './Signpost.js';
import {SliderEw} from './SliderEw.js';
import {SliderNs} from './SliderNs.js';
import {Snake} from './Snake.js';
import {SolidWall} from './SolidWall.js';
import {Spider} from './Spider.js';
import {SpiderWeb} from './SpiderWeb.js';
import {SpinningGun} from './SpinningGun.js';
import {Teleporter} from './Teleporter.js';
import {Text} from './Text.js';
import {ThrowingStar} from './ThrowingStar.js';
import {Tiger} from './Tiger.js';
import {Torch} from './Torch.js';
import {Wall} from './Wall.js';
import {Water} from './Water.js';

const thingDefinitions = [
  ['Scriptable', Scriptable],
  ['ActiveBomb', ActiveBomb],
  ['Ammo', Ammo],
  ['Bear', Bear],
  ['Blinker', Blinker],
  ['BlinkWall', BlinkWall],
  ['Bomb', Bomb],
  ['Boulder', Boulder],
  ['BreakableWall', BreakableWall],
  ['Bullet', Bullet],
  ['Centipede', Centipede],
  ['Conveyor', Conveyor],
  ['Door', Door],
  ['Duplicator', Duplicator],
  ['Explosion', Explosion],
  ['FakeWall', FakeWall],
  ['Forest', Forest],
  ['Gem', Gem],
  ['GeoFence', GeoFence],
  ['Heart', Heart],
  ['InvisibleWall', InvisibleWall],
  ['Key', Key],
  ['Lava', Lava],
  ['LineWall', LineWall],
  ['Lion', Lion],
  ['Passage', Passage],
  ['Player', Player],
  ['Pusher', Pusher],
  ['Ricochet', Ricochet],
  ['River', River],
  ['Ruffian', Ruffian],
  ['Signpost', Signpost],
  ['SliderEw', SliderEw],
  ['SliderNs', SliderNs],
  ['Snake', Snake],
  ['SolidWall', SolidWall],
  ['Spider', Spider],
  ['SpiderWeb', SpiderWeb],
  ['SpinningGun', SpinningGun],
  ['Teleporter', Teleporter],
  ['Text', Text],
  ['ThrowingStar', ThrowingStar],
  ['Tiger', Tiger],
  ['Torch', Torch],
  ['Wall', Wall],
  ['Water', Water]
];

let initialized = false;

function initializeThingDefinitions() {
  if (!initialized) {
    for (const [name, ThingClass] of thingDefinitions) {
      defineThing(name, ThingClass);
    }
    initialized = true;
    freezeThingRegistry();
  }
}

export {initializeThingDefinitions};
