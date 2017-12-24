import * as webpack from 'webpack';

import {Icons} from './icons';

export interface IconsLoader{
  id: string;
  prefix?: string;
  fontAwesomePath?: string;
  afterHook?(icons: Icons): Icons;
}

export interface Babel{
  browsersWhiteList: Array<string>;
  exclude?: Array<string>;
}

export interface Scss{
  includePaths?: Array<string>;
  plugins?: Array<any>;
  browsersWhiteList?: Array<string>;
  selectorBlackList?: Array<string | RegExp>;
  afterHook?(rules: Array<any>): Array<any>;
}

export interface Https{
  key: Buffer | string;
  cert: Buffer | string;
}

export interface Server{
  host?: string;
  port?: number;
  https?: Https | boolean;
  historyApiFallback?: boolean;
  compress?: boolean;
  hot?: boolean;
  afterHook?(config: any): any;
}

export interface PluginOptions{
  concatenate?: boolean;
  minify?: boolean;
  hotModuleReload?: boolean;
  commonChunks?: boolean;
  sizeAnalyzerServer?: boolean;
  afterHook?(plugins: Array<any>): Array<any>;
}

export interface ServiceWorker{
  template?: string;
  source?: string;
  dest?: string;
  patterns?: Array<string | RegExp>;
  ignores?: Array<string | RegExp>;
  templatedUrls?: {[key: string]: string | Array<string>};
  afterHook?(plugin: any): any;
}

export interface Configuration{
  environment?: string;
  version?: string;
  entries: string | Array<string> | {[key: string]: string};
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
  afterRulesHook?(rules: Array<any>): Array<any>;
}

export const defaultConfiguration: Configuration = {
  entries: [],
  distFolder: 'dist',
  transpilers: [],
  indexFile: 'index.html.ejs',
  icons: [],
  iconsLoader: 'material',
  plugins: [],
  pluginsOptions: {
    concatenate: true,
    minify: true,
    hotModuleReload: true,
    commonChunks: true,
    sizeAnalyzerServer: true
  },
  babel: {
    browsersWhiteList: ['last 2 versions'],
    exclude: ['transform-async-to-generator', 'transform-regenerator']
  },
  scss: {
    includePaths: ['lazier.sass', 'ribbon.css', 'normalize.css'].map(l => `node_modules/${l}`),
    plugins: ['remove-selectors', 'cssnext', 'discard-comments'],
    browsersWhiteList: ['last 2 versions'],
    selectorBlackList: [
      /figure|hr|pre|abbr|code|kbd|samp|dfn|mark|small|sub|sup|audio|video|details|menu|summary|canvas|template|code|figcaption|main|input|fieldset/,
      /button|optgroup|select|textarea|legend|progress|textarea|file-upload-button|::-webkit-file-upload-button/,
      /b$/, 'html [type="button"]', '[type="', '[hidden]'
    ]
  },
  externals: [],
  sourceMapsType: 'source-map',
  server: {
    host: 'home.cowtech.it',
    port: 4200,
    https: {
      key: './config/ssl/private-key.pem',
      cert: './config/ssl/certificate.pem'
    },
    historyApiFallback: true,
    compress: true,
    hot: true
  },
  serviceWorker: {
    source: 'sw.js',
    dest: 'sw.js',
    patterns: ['**/*.{html,js,json,css}', 'images/favicon.png'],
    ignores: ['manifest.json', 'sw.js', 'js/workbox.js']
  }
};

export function loadConfigurationEntry(key: string, configuration: {[key: string]: any}, defaults: {[key: string]: any} = defaultConfiguration): any{
  return configuration.hasOwnProperty(key) ? configuration[key] : defaults[key];
}
