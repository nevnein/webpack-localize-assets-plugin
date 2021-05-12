import { RawSource, SourceMapSource } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import { Options, Plugin, Compiler, Compilation, NormalModuleFactory } from './types';
declare type PlaceholderLocations = {
    stringKey: string;
    index: number;
    endIndex: number;
}[];
declare class LocalizeAssetsPlugin implements Plugin {
    options: Options;
    localeNames: string[];
    singleLocale?: string;
    validatedLocales: Set<string>;
    trackStringKeys: Set<string>;
    constructor(options: Options);
    apply(compiler: Compiler): void;
    interpolateLocaleToFileName(compilation: Compilation): void;
    validateLocale(compilation: Compilation, stringKey: string): void;
    insertLocalePlaceholders(compilation: Compilation, normalModuleFactory: NormalModuleFactory): void;
    locatePlaceholders(sourceString: string): PlaceholderLocations;
    generateLocalizedAssets(compilation: Compilation): void;
    localizeAsset(locale: string, assetName: string, placeholderLocations: PlaceholderLocations, fileNamePlaceholderLocations: number[], source: string, map: RawSourceMap | null): RawSource | SourceMapSource;
}
export = LocalizeAssetsPlugin;
