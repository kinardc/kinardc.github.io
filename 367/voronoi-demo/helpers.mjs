export function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

export function modulate(val, minVal, maxVal, outMin, outMax) {
    const fr = fractionate(val, minVal, maxVal), delta = outMax - outMin;
    return outMin + (fr * delta);
}

export function max(typedArray) {
    return typedArray.reduce( (a, b) => Math.max(a, b) );
}

export function mirrorArray(typedArray) {
    return [...typedArray, ...typedArray.reverse()];
}

