"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAsset = exports.toConstantDependency = exports.isWebpack5Compilation = exports.isWebpack5 = exports.findSubstringLocations = exports.sha256 = void 0;
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
const deleteAsset = (compilation, assetName, newAssetNames) => {
    // Delete original unlocalized asset
    if (exports.isWebpack5Compilation(compilation)) {
        for (const chunk of compilation.chunks) {
            if (chunk.files.has(assetName)) {
                for (const newAssetName of newAssetNames) {
                    chunk.files.add(newAssetName);
                }
            }
            if (chunk.auxiliaryFiles.has(assetName)) {
                for (const newAssetName of newAssetNames) {
                    chunk.auxiliaryFiles.add(newAssetName);
                }
            }
        }
        compilation.deleteAsset(assetName);
    }
    else {
        delete compilation.assets[assetName];
        /**
         * To support terser-webpack-plugin v1.4.5 (bundled with Webpack 4)
         * which iterates over chunks instead of assets
         * https://github.com/webpack-contrib/terser-webpack-plugin/blob/v1.4.5/src/index.js#L176
         */
        for (const chunk of compilation.chunks) {
            const hasAsset = chunk.files.indexOf(assetName);
            if (hasAsset > -1) {
                chunk.files.splice(hasAsset, 1, ...newAssetNames);
            }
        }
    }
};
exports.deleteAsset = deleteAsset;
