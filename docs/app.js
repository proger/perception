(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

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

/* jshint esversion: 6, undef: true */
/* globals console, Int32Array */

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

let horizontal = (kernel, imageData) => {
  return convolveOneWay(kernel, imageData, 1);
};

let vertical = (kernel, imageData) => {
  let {width: cols} = imageData;
  // when convolving vertically, make `cols'-sized steps
  // when looking for neighbors as `imageData' is row-major
  return convolveOneWay(kernel, imageData, cols);
};

/* jshint esversion: 6, undef: true */

let sub = (x, y) => x.map((x, i) => x - y[i]);

let sum$1 = (x, y) => x.map((x, i) => x + y[i]);

let dot = (x, y) => x.map((x, i) => x * y[i]).reduce((a, x) => a + x);

let norm = x => Math.sqrt(dot(x, x));

/* jshint esversion: 6, undef: true */



function mapnorm({width, height, data: a}, {data: b}) {
  return {
    width: width,
    height: height,
    data: a.map((x, i) => norm([x, b[i]]))
  };
}

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



let sobel1 = [1, 2, 1];
let sobel2 = [-1, 0, 1];

let id = fromImg(testImage);
//let outp = convolveVertical(gaussian, convolveHorizontal(halfGaussian, id));
//canvas.renderNormalizedChan(outp, 0, defcanvas);

let outpX = vertical(sobel1, horizontal(sobel2, id));
let outpY = vertical(sobel2, horizontal(sobel1, id));

renderNormalizedChan(mapnorm(outpX, outpY), 2, defcanvas);

autoReload();

})));
