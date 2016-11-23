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

import * as convolve from './convolve.js';

let id = canvas.fromImg(testImage);
//let outp = convolveVertical(gaussian, convolveHorizontal(halfGaussian, id));
//canvas.renderNormalizedChan(outp, 0, defcanvas);

console.profile("sobel");
let sob = convolve.sobel(id);
console.profileEnd("sobel");
canvas.renderNormalizedChan(sob, 2, defcanvas);

import ar from './auto-reload.js';
ar();
