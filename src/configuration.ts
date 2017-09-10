import * as webpack from 'webpack';

export interface IconsLoader{
  id: string;
  prefix?: string;
  fontAwesomePath?: string;
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
}

export interface PluginOptions{
  concatenate?: boolean;
  minify?: boolean;
  hotModuleReload?: boolean;
  commonChunks?: boolean;
  sizeAnalyzerServer?: boolean;
}

export interface Configuration{
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

export const defaultConfiguration: Configuration = {
  version: '1.0',
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
  serviceWorkerEnabled: true
};
