import { RawSource, SourceMapSource } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import { Options, Plugin, Compiler, Compilation, NormalModuleFactory } from './types';
declare class LocalizeAssetsPlugin implements Plugin {
    options: Options;
    localeNames: string[];
    singleLocale?: string;
    localePlaceholders: Map<string, string>;
    validatedLocales: Map<string, boolean>;
    trackStringKeys: Set<string>;
    constructor(options: Options);
    apply(compiler: Compiler): void;
    interpolateLocaleToFileName(compilation: Compilation): void;
    validateLocale(compilation: Compilation, stringKey: string): boolean | undefined;
    insertLocalePlaceholders(compilation: Compilation, normalModuleFactory: NormalModuleFactory): void;
    locatePlaceholders(sourceString: string): {
        stringKey: string;
        index: number;
    }[];
    generateLocalizedAssets(compilation: Compilation): void;
    localizeAsset(locale: string, assetName: string, localizationReplacements: {
        stringKey: string;
        index: number;
    }[], localePlaceholderLocations: number[], source: string, map: RawSourceMap | null): RawSource | SourceMapSource;
}
export = LocalizeAssetsPlugin;
