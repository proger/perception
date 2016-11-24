/* jshint esversion: 6, undef: true */
/* globals document, console */

import * as canvas from './canvas.js';

import ar from './auto-reload.js';
ar();

export let gencanvas = (name = 'defcanvas', theCanvas = null) => {
  let blockName = `${name}-block`;
  let block = document.getElementById(blockName);
  let existing = block !== null;
  if (!existing) {
    block = document.createElement('div');
  }

  let canv = theCanvas || document.getElementById(name) || document.createElement('canvas');
  canv.id = name;
  let pickerName = `${name}-color`;
  let picker = document.getElementById(pickerName) || document.createElement('div');

  if (!existing) {
    canvas.attachPicker(canv, picker);
    canv.width = 640;
    canv.height = 360;

    document.body.appendChild(block);
    block.appendChild(picker);
    block.appendChild(canv);
  }

  return canv;
};

let testImage = document.getElementById('testImage');

let gaussian = [0.1, 0.2, 0.4, 0.2, 0.1];

import * as convolve from './convolve.js';

let id = canvas.fromImg(testImage);
//let outp = convolveVertical(gaussian, convolveHorizontal(halfGaussian, id));
//canvas.renderNormalizedChan(outp, 0, defcanvas);

//console.profile("sobel");
let sob = convolve.sobel(id);
//console.profileEnd("sobel");
canvas.renderNormalizedChan(sob, 2, gencanvas('defcanvas'));

let grad = convolve.gradient(id);
canvas.renderNormalizedChan(grad, 2, gencanvas('gradcanvas'));
