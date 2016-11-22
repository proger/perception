(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.app = global.app || {})));
}(this, (function (exports) { 'use strict';

/* jshint esversion: 6, undef: true */
/* globals document, Uint32Array, Int32Array */

const NRGBA = 4;



let chanBounds = (u32) => {
  let vals = Array(NRGBA).fill(null).map((_) => ({max: 0, min: 0}));
  for (let i = 0; i < u32.length / NRGBA; i++) {
    for (let chan = 0; chan < NRGBA; chan++) {
      let x = u32[i*NRGBA + chan];
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
/* globals document, console, Int32Array */

let defcanvas = document.getElementById('defcanvas') || document.createElement('canvas');
defcanvas.id = 'defcanvas';
attachPicker(defcanvas, document.getElementById('color'));
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
  let output = new Int32Array(cols*rows*NRGBA);

  const shift = kernel8.length >>> 1;
  const add = kernel8.length % 2;

  let kap = (i) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let k = -shift; k < shift + add; k++) {
      r += idata[i+(NRGBA*k)+0] * kernel8[k+shift];
      g += idata[i+(NRGBA*k)+1] * kernel8[k+shift];
      b += idata[i+(NRGBA*k)+2] * kernel8[k+shift];
      a += idata[i+(NRGBA*k)+3] * kernel8[k+shift];
    }
    return [r,g,b,a];
  };

  for (let row = 0; row < rows; row++) {
    for (let col = shift; col < cols - shift; col++) {
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

let convolveVertical = (kernel8, imageData) => {
  let {width: cols, height: rows, data: idata} = imageData;
  let output = new Int32Array(cols*rows*NRGBA);

  const shift = kernel8.length >>> 1;
  const add = kernel8.length % 2;

  let kap = (i) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let k = -shift; k < shift + add; k++) {
      let kval = kernel8[k+shift];
      r += idata[i+(cols*NRGBA*k)+0] * kval;
      g += idata[i+(cols*NRGBA*k)+1] * kval;
      b += idata[i+(cols*NRGBA*k)+2] * kval;
      a += idata[i+(cols*NRGBA*k)+3] * kval;
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

let id = fromImg(testImage);
let outp = convolveVertical(halfGaussian, convolveHorizontal(halfGaussian, id));

renderNormalizedChan(outp, 0, defcanvas);

autoReload();

exports.convolveVertical = convolveVertical;

Object.defineProperty(exports, '__esModule', { value: true });

})));
