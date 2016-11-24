/* jshint esversion: 6, undef: true */
/* globals document, Uint32Array, Int32Array */

export const NRGBA = 4|0;

export let u32ExtractChan = (u32, chan) => {
  let o = Int32Array(u32.length / NRGBA);
  for (let i = 0; i < u32.length / NRGBA; i++) {
    o[i] = u32[i*NRGBA + chan];
  }
  return o;
};

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

export let attachPicker = (canvas, color) => {
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

export let fromImg = (image) => {
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

let abgr32 = (a, b, g, r) => (
  (a << 24) | (b << 16) | (g << 8) | (r >>> 0));


export let render = (imageData, canvas) => {
  let {width: cols, height: rows, data: idata} = imageData;

  withCanvasImageData(canvas, ({ data }, cb) => {
    for (let i = 0; i < data.length; i++) {
      data[i] = idata[i];
    }

    cb();
  });
};

let normalize = (x, min = 0, max = 1) => {
  return (x - min) / (max - min);
};

export let renderNormalizedChan = (imdata, chan, canvas) => {
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
