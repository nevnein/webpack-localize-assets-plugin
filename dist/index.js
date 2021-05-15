"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const assert_1 = __importDefault(require("assert"));
const webpack_sources_1 = require("webpack-sources");
const magic_string_1 = __importDefault(require("magic-string"));
const has_own_prop_1 = __importDefault(require("has-own-prop"));
const WebpackError_js_1 = __importDefault(require("webpack/lib/WebpackError.js"));
const utils_1 = require("./utils");
const types_1 = require("./types");
const fileNameTemplatePlaceholder = `[locale:${utils_1.sha256('locale-placeholder').slice(0, 8)}]`;
const fileNameTemplatePlaceholderPattern = new RegExp(fileNameTemplatePlaceholder.replace(/[[\]]/g, '\\$&'), 'g');
const isJsFile = /\.js$/;
const isSourceMap = /\.js\.map$/;
const placeholderPrefix = utils_1.sha256('localize-assets-plugin-placeholder-prefix').slice(0, 8);
const placeholderSuffix = '|';
class LocalizeAssetsPlugin {
    constructor(options) {
        this.locales = {};
        this.validatedLocales = new Set();
        this.trackStringKeys = new Set();
        types_1.OptionsSchema.parse(options);
        this.options = options;
        this.localeNames = Object.keys(options.locales);
        if (this.localeNames.length === 1) {
            [this.singleLocale] = this.localeNames;
        }
        if (options.warnOnUnusedString) {
            for (const locale of this.localeNames) {
                for (const stringKey of Object.keys(options.locales[locale])) {
                    this.trackStringKeys.add(stringKey);
                }
            }
        }
    }
    loadLocales(fs) {
        for (const locale of this.localeNames) {
            const value = this.options.locales[locale];
            if (typeof value === 'string') {
                this.locales[locale] = utils_1.loadJson(fs, value);
            }
            else {
                this.locales[locale] = value;
            }
        }
    }
    apply(compiler) {
        const { inputFileSystem } = compiler;
        // Validate output file name
        compiler.hooks.thisCompilation.tap(LocalizeAssetsPlugin.name, (compilation) => {
            this.loadLocales(inputFileSystem);
            const { filename, chunkFilename } = compilation.outputOptions;
            assert_1.default(filename.includes('[locale]'), 'output.filename must include [locale]');
            assert_1.default(chunkFilename.includes('[locale]'), 'output.chunkFilename must include [locale]');
        });
        // Insert locale placeholders into assets and asset names
        compiler.hooks.compilation.tap(LocalizeAssetsPlugin.name, (compilation, { normalModuleFactory }) => {
            this.validatedLocales.clear();
            this.interpolateLocaleToFileName(compilation);
            this.insertLocalePlaceholders(normalModuleFactory);
        });
        compiler.hooks.make.tap(LocalizeAssetsPlugin.name, (compilation) => {
            if (!this.singleLocale) {
                // Create localized assets by swapping out placeholders with localized strings
                this.generateLocalizedAssets(compilation);
            }
        });
        if (this.options.warnOnUnusedString) {
            compiler.hooks.done.tap(LocalizeAssetsPlugin.name, ({ compilation }) => {
                if (this.trackStringKeys.size > 0) {
                    for (const unusedStringKey of this.trackStringKeys) {
                        const error = new WebpackError_js_1.default(`[${LocalizeAssetsPlugin.name}] Unused string key "${unusedStringKey}"`);
                        compilation.warnings.push(error);
                    }
                }
            });
        }
    }
    interpolateLocaleToFileName(compilation) {
        var _a;
        const replaceWith = (_a = this.singleLocale) !== null && _a !== void 0 ? _a : fileNameTemplatePlaceholder;
        const interpolate = (path) => {
            if (typeof path === 'string') {
                path = path.replace(/\[locale]/g, replaceWith);
            }
            return path;
        };
        if (utils_1.isWebpack5Compilation(compilation)) {
            compilation.hooks.assetPath.tap(LocalizeAssetsPlugin.name, interpolate);
        }
        else {
            // @ts-expect-error Missing hook from @type
            compilation.mainTemplate.hooks.assetPath.tap(LocalizeAssetsPlugin.name, interpolate);
        }
    }
    validateLocale(stringKey, module, node) {
        if (this.validatedLocales.has(stringKey)) {
            return;
        }
        const { locales } = this;
        const { throwOnMissing } = this.options;
        const missingFromLocales = this.localeNames.filter(locale => !has_own_prop_1.default(locales[locale], stringKey));
        const isMissingFromLocales = missingFromLocales.length > 0;
        this.validatedLocales.add(stringKey);
        if (isMissingFromLocales) {
            const location = node.loc.start;
            const error = new WebpackError_js_1.default(`[${LocalizeAssetsPlugin.name}] Missing localization for key "${stringKey}" used in ${module.resource}:${location.line}:${location.column} from locales: ${missingFromLocales.join(', ')}`);
            if (throwOnMissing) {
                throw error;
            }
            else {
                utils_1.reportModuleWarning(module, error);
            }
        }
    }
    insertLocalePlaceholders(normalModuleFactory) {
        const { singleLocale } = this;
        const { functionName = '__' } = this.options;
        const handler = (parser) => {
            parser.hooks.call.for(functionName).tap(LocalizeAssetsPlugin.name, (callExpressionNode) => {
                const firstArgumentNode = callExpressionNode.arguments[0];
                if (callExpressionNode.arguments.length === 1
                    && firstArgumentNode.type === 'Literal'
                    && typeof firstArgumentNode.value === 'string') {
                    const stringKey = firstArgumentNode.value;
                    this.validateLocale(stringKey, parser.state.module, callExpressionNode);
                    if (singleLocale) {
                        utils_1.toConstantDependency(parser, JSON.stringify(this.locales[singleLocale][stringKey] || stringKey))(callExpressionNode);
                    }
                    else {
                        const placeholder = placeholderPrefix + utils_1.base64.encode(stringKey) + placeholderSuffix;
                        utils_1.toConstantDependency(parser, JSON.stringify(placeholder))(callExpressionNode);
                    }
                    return true;
                }
                const location = callExpressionNode.loc.start;
                utils_1.reportModuleWarning(parser.state.module, new WebpackError_js_1.default(`[${LocalizeAssetsPlugin.name}] Ignoring confusing usage of localization function "${functionName}" in ${parser.state.module.resource}:${location.line}:${location.column}`));
            });
        };
        normalModuleFactory.hooks.parser
            .for('javascript/auto')
            .tap(LocalizeAssetsPlugin.name, handler);
        normalModuleFactory.hooks.parser
            .for('javascript/dynamic')
            .tap(LocalizeAssetsPlugin.name, handler);
        normalModuleFactory.hooks.parser
            .for('javascript/esm')
            .tap(LocalizeAssetsPlugin.name, handler);
    }
    locatePlaceholders(sourceString) {
        const placeholderLocations = [];
        const possibleLocations = utils_1.findSubstringLocations(sourceString, placeholderPrefix);
        for (const placeholderIndex of possibleLocations) {
            const placeholderStartIndex = placeholderIndex + placeholderPrefix.length;
            const placeholderSuffixIndex = sourceString.indexOf(placeholderSuffix, placeholderStartIndex);
            if (placeholderSuffixIndex === -1) {
                continue;
            }
            const placeholder = sourceString.slice(placeholderStartIndex, placeholderSuffixIndex);
            const stringKey = utils_1.base64.decode(placeholder);
            if (stringKey) {
                placeholderLocations.push({
                    stringKey,
                    index: placeholderIndex,
                    endIndex: placeholderSuffixIndex + placeholderSuffix.length,
                });
            }
        }
        return placeholderLocations;
    }
    generateLocalizedAssets(compilation) {
        const { localeNames } = this;
        const { sourceMapsForLocales } = this.options;
        const generateLocalizedAssets = async () => {
            // @ts-expect-error Outdated @type
            const assetsWithInfo = compilation.getAssets()
                .filter(asset => asset.name.includes(fileNameTemplatePlaceholder));
            await Promise.all(assetsWithInfo.map(async (asset) => {
                const { source, map } = asset.source.sourceAndMap();
                const localizedAssetNames = [];
                if (isJsFile.test(asset.name)) {
                    const sourceString = source.toString();
                    const placeholderLocations = this.locatePlaceholders(sourceString);
                    const fileNamePlaceholderLocations = utils_1.findSubstringLocations(sourceString, fileNameTemplatePlaceholder);
                    await Promise.all(localeNames.map(async (locale) => {
                        const newAssetName = asset.name.replace(fileNameTemplatePlaceholderPattern, locale);
                        localizedAssetNames.push(newAssetName);
                        const localizedSource = this.localizeAsset(locale, newAssetName, placeholderLocations, fileNamePlaceholderLocations, sourceString, ((!sourceMapsForLocales || sourceMapsForLocales.includes(locale))
                            ? map
                            : null));
                        // @ts-expect-error Outdated @type
                        compilation.emitAsset(newAssetName, localizedSource, {
                            ...asset.info,
                            locale,
                        });
                    }));
                }
                else {
                    let localesToIterate = localeNames;
                    if (isSourceMap.test(asset.name) && sourceMapsForLocales) {
                        localesToIterate = sourceMapsForLocales;
                    }
                    await Promise.all(localesToIterate.map(async (locale) => {
                        const newAssetName = asset.name.replace(fileNameTemplatePlaceholderPattern, locale);
                        localizedAssetNames.push(newAssetName);
                        // @ts-expect-error Outdated @type
                        compilation.emitAsset(newAssetName, asset.source, asset.info);
                    }));
                }
                // Delete original unlocalized asset
                utils_1.deleteAsset(compilation, asset.name, localizedAssetNames);
            }));
        };
        // Apply after minification since we don't want to
        // duplicate the costs of that for each asset
        if (utils_1.isWebpack5Compilation(compilation)) {
            // Happens after PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE
            compilation.hooks.processAssets.tapPromise({
                name: LocalizeAssetsPlugin.name,
                stage: compilation.constructor.PROCESS_ASSETS_STAGE_ANALYSE,
            }, generateLocalizedAssets);
        }
        else {
            // Triggered after minification, which usually happens in optimizeChunkAssets
            compilation.hooks.optimizeAssets.tapPromise(LocalizeAssetsPlugin.name, generateLocalizedAssets);
        }
    }
    localizeAsset(locale, assetName, placeholderLocations, fileNamePlaceholderLocations, source, map) {
        const localeData = this.locales[locale];
        const magicStringInstance = new magic_string_1.default(source);
        // Localze strings
        for (const { stringKey, index, endIndex } of placeholderLocations) {
            const localizedString = JSON.stringify(localeData[stringKey] || stringKey).slice(1, -1);
            if (this.options.warnOnUnusedString) {
                this.trackStringKeys.delete(stringKey);
            }
            magicStringInstance.overwrite(index, endIndex, localizedString);
        }
        // Localize chunk requests
        for (const location of fileNamePlaceholderLocations) {
            magicStringInstance.overwrite(location, location + fileNameTemplatePlaceholder.length, locale);
        }
        const localizedCode = magicStringInstance.toString();
        if (map) {
            const newSourceMap = magicStringInstance.generateMap({
                source: assetName,
                includeContent: true,
            });
            return new webpack_sources_1.SourceMapSource(localizedCode, assetName, newSourceMap, source, map, true);
        }
        return new webpack_sources_1.RawSource(localizedCode);
    }
}
module.exports = LocalizeAssetsPlugin;
