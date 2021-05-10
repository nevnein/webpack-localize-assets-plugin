"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toConstantDependency = exports.isWebpack5Compilation = exports.isWebpack5 = exports.findSubstringLocations = exports.sha256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const webpack_1 = __importDefault(require("webpack"));
const sha256 = (input) => crypto_1.default.createHash('sha256').update(input).digest('hex');
exports.sha256 = sha256;
function findSubstringLocations(string, substring) {
    const indices = [];
    let index = string.indexOf(substring);
    while (index > -1) {
        indices.push(index);
        index = string.indexOf(substring, index + 1);
    }
    return indices;
}
exports.findSubstringLocations = findSubstringLocations;
const isWebpack5 = (wp) => {
    const [major] = wp.version ? wp.version.split('.') : [];
    return major === '5';
};
exports.isWebpack5 = isWebpack5;
const isWebpack5Compilation = (compilation) => ('processAssets' in compilation.hooks);
exports.isWebpack5Compilation = isWebpack5Compilation;
exports.toConstantDependency = (exports.isWebpack5(webpack_1.default)
    ? require('webpack/lib/javascript/JavascriptParserHelpers') // eslint-disable-line node/global-require,import/no-unresolved
    : require('webpack/lib/ParserHelpers') // eslint-disable-line node/global-require
).toConstantDependency;
