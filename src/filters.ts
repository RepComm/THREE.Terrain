import { TerrainOptions, EasingFunction } from "./basicTypes";
import { Vector3 } from "three";
import { Linear, EaseInOut } from "./core";

/**
 * Rescale the heightmap of a terrain to keep it within the maximum range.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}() but only `maxHeight`, `minHeight`, `easing`, and `stretch`
 *   are used.
 */
export function applyTerrainClamp(g: Vector3[], options: Pick<TerrainOptions, 'maxHeight' | 'minHeight' | 'easing' | 'stretch'>) {
  let min = Infinity,
    max = -Infinity,
    l = g.length,
    i;
  options.easing = options.easing || Linear;
  for (i = 0; i < l; i++) {
    if (g[i].z < min) min = g[i].z;
    if (g[i].z > max) max = g[i].z;
  }
  let actualRange = max - min,
    optMax = typeof options.maxHeight !== 'number' ? max : options.maxHeight,
    optMin = typeof options.minHeight !== 'number' ? min : options.minHeight,
    targetMax = options.stretch ? optMax : (max < optMax ? max : optMax),
    targetMin = options.stretch ? optMin : (min > optMin ? min : optMin),
    range = targetMax - targetMin;
  if (targetMax < targetMin) {
    targetMax = optMax;
    range = targetMax - targetMin;
  }
  for (i = 0; i < l; i++) {
    g[i].z = options.easing((g[i].z - min) / actualRange) * range + optMin;
  }
};

/**
 * Move the edges of the terrain up or down based on distance from the edge.
 *
 * Useful to make islands or enclosing walls/cliffs.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Boolean} direction
 *   `true` if the edges should be turned up; `false` if they should be turned
 *   down.
 * @param {Number} distance
 *   The distance from the edge at which the edges should begin to be affected
 *   by this operation.
 * @param {Number/Function} [e=THREE.Terrain.EaseInOut]
 *   A function that determines how quickly the terrain will transition between
 *   its current height and the edge shape as distance to the edge decreases.
 *   It does this by interpolating the height of each vertex along a curve.
 *   Valid values include `THREE.Terrain.Linear`, `THREE.Terrain.EaseIn`,
 *   `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *   `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *   between 0 and 1 and returns a float between 0 and 1.
 * @param {Object} [edges={top: true, bottom: true, left: true, right: true}]
 *   Determines which edges should be affected by this function. Defaults to
 *   all edges. If passed, should be an object with `top`, `bottom`, `left`,
 *   and `right` Boolean properties specifying which edges to affect.
 */
export function Edges(g: Vector3[], options: TerrainOptions, direction: boolean, distance: number, easing: EasingFunction, edges: { top: boolean; bottom: boolean; left: boolean; right: boolean }) {
  let numXSegments = Math.floor(distance / (options.width / options.widthSegments)) || 1,
    numYSegments = Math.floor(distance / (options.height / options.heightSegments)) || 1,
    peak = direction ? options.maxHeight : options.minHeight,
    max = direction ? Math.max : Math.min,
    xl = options.widthSegments + 1,
    yl = options.heightSegments + 1,
    i, j, multiplier, k1, k2;
  easing = easing || EaseInOut;
  if (typeof edges !== 'object') {
    edges = { top: true, bottom: true, left: true, right: true };
  }
  for (i = 0; i < xl; i++) {
    for (j = 0; j < numYSegments; j++) {
      multiplier = easing(1 - j / numYSegments);
      k1 = j * xl + i;
      k2 = (options.heightSegments - j) * xl + i;
      if (edges.top) {
        g[k1].z = max(g[k1].z, (peak - g[k1].z) * multiplier + g[k1].z);
      }
      if (edges.bottom) {
        g[k2].z = max(g[k2].z, (peak - g[k2].z) * multiplier + g[k2].z);
      }
    }
  }
  for (i = 0; i < yl; i++) {
    for (j = 0; j < numXSegments; j++) {
      multiplier = easing(1 - j / numXSegments);
      k1 = i * xl + j;
      k2 = (options.heightSegments - i) * xl + (options.widthSegments - j);
      if (edges.left) {
        g[k1].z = max(g[k1].z, (peak - g[k1].z) * multiplier + g[k1].z);
      }
      if (edges.right) {
        g[k2].z = max(g[k2].z, (peak - g[k2].z) * multiplier + g[k2].z);
      }
    }
  }
  applyTerrainClamp(g, {
    maxHeight: options.maxHeight,
    minHeight: options.minHeight,
    stretch: true,
    easing: Linear
  });
};

/**
 * Move the edges of the terrain up or down based on distance from the center.
 *
 * Useful to make islands or enclosing walls/cliffs.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Boolean} direction
 *   `true` if the edges should be turned up; `false` if they should be turned
 *   down.
 * @param {Number} distance
 *   The distance from the center at which the edges should begin to be
 *   affected by this operation.
 * @param {Number/Function} [e=THREE.Terrain.EaseInOut]
 *   A function that determines how quickly the terrain will transition between
 *   its current height and the edge shape as distance to the edge decreases.
 *   It does this by interpolating the height of each vertex along a curve.
 *   Valid values include `THREE.Terrain.Linear`, `THREE.Terrain.EaseIn`,
 *   `THREE.Terrain.EaseOut`, `THREE.Terrain.EaseInOut`,
 *   `THREE.Terrain.InEaseOut`, and any custom function that accepts a float
 *   between 0 and 1 and returns a float between 0 and 1.
 */
export function RadialEdges(g: Vector3[], options: TerrainOptions, direction: boolean, distance: number, easing: EasingFunction,) {
  let peak = direction ? options.maxHeight : options.minHeight,
    max = direction ? Math.max : Math.min,
    xl = (options.widthSegments + 1),
    yl = (options.heightSegments + 1),
    xl2 = xl * 0.5,
    yl2 = yl * 0.5,
    xSegmentSize = options.width / options.widthSegments,
    ySegmentSize = options.height / options.heightSegments,
    edgeRadius = Math.min(options.width, options.height) * 0.5 - distance,
    i, j, multiplier, k, vertexDistance;
  for (i = 0; i < xl; i++) {
    for (j = 0; j < yl2; j++) {
      k = j * xl + i;
      vertexDistance = Math.min(edgeRadius, Math.sqrt((xl2 - i) * xSegmentSize * (xl2 - i) * xSegmentSize + (yl2 - j) * ySegmentSize * (yl2 - j) * ySegmentSize) - distance);
      if (vertexDistance < 0) continue;
      multiplier = easing(vertexDistance / edgeRadius);
      g[k].z = max(g[k].z, (peak - g[k].z) * multiplier + g[k].z);
      // Use symmetry to reduce the number of iterations.
      k = (options.heightSegments - j) * xl + i;
      g[k].z = max(g[k].z, (peak - g[k].z) * multiplier + g[k].z);
    }
  }
};

/**
 * Smooth the terrain by setting each point to the mean of its neighborhood.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Number} [weight=0]
 *   How much to weight the original vertex height against the average of its
 *   neighbors.
 */
export function applyTerrainSmooth(g: Vector3[], options: TerrainOptions, weight: number = 0) {
  let heightmap = new Float64Array(g.length);
  for (let i = 0, xl = options.widthSegments + 1, yl = options.heightSegments + 1; i < xl; i++) {
    for (let j = 0; j < yl; j++) {
      let sum = 0,
        c = 0;
      for (let n = -1; n <= 1; n++) {
        for (let m = -1; m <= 1; m++) {
          let key = (j + n) * xl + i + m;
          if (typeof g[key] !== 'undefined' && i + m >= 0 && j + n >= 0 && i + m < xl && j + n < yl) {
            sum += g[key].z;
            c++;
          }
        }
      }
      heightmap[j * xl + i] = sum / c;
    }
  }
  let w = 1 / (1 + weight);
  for (let k = 0, l = g.length; k < l; k++) {
    g[k].z = (heightmap[k] + g[k].z * weight) * w;
  }
};

/**
 * Smooth the terrain by setting each point to the median of its neighborhood.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function SmoothMedian(g: Vector3[], options: TerrainOptions) {
  let heightmap = new Float64Array(g.length),
    neighborValues: number[] = [],
    neighborKeys = [],
    sortByValue = function (a: number, b: number) {
      return neighborValues[a] - neighborValues[b];
    };
  for (let i = 0, xl = options.widthSegments + 1, yl = options.heightSegments + 1; i < xl; i++) {
    for (let j = 0; j < yl; j++) {
      neighborValues.length = 0;
      neighborKeys.length = 0;
      for (let n = -1; n <= 1; n++) {
        for (let m = -1; m <= 1; m++) {
          let key = (j + n) * xl + i + m;
          if (typeof g[key] !== 'undefined' && i + m >= 0 && j + n >= 0 && i + m < xl && j + n < yl) {
            neighborValues.push(g[key].z);
            neighborKeys.push(key);
          }
        }
      }
      neighborKeys.sort(sortByValue);
      let halfKey = Math.floor(neighborKeys.length * 0.5),
        median;
      if (neighborKeys.length % 2 === 1) {
        median = g[neighborKeys[halfKey]].z;
      }
      else {
        median = (g[neighborKeys[halfKey - 1]].z + g[neighborKeys[halfKey]].z) * 0.5;
      }
      heightmap[j * xl + i] = median;
    }
  }
  for (let k = 0, l = g.length; k < l; k++) {
    g[k].z = heightmap[k];
  }
};

/**
 * Smooth the terrain by clamping each point within its neighbors' extremes.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Number} [multiplier=1]
 *   By default, this filter clamps each point within the highest and lowest
 *   value of its neighbors. This parameter is a multiplier for the range
 *   outside of which the point will be clamped. Higher values mean that the
 *   point can be farther outside the range of its neighbors.
 */
export function SmoothConservative(g: Vector3[], options: TerrainOptions, multiplier: number) {
  let heightmap = new Float64Array(g.length);
  for (let i = 0, xl = options.widthSegments + 1, yl = options.heightSegments + 1; i < xl; i++) {
    for (let j = 0; j < yl; j++) {
      let max = -Infinity,
        min = Infinity;
      for (let n = -1; n <= 1; n++) {
        for (let m = -1; m <= 1; m++) {
          let key = (j + n) * xl + i + m;
          if (typeof g[key] !== 'undefined' && n && m && i + m >= 0 && j + n >= 0 && i + m < xl && j + n < yl) {
            if (g[key].z < min) min = g[key].z;
            if (g[key].z > max) max = g[key].z;
          }
        }
      }
      let kk = j * xl + i;
      if (typeof multiplier === 'number') {
        let halfdiff = (max - min) * 0.5,
          middle = min + halfdiff;
        max = middle + halfdiff * multiplier;
        min = middle - halfdiff * multiplier;
      }
      heightmap[kk] = g[kk].z > max ? max : (g[kk].z < min ? min : g[kk].z);
    }
  }
  for (let k = 0, l = g.length; k < l; k++) {
    g[k].z = heightmap[k];
  }
};

/**
 * Partition a terrain into flat steps.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Number} [levels]
 *   The number of steps to divide the terrain into. Defaults to
 *   (g.length/2)^(1/4).
 */
export function applyTerrainStep(g: Vector3[], levels?: number) {
  // Calculate the max, min, and avg values for each bucket
  const l = g.length;
  if (typeof levels === 'undefined') {
    levels = Math.floor(Math.pow(l * 0.5, 0.25));
  }
  let i = 0,
    j = 0,
    inc = Math.floor(l / levels),
    heights = new Array(l),
    buckets = new Array(levels);
  for (i = 0; i < l; i++) {
    heights[i] = g[i].z;
  }
  heights.sort(function (a, b) { return a - b; });
  for (i = 0; i < levels; i++) {
    // Bucket by population (bucket size) not range size
    let subset = heights.slice(i * inc, (i + 1) * inc),
      sum = 0,
      bl = subset.length;
    for (j = 0; j < bl; j++) {
      sum += subset[j];
    }
    buckets[i] = {
      min: subset[0],
      max: subset[subset.length - 1],
      avg: sum / bl,
    };
  }

  // Set the height of each vertex to the average height of its bucket
  for (i = 0; i < l; i++) {
    let startHeight = g[i].z;
    for (j = 0; j < levels; j++) {
      if (startHeight >= buckets[j].min && startHeight <= buckets[j].max) {
        g[i].z = buckets[j].avg;
        break;
      }
    }
  }
};

/**
 * Transform to turbulent noise.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function applyTurbulenceTurbulence(g: Vector3[], options: TerrainOptions) {
  let range = options.maxHeight - options.minHeight;
  for (let i = 0, l = g.length; i < l; i++) {
    g[i].z = options.minHeight + Math.abs((g[i].z - options.minHeight) * 2 - range);
  }
};
