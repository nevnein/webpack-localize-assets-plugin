import { Webpack, Compilation, WP5 } from './types';
export declare const sha256: (input: string) => string;
export declare const base64: {
    encode: (ascii: string) => string;
    decode: (base64Encoded: string) => string;
};
export declare function findSubstringLocations(string: string, substring: string): number[];
export declare const isWebpack5: (wp: Webpack) => boolean;
export declare const isWebpack5Compilation: (compilation: Compilation) => compilation is WP5.Compilation;
export declare const toConstantDependency: any;
export declare const deleteAsset: (compilation: Compilation, assetName: string, newAssetNames: string[]) => void;