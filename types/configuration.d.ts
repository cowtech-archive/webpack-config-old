/// <reference types="node" />
/// <reference types="webpack" />
import * as webpack from 'webpack';
import { Icons } from './icons';
export interface IconsLoader {
    id: string;
    prefix?: string;
    fontAwesomePath?: string;
    afterHook?(icons: Icons): Icons;
}
export interface Babel {
    browsersWhiteList: Array<string>;
    exclude?: Array<string>;
}
export interface Scss {
    includePaths?: Array<string>;
    plugins?: Array<any>;
    browsersWhiteList?: Array<string>;
    selectorBlackList?: Array<string | RegExp>;
}
export interface Https {
    key: Buffer | string;
    cert: Buffer | string;
}
export interface Server {
    host?: string;
    port?: number;
    https?: Https | boolean;
    historyApiFallback?: boolean;
    compress?: boolean;
    hot?: boolean;
}
export interface PluginOptions {
    concatenate?: boolean;
    minify?: boolean;
    hotModuleReload?: boolean;
    commonChunks?: boolean;
    sizeAnalyzerServer?: boolean;
}
export interface ServiceWorker {
    template?: string;
    source: string;
    dest: string;
    patterns: Array<string | RegExp>;
    ignores: Array<string | RegExp>;
}
export interface Configuration {
    environment?: string;
    version?: string;
    entries: string | Array<string> | {
        [key: string]: string;
    };
    distFolder: string;
    transpilers?: Array<string>;
    indexFile?: string | boolean;
    icons?: Array<string>;
    iconsLoader?: string | IconsLoader;
    plugins?: Array<any>;
    pluginsOptions?: PluginOptions;
    babel?: Babel;
    scss?: Scss;
    externals?: Array<string>;
    sourceMapsType?: webpack.Options.Devtool;
    server?: Server;
    serviceWorker?: ServiceWorker | boolean;
}
export declare const defaultConfiguration: Configuration;
export declare function loadConfigurationEntry(key: string, configuration: {
    [key: string]: any;
}, defaults?: {
    [key: string]: any;
}): any;
