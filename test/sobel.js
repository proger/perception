/* jshint esversion: 6 */

var Canvas = require('canvas'),
    Image = Canvas.Image,
    fs = require('fs'),
    convolve = require('convolve');

let sobel1 = [1, 2, 1];
let sobel2 = [-1, 0, 1];

fs.readFile(__dirname + '/../docs/test640.jpg', (err, src) => {
  if (err) throw err;
  let img = new Image();
  img.src = src;
  let canvas = new Canvas(img.width, img.height);
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  let id = ctx.getImageData(0, 0, img.width, img.height);

  convolve.sobel(id);

  //console.log('<img src="' + canvas.toDataURL() + '" />');
});
