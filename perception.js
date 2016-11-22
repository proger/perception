/* jshint esversion: 6, undef: true */
/* globals document, console, Int32Array */

import * as canvas from './canvas.js';

let defcanvas = document.getElementById('defcanvas') || document.createElement('canvas');
defcanvas.id = 'defcanvas';
canvas.attachPicker(defcanvas, document.getElementById('color'));
let ctx = defcanvas.getContext('2d');
let testImage = document.getElementById('testImage');

defcanvas.width = testImage.width;
defcanvas.height = testImage.height;

document.body.appendChild(defcanvas);

console.log("hello?");



// let halfGaussian = [0.25, 0.5, 0.25];
let halfGaussian = [0.1, 0.2, 0.4, 0.2, 0.1];

let convolveHorizontal = (kernel8, imageData) => {
  let {width: cols, height: rows, data: idata} = imageData;
  let output = new Int32Array(cols*rows*canvas.NRGBA);

  const shift = kernel8.length >>> 1;
  const add = kernel8.length % 2;

  let kap = (i) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let k = -shift; k < shift + add; k++) {
      r += idata[i+(canvas.NRGBA*k)+0] * kernel8[k+shift];
      g += idata[i+(canvas.NRGBA*k)+1] * kernel8[k+shift];
      b += idata[i+(canvas.NRGBA*k)+2] * kernel8[k+shift];
      a += idata[i+(canvas.NRGBA*k)+3] * kernel8[k+shift];
    }
    return [r,g,b,a];
  };

  for (let row = 0; row < rows; row++) {
    for (let col = shift; col < cols - shift; col++) {
      let i = canvas.NRGBA * (row * cols + col);
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

export let convolveVertical = (kernel8, imageData) => {
  let {width: cols, height: rows, data: idata} = imageData;
  let output = new Int32Array(cols*rows*canvas.NRGBA);

  const shift = kernel8.length >>> 1;
  const add = kernel8.length % 2;

  let kap = (i) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let k = -shift; k < shift + add; k++) {
      let kval = kernel8[k+shift];
      r += idata[i+(cols*canvas.NRGBA*k)+0] * kval;
      g += idata[i+(cols*canvas.NRGBA*k)+1] * kval;
      b += idata[i+(cols*canvas.NRGBA*k)+2] * kval;
      a += idata[i+(cols*canvas.NRGBA*k)+3] * kval;
    }
    return [r,g,b,a];
  };

  for (let col = 0; col < cols; col++) {
    for (let row = shift; row < rows - shift; row++) {
      let i = canvas.NRGBA * (row * cols + col);
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

let id = canvas.fromImg(testImage);
let outp = convolveVertical(halfGaussian, convolveHorizontal(halfGaussian, id));

canvas.renderNormalizedChan(outp, 0, defcanvas);

import ar from './auto-reload.js';
ar();

