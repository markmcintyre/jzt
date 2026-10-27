import {Direction} from './basic.js';

const SMART_PATH_MAX_DISTANCE = 50;

class PathService {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.values = new Float64Array(width * height);
    this.values.fill(Infinity);
    this.queue = new Int32Array(width * height);
    this.targetX = undefined;
    this.targetY = undefined;
    this.dirty = true;
  }

  markDirty() {
    this.dirty = true;
  }

  needsUpdate(targetPoint) {
    return this.dirty || this.targetX !== targetPoint.x || this.targetY !== targetPoint.y;
  }

  update(targetPoint, tiles, bullets) {
    var queueStart = 0,
      queueEnd = 0,
      currentIndex,
      currentDistance,
      currentX,
      currentY,
      nextIndex,
      nextDistance,
      tile;

    this.targetX = targetPoint.x;
    this.targetY = targetPoint.y;
    this.values.fill(Infinity);

    if (!this.isOutside(targetPoint)) {
      currentIndex = targetPoint.x + targetPoint.y * this.width;
      this.values[currentIndex] = 0;
      this.queue[queueEnd] = currentIndex;
      queueEnd += 1;

      while (queueStart < queueEnd) {
        currentIndex = this.queue[queueStart];
        queueStart += 1;
        currentDistance = this.values[currentIndex];

        if (currentDistance >= SMART_PATH_MAX_DISTANCE - 1) {
          continue;
        }

        currentX = currentIndex % this.width;
        currentY = Math.floor(currentIndex / this.width);
        nextDistance = currentDistance + 1;

        if (currentX + 1 < this.width) {
          nextIndex = currentIndex + 1;
          tile = tiles[nextIndex];
          if ((tile === undefined || tile.type === 'Bullet') && this.values[nextIndex] === Infinity) {
            this.values[nextIndex] = nextDistance;
            this.queue[queueEnd] = nextIndex;
            queueEnd += 1;
          }
        }

        if (currentX > 0) {
          nextIndex = currentIndex - 1;
          tile = tiles[nextIndex];
          if ((tile === undefined || tile.type === 'Bullet') && this.values[nextIndex] === Infinity) {
            this.values[nextIndex] = nextDistance;
            this.queue[queueEnd] = nextIndex;
            queueEnd += 1;
          }
        }

        if (currentY + 1 < this.height) {
          nextIndex = currentIndex + this.width;
          tile = tiles[nextIndex];
          if ((tile === undefined || tile.type === 'Bullet') && this.values[nextIndex] === Infinity) {
            this.values[nextIndex] = nextDistance;
            this.queue[queueEnd] = nextIndex;
            queueEnd += 1;
          }
        }

        if (currentY > 0) {
          nextIndex = currentIndex - this.width;
          tile = tiles[nextIndex];
          if ((tile === undefined || tile.type === 'Bullet') && this.values[nextIndex] === Infinity) {
            this.values[nextIndex] = nextDistance;
            this.queue[queueEnd] = nextIndex;
            queueEnd += 1;
          }
        }
      }
    }

    this.dirty = false;
    this.updateWeights(bullets);
  }

  updateWeights(bullets) {
    for (let index = 0; index < bullets.length; index += 1) {
      const bullet = bullets[index];
      if (bullet && !bullet.removed) {
        bullet.influenceSmartPath();
      }
    }
  }

  isOutside(point) {
    return point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height;
  }

  adjustWeight(point, strengthDelta) {
    const pathIndex = point.x + point.y * this.width;
    if (!this.isOutside(point) && this.values[pathIndex] !== Infinity) {
      this.values[pathIndex] += strengthDelta;
    }
  }

  getValue(point) {
    if (this.isOutside(point)) {
      return Infinity;
    }

    const result = this.values[point.x + point.y * this.width];
    return result === Infinity ? Infinity : result;
  }

  getDirection(point) {
    var directions = [],
      currentMin = Infinity;

    Direction.each(direction => {
      const value = this.getValue(point.add(direction));

      if (value < currentMin) {
        directions = [direction];
        currentMin = value;
      } else if (value === currentMin) {
        directions.push(direction);
      }
    });

    if (currentMin === Infinity) {
      return undefined;
    }

    return directions.length <= 1 ? directions[0] : Direction.random(directions);
  }
}

export {PathService};
