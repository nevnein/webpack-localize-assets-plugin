import { Options, Plugin, Compiler } from './types';
declare class LocalizeAssetsPlugin implements Plugin {
    private readonly options;
    private readonly locales;
    private readonly localeNames;
    private readonly singleLocale?;
    private readonly validatedLocales;
    private readonly fileDependencies;
    private readonly trackStringKeys;
    constructor(options: Options);
    apply(compiler: Compiler): void;
    private loadLocales;
    private interpolateLocaleToFileName;
    private validateLocale;
    private insertLocalePlaceholders;
    private locatePlaceholders;
    private generateLocalizedAssets;
    private localizeAsset;
}
export = LocalizeAssetsPlugin;
