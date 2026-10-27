import {Point, utilities} from './basic.js';

class LightingService {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.lightSources = [];
    this.lightGeometryCache = Object.create(null);
    this.lightMask = undefined;
    this.previousLightMask = undefined;
    this.lightMaskDirty = true;
  }

  updateLightSource(thing) {
    var torch,
      source,
      radius;

    torch = thing.getTorch();
    source = thing._lightSource;

    if (!torch || torch.radius <= 0) {
      if (source) {
        source.active = false;
        this.lightMaskDirty = true;
      }
      return;
    }

    radius = torch.radius;
    if (!source) {
      source = {
        thing:thing,
        x:thing.point.x,
        y:thing.point.y,
        radius:radius,
        geometry:this.getLightGeometry(radius),
        active:true
      };
      thing._lightSource = source;
      this.lightSources.push(source);
      this.lightMaskDirty = true;
    } else {
      if (source.x !== thing.point.x || source.y !== thing.point.y || source.radius !== radius) {
        source.x = thing.point.x;
        source.y = thing.point.y;
        source.radius = radius;
        source.geometry = this.getLightGeometry(radius);
        this.lightMaskDirty = true;
      }
      source.active = true;
    }
  }

  invalidateLightSource(thing) {
    if (thing._lightSource) {
      this.lightMaskDirty = true;
    }
  }

  getLightGeometry(radius) {
    if (!Object.prototype.hasOwnProperty.call(this.lightGeometryCache, radius)) {
      this.lightGeometryCache[radius] = utilities.generateCircleData(new Point(0, 0), radius);
    }

    return this.lightGeometryCache[radius];
  }

  ensureLightMask() {
    var size = this.width * this.height;

    if (!this.lightMask || this.lightMask.length !== size) {
      this.lightMask = new Uint8Array(size);
      this.previousLightMask = new Uint8Array(size);
      this.lightMaskDirty = true;
    }

    if (this.lightMaskDirty) {
      this.rebuildLightMask();
    }
  }

  rebuildLightMask() {
    var sourceIndex,
      row,
      source,
      y,
      x,
      startX,
      endX,
      span;

    this.lightMask.fill(0);

    for (sourceIndex = 0; sourceIndex < this.lightSources.length; sourceIndex += 1) {
      source = this.lightSources[sourceIndex];
      if (!source.active) {
        continue;
      }

      for (row in source.geometry) {
        if (source.geometry.hasOwnProperty(row)) {
          y = source.y + Number(row);
          if (y >= 0 && y < this.height) {
            span = source.geometry[row];
            startX = Math.max(0, Math.ceil(source.x + span[0]));
            endX = Math.min(this.width - 1, Math.floor(source.x + span[1]));
            for (x = startX; x <= endX; x += 1) {
              this.lightMask[x + y * this.width] = 1;
            }
          }
        }
      }
    }

    this.lightMaskDirty = false;
  }

  prepareLightSources() {
    var index;

    for (index = 0; index < this.lightSources.length; index += 1) {
      this.lightSources[index].active = false;
    }
  }

  pruneLightSources() {
    var index,
      source;

    for (index = this.lightSources.length - 1; index >= 0; index -= 1) {
      source = this.lightSources[index];
      if (!source.active) {
        if (source.thing._lightSource === source) {
          source.thing._lightSource = undefined;
        }
        this.lightMaskDirty = true;
        this.lightSources.splice(index, 1);
      }
    }
  }

  beginUpdate() {
    if (!this.lightMask) {
      this.ensureLightMask();
    }
    this.previousLightMask.set(this.lightMask);
    this.prepareLightSources();
  }

  finishUpdate() {
    this.pruneLightSources();
    this.ensureLightMask();
  }

  isLit(point, previousStep) {
    var mask;

    if (previousStep) {
      if (!this.previousLightMask) {
        this.ensureLightMask();
      }
      mask = this.previousLightMask;
    } else {
      this.ensureLightMask();
      mask = this.lightMask;
    }

    return mask[point.x + point.y * this.width] === 1;
  }
}

export {LightingService};
