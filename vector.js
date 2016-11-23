/* jshint esversion: 6, undef: true */

let sqr = x => x*x;

export let sub = (x, y) => x.map((x, i) => x - y[i]);

export let sum = (x, y) => x.map((x, i) => x + y[i]);

//export let dot = (x, y) => x.map((x, i) => x * y[i]).reduce((a, x) => a + x);

//export let dot = (xs, ys) => xs.reduce(((a, x, i) => a + (x * ys[i])), 0);

export let dot = (xs, ys) => {
  let acc = 0;
  for (let i = 0; i < xs.length; i++) {
    acc += xs[i] * ys[i];
  }
  return acc;
};

export let norm = x => Math.sqrt(dot(x, x));

// export let magnitude = (xs, ys) => xs.map((x, i) => vector.norm([x, ys[i]]));

export let magnitude = (xs, ys) => {
  let magnitude = new Int32Array(xs);
  for (let i = 0; i < magnitude.length; i++) {
    magnitude[i] = Math.sqrt(xs[i] * xs[i] + ys[i] * ys[i]);
  }
  return magnitude;
};

export let metric = (x, y) => norm(sub(x, y));
