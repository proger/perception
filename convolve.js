/* jshint esversion: 6, undef: true */
/* globals window, console, Int32Array */

import { NRGBA } from './canvas.js';
import * as vector from './vector.js';

let imul = Math.imul;

function convolve1d(kernel, i32data, step) {
  const len = i32data.length;
  let output = new Int32Array(len);

  const shift = kernel.length >>> 1;
  const rem = kernel.length % 2;
  const chanstep = imul(step, NRGBA);

  const minbound = imul(shift, chanstep);
  const maxbound = len - imul(shift + rem, chanstep);

  for (let i = minbound; i < maxbound; i++) {
    for (let k = -shift; k < shift + rem; k++) {
      let i32 = i + imul(chanstep, k);
      let val = i32data[i32];
      output[i] += imul(val, kernel[k+shift]);
    }
  }

  return output;
}

export let horizontal = (kernel, imageData) => {
  let {width: cols, height: rows, data: i32data} = imageData;
  let ndata = convolve1d(kernel, i32data, 1);
  return {
    width: cols,
    height: rows,
    data: ndata
  };
};

export let vertical = (kernel, imageData) => {
  let {width: cols, height: rows, data: i32data} = imageData;
  // when convolving vertically, make `cols'-sized steps
  // when looking for neighbors as `imageData' is row-major
  let ndata = convolve1d(kernel, i32data, cols);
  return {
    width: cols,
    height: rows,
    data: ndata
  };
};

/* trick: convolve two inputs with two kernels at once */
function convolve1dx2(kernel, i32data, kernel2, i32data2, step) {
  const len = i32data.length;
  let output = new Int32Array(len);
  let output2 = new Int32Array(len);

  const shift = kernel.length >>> 1;
  const rem = kernel.length % 2;
  const chanstep = imul(step, NRGBA);

  const minbound = imul(shift, chanstep);
  const maxbound = len - imul(shift + rem, chanstep);

  for (let i = minbound; i < maxbound; i++) {
    for (let k = -shift; k < shift + rem; k++) {
      let i32 = i + imul(chanstep, k);
      output[i] += imul(i32data[i32], kernel[k+shift]);
      output2[i] += imul(i32data2[i32], kernel2[k+shift]);
    }
  }

  return [output, output2];
}

export let sobel = (imageData) => {
  let sobel1 = new Int32Array([1, 2, 1]);
  let sobel2 = new Int32Array([-1, 0, 1]);
  let i32s = new Int32Array(imageData.data);

  console.time("sobel-convolve");
  let [x1, y1] = convolve1dx2(sobel2, i32s, sobel1, i32s, 1);
  let [xs, ys] = convolve1dx2(sobel1, x1, sobel2, y1, imageData.width);
  console.timeEnd("sobel-convolve");

  console.time("sobel-magnitude");
  let magnitude = vector.magnitude(xs, ys);
  console.timeEnd("sobel-magnitude");

  return {
    width: imageData.width,
    height: imageData.height,
    data: magnitude
  };
};
