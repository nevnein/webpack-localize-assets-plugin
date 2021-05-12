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
const nameTemplatePlaceholder = utils_1.sha256('[locale:placeholder]');
const nameTemplatePlaceholderPattern = new RegExp(nameTemplatePlaceholder, 'g');
const SHA256_LENGTH = nameTemplatePlaceholder.length;
const QUOTES_LENGTH = 2;
const isJsFile = /\.js$/;
const isSourceMap = /\.js\.map$/;
class LocalizeAssetsPlugin {
    constructor(options) {
        this.localePlaceholders = new Map();
        this.validatedLocales = new Map();
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
    apply(compiler) {
        // Validate output file name
        compiler.hooks.thisCompilation.tap(LocalizeAssetsPlugin.name, (compilation) => {
            const { filename, chunkFilename } = compilation.outputOptions;
            assert_1.default(filename.includes('[locale]'), 'output.filename must include [locale]');
            assert_1.default(chunkFilename.includes('[locale]'), 'output.chunkFilename must include [locale]');
        });
        // Insert locale placeholders into assets and asset names
        compiler.hooks.compilation.tap(LocalizeAssetsPlugin.name, (compilation, { normalModuleFactory }) => {
            this.interpolateLocaleToFileName(compilation);
            this.insertLocalePlaceholders(compilation, normalModuleFactory);
        });
        compiler.hooks.make.tap(LocalizeAssetsPlugin.name, (compilation) => {
            if (!this.singleLocale) {
                // Create localized assets by swapping out placeholders with localized strings
                this.generateLocalizedAssets(compilation);
            }
            if (this.options.warnOnUnusedString && this.trackStringKeys.size > 0) {
                for (const unusedStringKey of this.trackStringKeys) {
                    const error = new WebpackError_js_1.default(`[${LocalizeAssetsPlugin.name}] Unused string key "${unusedStringKey}"`);
                    compilation.warnings.push(error);
                }
            }
        });
    }
    interpolateLocaleToFileName(compilation) {
        var _a;
        const replaceWith = (_a = this.singleLocale) !== null && _a !== void 0 ? _a : nameTemplatePlaceholder;
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
    validateLocale(compilation, stringKey) {
        if (this.validatedLocales.has(stringKey)) {
            return this.validatedLocales.get(stringKey);
        }
        const { locales, throwOnMissing, } = this.options;
        const missingFromLocales = this.localeNames.filter(locale => !has_own_prop_1.default(locales[locale], stringKey));
        const isMissingFromLocales = missingFromLocales.length > 0;
        this.validatedLocales.set(stringKey, !isMissingFromLocales);
        if (isMissingFromLocales) {
            const error = new WebpackError_js_1.default(`[${LocalizeAssetsPlugin.name}] Missing localization for key "${stringKey}" in locales: ${missingFromLocales.join(', ')}`);
            if (throwOnMissing) {
                throw error;
            }
            else {
                compilation.warnings.push(error);
            }
        }
        return !isMissingFromLocales;
    }
    insertLocalePlaceholders(compilation, normalModuleFactory) {
        const { singleLocale, localePlaceholders, } = this;
        const { functionName = '__', } = this.options;
        const handler = (parser) => {
            parser.hooks.call.for(functionName).tap(LocalizeAssetsPlugin.name, (callExpressionNode) => {
                const firstArgumentNode = callExpressionNode.arguments[0];
                if (callExpressionNode.arguments.length === 1
                    && firstArgumentNode.type === 'Literal'
                    && typeof firstArgumentNode.value === 'string') {
                    const stringKey = firstArgumentNode.value;
                    const isValid = this.validateLocale(compilation, stringKey);
                    if (this.options.warnOnUnusedString) {
                        this.trackStringKeys.delete(stringKey);
                    }
                    if (singleLocale) {
                        if (isValid) {
                            utils_1.toConstantDependency(parser, JSON.stringify(this.options.locales[singleLocale][stringKey]))(callExpressionNode);
                        }
                    }
                    else {
                        const placeholder = JSON.stringify(LocalizeAssetsPlugin.name + utils_1.sha256(stringKey));
                        utils_1.toConstantDependency(parser, placeholder)(callExpressionNode);
                        localePlaceholders.set(placeholder, stringKey);
                    }
                    return true;
                }
                const location = callExpressionNode.loc.start;
                const error = new WebpackError_js_1.default(`[${LocalizeAssetsPlugin.name}] Ignoring confusing usage of localization function "${functionName}" in ${parser.state.module.resource}:${location.line}:${location.column}`);
                parser.state.module.warnings.push(error);
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
        const { localePlaceholders } = this;
        const localizationReplacements = [];
        const possibleLocations = utils_1.findSubstringLocations(sourceString, `"${LocalizeAssetsPlugin.name}`);
        for (const placeholderIndex of possibleLocations) {
            const placeholder = sourceString.slice(placeholderIndex, placeholderIndex + LocalizeAssetsPlugin.name.length + SHA256_LENGTH + QUOTES_LENGTH);
            const stringKey = localePlaceholders.get(placeholder);
            if (stringKey) {
                localizationReplacements.push({
                    stringKey,
                    index: placeholderIndex,
                });
            }
        }
        return localizationReplacements;
    }
    generateLocalizedAssets(compilation) {
        const { localeNames } = this;
        const { sourceMapsForLocales } = this.options;
        const generateLocalizedAssets = () => {
            // @ts-expect-error Outdated @type
            const assetsWithInfo = compilation.getAssets()
                .filter(asset => asset.name.includes(nameTemplatePlaceholder));
            for (const asset of assetsWithInfo) {
                const { source, map } = asset.source.sourceAndMap();
                const localizedAssetNames = [];
                if (isJsFile.test(asset.name)) {
                    const sourceString = source.toString();
                    const localizationReplacements = this.locatePlaceholders(sourceString);
                    const localePlaceholderLocations = utils_1.findSubstringLocations(sourceString, nameTemplatePlaceholder);
                    for (const locale of localeNames) {
                        const newAssetName = asset.name.replace(nameTemplatePlaceholderPattern, locale);
                        localizedAssetNames.push(newAssetName);
                        const localizedSource = this.localizeAsset(locale, newAssetName, localizationReplacements, localePlaceholderLocations, sourceString, ((!sourceMapsForLocales || sourceMapsForLocales.includes(locale))
                            ? map
                            : null));
                        // @ts-expect-error Outdated @type
                        compilation.emitAsset(newAssetName, localizedSource, {
                            ...asset.info,
                            locale,
                        });
                    }
                }
                else {
                    let localesToIterate = localeNames;
                    if (isSourceMap.test(asset.name) && sourceMapsForLocales) {
                        localesToIterate = sourceMapsForLocales;
                    }
                    for (const locale of localesToIterate) {
                        const newAssetName = asset.name.replace(nameTemplatePlaceholderPattern, locale);
                        localizedAssetNames.push(newAssetName);
                        // @ts-expect-error Outdated @type
                        compilation.emitAsset(newAssetName, asset.source, asset.info);
                    }
                }
                // Delete original unlocalized asset
                utils_1.deleteAsset(compilation, asset.name, localizedAssetNames);
            }
        };
        // Apply after minification since we don't want to
        // duplicate the costs of that for each asset
        if (utils_1.isWebpack5Compilation(compilation)) {
            // Happens after PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE
            compilation.hooks.processAssets.tap({
                name: LocalizeAssetsPlugin.name,
                stage: compilation.constructor.PROCESS_ASSETS_STAGE_ANALYSE,
            }, generateLocalizedAssets);
        }
        else {
            // Triggered after minification, which usually happens in optimizeChunkAssets
            compilation.hooks.optimizeAssets.tap(LocalizeAssetsPlugin.name, generateLocalizedAssets);
        }
    }
    localizeAsset(locale, assetName, localizationReplacements, localePlaceholderLocations, source, map) {
        const localeData = this.options.locales[locale];
        const magicStringInstance = new magic_string_1.default(source);
        // Localze strings
        for (const { stringKey, index } of localizationReplacements) {
            const localizedString = JSON.stringify(localeData[stringKey] || stringKey);
            magicStringInstance.overwrite(index, index + LocalizeAssetsPlugin.name.length + SHA256_LENGTH + QUOTES_LENGTH, localizedString);
        }
        // Localize chunk requests
        for (const location of localePlaceholderLocations) {
            magicStringInstance.overwrite(location, location + nameTemplatePlaceholder.length, locale);
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
