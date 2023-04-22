/**
 * Chase Kinard
 * - Helper functions for controlling vertices in response to frequency data.
 */

/* Credit: Prakhar Bhardwaj (https://codepen.io/prakhar625/pen/zddKRj) */
export function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

/* Credit: Prakhar Bhardwaj (https://codepen.io/prakhar625/pen/zddKRj) */
export function modulate(val, minVal, maxVal, outMin, outMax) {
    const fr = fractionate(val, minVal, maxVal), delta = outMax - outMin;
    return outMin + (fr * delta);
}

export function max(typedArray) {
    return typedArray.reduce( (a, b) => Math.max(a, b) );
}

export function avg(typedArray) {
    return typedArray.reduce( (a, b) => a + b ) / typedArray.length;
}

export function mirrorArray(typedArray) {
    return [...typedArray, ...typedArray.reverse()];
}

