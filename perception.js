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



let gaussian = [0.1, 0.2, 0.4, 0.2, 0.1];
let sobel1 = [1, 2, 1];
let sobel2 = [-1, 0, 1];

import * as convolve from './convolve.js';

let id = canvas.fromImg(testImage);
//let outp = convolveVertical(gaussian, convolveHorizontal(halfGaussian, id));
//canvas.renderNormalizedChan(outp, 0, defcanvas);

let outpX = convolve.vertical(sobel1, convolve.horizontal(sobel2, id));
let outpY = convolve.vertical(sobel2, convolve.horizontal(sobel1, id));

import * as array from './array.js';

canvas.renderNormalizedChan(array.mapnorm(outpX, outpY), 2, defcanvas);

import ar from './auto-reload.js';
ar();
