/**
 * Normalizes a value to a 0-100 scale given a min and max.
 * Values outside the bounds are clamped.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function normalize(value, min, max) {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return ((value - min) / (max - min)) * 100;
}
