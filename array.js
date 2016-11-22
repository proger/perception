/* jshint esversion: 6, undef: true */

import * as vector from './vector.js';

let sqr = x => x*x;

export function sum({width, height, data: a}, {data: b}) {
  return {
    width: width,
    height: height,
    data: vector.sum(a, b)
  };
}

export function mapnorm({width, height, data: a}, {data: b}) {
  return {
    width: width,
    height: height,
    data: a.map((x, i) => vector.norm([x, b[i]]))
  };
}
