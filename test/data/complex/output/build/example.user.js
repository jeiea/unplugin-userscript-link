// ==UserScript==
// @name           main userscript
// @name:ko        메인 스크립트
// @description    for test
// @description:ko 테스트
// @version        230901010203
// @namespace      https://somewhere.space
// @exclude        *
// @match          http://unused-field.space/
// @author         someone
// @grant          GM.getResourceText
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @require        https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.js
// @resource       link:@stitches/react https://cdn.jsdelivr.net/npm/@stitches/react@1.2.8/dist/index.cjs
// @resource       link:fflate          https://cdn.jsdelivr.net/npm/fflate@0.7.4/lib/browser.cjs
// @resource       link:library1        file://library1.user.js
// @resource       link:library2        http://localhost:8080/library2.user.js
// @resource       link:npm:react       https://cdn.jsdelivr.net/npm/react@18.2.0/cjs/react.production.min.js
// @resource       link:npm:react-dom   https://cdn.jsdelivr.net/npm/react-dom@18.2.0/cjs/react-dom.production.min.js
// @resource       pure-resource        data:,pure%20resource
// ==/UserScript==
"use strict";

define("main", (require, exports, module) => {
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
require("library1");
require("npm:react");
const react_jsx_runtime = __toESM(require("react/jsx-runtime"));
var deps_exports = {};
__reExport(deps_exports, require("@stitches/react"));
__reExport(deps_exports, require("npm:react-dom"));
(0, deps_exports.render)( (0, react_jsx_runtime.jsx)("div", {}), document.body);


});

define("tampermonkey_grants", function() { Object.assign(this.window, { GM, GM_getValue, GM_setValue, GM_xmlhttpRequest }); });
requirejs.config({ deps: ["tampermonkey_grants"] });
load()

async function load() {
  const links = GM.info.script.resources.filter(x => x.name.startsWith("link:"));
  await Promise.all(links.map(async ({ name }) => {
    const script = await GM.getResourceText(name)
    define(name.replace("link:", ""), Function("require", "exports", "module", script))
  }));
  require(["main"], () => {}, console.error);
}
