/* jshint esversion: 6, undef: true */

export let sub = (x, y) => x.map((x, i) => x - y[i]);

export let sum = (x, y) => x.map((x, i) => x + y[i]);

export let dot = (x, y) => x.map((x, i) => x * y[i]).reduce((a, x) => a + x);

export let norm = x => Math.sqrt(dot(x, x));

export let metric = (x, y) => norm(sub(x, y));
