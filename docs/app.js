(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.app = global.app || {})));
}(this, (function (exports) { 'use strict';

/* jshint esversion: 6, undef: true */
/* globals document, Uint32Array, Int32Array */

const NRGBA = 4|0;



let chanBounds = (i32) => {
  let vals = Array(NRGBA).fill(null).map((_) => ({max: 0, min: 0}));
  for (let i = 0; i < i32.length / NRGBA; i++) {
    for (let chan = 0; chan < NRGBA; chan++) {
      let x = i32[i*NRGBA + chan];
      vals[chan].min = Math.min(x, vals[chan].min);
      vals[chan].max = Math.max(x, vals[chan].max);
    }
  }
  return vals;
};

let attachPicker = (canvas, color) => {
  let ctx = canvas.getContext('2d');
  function pick(event) {
    let {layerX: x, layerY: y} = event;
    let pixel = ctx.getImageData(x, y, 1, 1);
    let [r,g,b,a] = pixel.data;
    //color.style.color = rgba;
    color.textContent = `{x: ${x}, y: ${y}, color: rgba(${r}, ${g}, ${b}, ${a})}`;
  }
  canvas.addEventListener('mousemove', pick);
};

let withCanvasImageData = (canvas, callback) => {
  let ctx = canvas.getContext('2d');
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  callback(imageData, function() {
    ctx.putImageData(imageData, 0, 0);
  });
};

let fromImg = (image) => {
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

let abgr32 = (a, b, g, r) => (
  (a << 24) | (b << 16) | (g << 8) | (r >>> 0));




let normalize = (x, min = 0, max = 1) => {
  return (x - min) / (max - min);
};

let renderNormalizedChan = (imdata, chan, canvas) => {
  let {data: idata, width: cols, height: rows} = imdata;
  let {min, max} = chanBounds(idata)[chan];

  withCanvasImageData(canvas, (imageData, done) => {
    let data_u32 = new Uint32Array(imageData.data.buffer);

    // ABGR
    data_u32.fill(0xff0000ff);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let i32 = row * cols + col;
        let v = Math.floor(normalize(idata[i32 * NRGBA + chan], min, max) * 255);

        data_u32[i32] = abgr32(0xff, v, v, v);
      }
    }

    done();
  });
};

/* jshint esversion: 6 */
/* based on https://github.com/brunch/auto-reload-brunch */

let WebSocket = window.WebSocket || window.MozWebSocket;

let cacheBuster = (url) => {
  var date = Math.round(Date.now() / 1000).toString();
  url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
  return url + (url.indexOf('?') >= 0 ? '&' : '?') +'cacheBuster=' + date;
};

let reloadJs = () => {
  let scripts = [].slice.call(document.querySelectorAll('script'));
  let wlfilter = (script) => script.dataset.autoreload;

  let textScripts = scripts
      .filter(wlfilter).map((script) => script.text).filter((text) => text.length > 0);
  let srcScripts = scripts
    .filter(wlfilter).filter((script) => script.src);

  let loaded = 0;
  let all = srcScripts.length;
  let onLoad = () => {
    loaded = loaded + 1;
    if (loaded === all) {
      textScripts.forEach(function(scriptText) {
        eval(scriptText);
      });
    }
  };

  srcScripts
    .forEach(function(script) {
      var src = script.src;
      script.remove();
      var newScript = document.createElement('script');
      newScript.src = cacheBuster(src);
      newScript.async = true;
      newScript.onload = onLoad;
      newScript.dataset.autoreload = true;
      document.head.appendChild(newScript);
    });
};

let port = 9485;
let host = window.location.hostname || 'localhost';

function autoReload() {
  if (typeof window._ar_connection !== 'undefined') {
    return;
  }
  if (window.location.protocol === "https:") {
    return;
  }
  var connection = new WebSocket('ws://' + host + ':' + port);
  console.log(`created connection: ${connection}`);

  connection.onmessage = (event) => {
    //var message = event.data;
    reloadJs();
  };
  connection.onerror = () => {
    if (connection.readyState)
      connection.close();
  };
  connection.onclose = () => {
    window.setTimeout(autoReload, 5000);
  };
  window._ar_connection = connection;
}

/* jshint esversion: 6, undef: true */

let sub = (x, y) => x.map((x, i) => x - y[i]);



//export let dot = (x, y) => x.map((x, i) => x * y[i]).reduce((a, x) => a + x);

//export let dot = (xs, ys) => xs.reduce(((a, x, i) => a + (x * ys[i])), 0);

let dot = (xs, ys) => {
  let acc = 0;
  for (let i = 0; i < xs.length; i++) {
    acc += xs[i] * ys[i];
  }
  return acc;
};

let norm = x => Math.sqrt(dot(x, x));

// export let magnitude = (xs, ys) => xs.map((x, i) => vector.norm([x, ys[i]]));

let magnitude = (xs, ys) => {
  let magnitude = new Int32Array(xs);
  for (let i = 0; i < magnitude.length; i++) {
    magnitude[i] = Math.sqrt(xs[i] * xs[i] + ys[i] * ys[i]);
  }
  return magnitude;
};

/* jshint esversion: 6, undef: true */
/* globals window, console, Int32Array */

let imul = Math.imul;

function convolve1d(kernel, i32data, step) {
  const len = i32data.length;
  let output = new Int32Array(len);

  const shift = kernel.length >>> 1;
  const rem = kernel.length % 2;

  const minbound = imul(shift, step);
  const maxbound = len - imul(shift + rem, step);

  for (let i = minbound; i < maxbound; i++) {
    for (let k = -shift; k < shift + rem; k++) {
      let i32 = i + imul(step, k);
      let val = i32data[i32];
      output[i] += imul(val, kernel[k+shift]);
    }
  }

  return output;
}





/* trick: convolve two inputs with two kernels at once */
function convolve1dx2(kernel, i32data, kernel2, i32data2, step) {
  const len = i32data.length;
  let output = new Int32Array(len);
  let output2 = new Int32Array(len);

  const shift = kernel.length >>> 1;
  const rem = kernel.length % 2;

  const minbound = imul(shift, step);
  const maxbound = len - imul(shift + rem, step);

  for (let i = minbound; i < maxbound; i++) {
    for (let k = -shift; k < shift + rem; k++) {
      let i32 = i + imul(step, k);
      output[i] += imul(i32data[i32], kernel[k+shift]);
      output2[i] += imul(i32data2[i32], kernel2[k+shift]);
    }
  }

  return [output, output2];
}

let sobel = (imageData) => {
  let sobel1 = new Int32Array([1, 2, 1]);
  let sobel2 = new Int32Array([-1, 0, 1]);
  let i32s = new Int32Array(imageData.data);

  console.time("sobel-convolve");
  let [x1, y1] = convolve1dx2(sobel2, i32s, sobel1, i32s, NRGBA);
  let [xs, ys] = convolve1dx2(sobel1, x1, sobel2, y1, NRGBA * imageData.width);
  console.timeEnd("sobel-convolve");

  console.time("sobel-magnitude");
  let magnitude$$1 = magnitude(xs, ys);
  console.timeEnd("sobel-magnitude");

  return {
    width: imageData.width,
    height: imageData.height,
    data: magnitude$$1
  };
};


let gradient = (imageData) => {
  let k = new Int32Array([-1, 1]);
  let i32s = new Int32Array(imageData.data);

  console.time("gradient-convolve");
  let xs = convolve1d(k, i32s, NRGBA);
  let ys = convolve1d(k, i32s, NRGBA * imageData.width);
  console.timeEnd("gradient-convolve");

  console.time("gradient-magnitude");
  let magnitude$$1 = magnitude(xs, ys);
  console.timeEnd("gradient-magnitude");

  return {
    width: imageData.width,
    height: imageData.height,
    data: magnitude$$1
  };
};

/* jshint esversion: 6, undef: true */
/* globals document, console */

autoReload();

let gencanvas = (name = 'defcanvas', theCanvas = null) => {
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
    attachPicker(canv, picker);
    canv.width = 640;
    canv.height = 360;

    document.body.appendChild(block);
    block.appendChild(picker);
    block.appendChild(canv);
  }

  return canv;
};

let testImage = document.getElementById('testImage');

let id = fromImg(testImage);
//let outp = convolveVertical(gaussian, convolveHorizontal(halfGaussian, id));
//canvas.renderNormalizedChan(outp, 0, defcanvas);

//console.profile("sobel");
let sob = sobel(id);
//console.profileEnd("sobel");
renderNormalizedChan(sob, 2, gencanvas('defcanvas'));

let grad = gradient(id);
renderNormalizedChan(grad, 2, gencanvas('gradcanvas'));

exports.gencanvas = gencanvas;

Object.defineProperty(exports, '__esModule', { value: true });

})));
