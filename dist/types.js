"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsSchema = void 0;
const z = __importStar(require("zod"));
const has_own_prop_1 = __importDefault(require("has-own-prop"));
const LocaleSchema = z.record(z.string());
const LocalesSchema = z.record(LocaleSchema).refine(object => Object.keys(object).length > 0, {
    message: 'locales must contain at least one locale',
});
exports.OptionsSchema = z.object({
    locales: LocalesSchema,
    functionName: z.string().optional(),
    throwOnMissing: z.boolean().optional(),
    sourceMapsForLocales: z.string().array().optional(),
    warnOnUnusedString: z.boolean().optional(),
}).refine(options => (!options.sourceMapsForLocales
    || options.sourceMapsForLocales.every(locale => has_own_prop_1.default(options.locales, locale))), {
    message: 'sourceMapsForLocales must contain valid locales',
});
