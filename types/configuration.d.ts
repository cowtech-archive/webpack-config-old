/// <reference types="node" />
/// <reference types="webpack" />
import * as webpack from 'webpack';
export interface IconsLoader {
    id: string;
    prefix?: string;
    fontAwesomePath?: string;
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
export interface Configuration {
    environment?: string;
    version?: string;
    entries: string | Array<string>;
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
    serviceWorkerEnabled?: boolean;
}
export declare const defaultConfiguration: Configuration;
