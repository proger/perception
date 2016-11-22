/* jshint esversion: 6, undef: true */
/* globals console, Int32Array */

import { NRGBA } from './canvas.js';

let convolveOneWay = (kernel, imageData, step) => {
  let {width: cols, height: rows, data: idata} = imageData;
  let output = new Int32Array(cols*rows*NRGBA);

  const shift = kernel.length >>> 1;
  const add = kernel.length % 2;

  let kap = (i) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let k = -shift; k < shift + add; k++) {
      let kval = kernel[k+shift];
      r += idata[i+(step*NRGBA*k)+0] * kval;
      g += idata[i+(step*NRGBA*k)+1] * kval;
      b += idata[i+(step*NRGBA*k)+2] * kval;
      a += idata[i+(step*NRGBA*k)+3] * kval;
    }
    return [r,g,b,a];
  };

  for (let col = 0; col < cols; col++) {
    for (let row = shift; row < rows - shift; row++) {
      let i = NRGBA * (row * cols + col);
      let [r,g,b,a] = kap(i);
      output[i+0] = r;
      output[i+1] = g;
      output[i+2] = b;
      output[i+3] = a;
    }
  }

  return {
    data: output,
    width: cols,
    height: rows
  };
};

export let horizontal = (kernel, imageData) => {
  return convolveOneWay(kernel, imageData, 1);
};

export let vertical = (kernel, imageData) => {
  let {width: cols} = imageData;
  // when convolving vertically, make `cols'-sized steps
  // when looking for neighbors as `imageData' is row-major
  return convolveOneWay(kernel, imageData, cols);
};
