import { RawSource, SourceMapSource } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import { Options, PlaceholderLocations, Plugin, Compiler, Compilation, NormalModuleFactory } from './types';
declare class LocalizeAssetsPlugin implements Plugin {
    private readonly options;
    private readonly locales;
    private readonly localeNames;
    private readonly singleLocale?;
    private readonly validatedLocales;
    private readonly trackStringKeys;
    constructor(options: Options);
    loadLocales(fs: any): void;
    apply(compiler: Compiler): void;
    interpolateLocaleToFileName(compilation: Compilation): void;
    validateLocale(stringKey: string, module: any, node: any): void;
    insertLocalePlaceholders(normalModuleFactory: NormalModuleFactory): void;
    locatePlaceholders(sourceString: string): PlaceholderLocations;
    generateLocalizedAssets(compilation: Compilation): void;
    localizeAsset(locale: string, assetName: string, placeholderLocations: PlaceholderLocations, fileNamePlaceholderLocations: number[], source: string, map: RawSourceMap | null): RawSource | SourceMapSource;
}
export = LocalizeAssetsPlugin;
