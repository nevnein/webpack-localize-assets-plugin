import { RawSource, SourceMapSource } from 'webpack-sources';
import { Options, Plugin, Compiler, Compilation, NormalModuleFactory } from './types';
declare class LocalizeAssetsPlugin implements Plugin {
    options: Options;
    localePlaceholders: Map<string, string>;
    validatedLocales: Set<string>;
    constructor(options: Options);
    apply(compiler: Compiler): void;
    interpolateLocaleToFileName(compilation: Compilation): void;
    validateLocale(compilation: Compilation, stringKey: string): void;
    insertLocalePlaceholders(compilation: Compilation, normalModuleFactory: NormalModuleFactory): void;
    locatePlaceholders(sourceString: string): {
        stringKey: string;
        index: number;
    }[];
    generateLocalizedAssets(compilation: Compilation): void;
    localizeAsset(assetName: string, source: string, map: string, localizationReplacements: {
        stringKey: string;
        index: number;
    }[], localePlaceholderLocations: number[], locale: string): RawSource | SourceMapSource;
}
export = LocalizeAssetsPlugin;
