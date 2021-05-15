import type WP4 from 'webpack';
import type WP5 from 'webpack5';
import * as z from 'zod';
export declare const OptionsSchema: z.ZodObject<{
    locales: z.ZodRecord<z.ZodUnion<[z.ZodRecord<z.ZodString>, z.ZodString]>>;
    functionName: z.ZodUnion<[z.ZodString, z.ZodUndefined]>;
    throwOnMissing: z.ZodUnion<[z.ZodBoolean, z.ZodUndefined]>;
    sourceMapsForLocales: z.ZodUnion<[z.ZodArray<z.ZodString>, z.ZodUndefined]>;
    warnOnUnusedString: z.ZodUnion<[z.ZodBoolean, z.ZodUndefined]>;
}, {
    strict: true;
}, {
    functionName?: string | undefined;
    throwOnMissing?: boolean | undefined;
    sourceMapsForLocales?: string[] | undefined;
    warnOnUnusedString?: boolean | undefined;
    locales: Record<string, string | Record<string, string>>;
}>;
export declare type Options = z.infer<typeof OptionsSchema>;
export declare type PlaceholderLocations = {
    stringKey: string;
    index: number;
    endIndex: number;
}[];
export { WP4, WP5 };
export declare type Webpack = typeof WP4 | typeof WP5;
export declare type Plugin = WP4.Plugin;
export declare type Compiler = WP4.Compiler | WP5.Compiler;
export declare type Compilation = WP5.Compilation | WP4.compilation.Compilation;
export declare type NormalModuleFactory = Parameters<WP5.Compiler['newCompilation']>[0]['normalModuleFactory'];
