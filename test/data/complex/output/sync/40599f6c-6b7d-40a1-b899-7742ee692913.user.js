// ==UserScript==
// @name        example library 1
// @description for test 1
// @version     1.1.0
// @author      someone1
// @namespace   library namespace should not be merged.
// @exclude     http://asdf.net/
// @match       http://library.space/
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @resource    link:@stitches/react https://cdn.jsdelivr.net/npm/@stitches/react@1.2.8/dist/index.cjs
// @resource    link:fflate          https://cdn.jsdelivr.net/npm/fflate@0.7.4/lib/browser.cjs
// @resource    link:library2        http://localhost:8080/library2.user.js
// @resource    link:npm:react       https://cdn.jsdelivr.net/npm/react@18.2.0/cjs/react.production.min.js
// @resource    pure-resource        data:,pure%20resource
// ==/UserScript==
"use strict";

console.log("lib 1");

var __stitches_react = require("@stitches/react");
Object.keys(__stitches_react).forEach(function (k) {
  if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () { return __stitches_react[k]; }
  });
});
