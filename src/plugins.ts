import {basename} from 'path';
import * as webpack from 'webpack';

import {Configuration, PluginOptions, defaultConfiguration} from './configuration';
import {loadIcons} from './icons';

const HtmlWebpackPlugin: any = require('html-webpack-plugin');
const GraphBundleAnalyzerPlugin: any = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const BabiliPlugin: any = require('babili-webpack-plugin');

export function setupPlugins(configuration: Configuration, environment: any): Array<any>{
  const env: string = configuration.environment;
  const options: PluginOptions = configuration.pluginsOptions || {};
  const defaultOptions: PluginOptions = defaultConfiguration.pluginsOptions;

  const indexFile: string | boolean = configuration.hasOwnProperty('indexFile') ? configuration.indexFile : defaultConfiguration.indexFile;
  const concatenate: boolean = options.hasOwnProperty('concatenate') ? options.concatenate : defaultOptions.concatenate;
  const minify: boolean = options.hasOwnProperty('minify') ? options.minify : defaultOptions.minify;
  const hotModuleReload: boolean = options.hasOwnProperty('hotModuleReload') ? options.hotModuleReload : defaultOptions.hotModuleReload;
  const commonChunks: boolean = options.hasOwnProperty('commonChunks') ? options.commonChunks : defaultOptions.commonChunks;
  const sizeAnalyzerServer: boolean = options.hasOwnProperty('sizeAnalyzerServer') ? options.sizeAnalyzerServer : defaultOptions.sizeAnalyzerServer;

  const plugins: Array<any> = [
    new webpack.DefinePlugin({
      'env': JSON.stringify(environment),
      'version': JSON.stringify(environment.version),
      'ICONS': JSON.stringify(loadIcons(configuration)),
      'process.env': {NODE_ENV: JSON.stringify(env)} // This is needed by React for production mode
    })
  ];

  if(indexFile)
    plugins.push(new HtmlWebpackPlugin({template: indexFile, minify: {collapseWhitespace: true}, inject: false, excludeAssets: [/\.js$/]}));

  if(concatenate)
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

  if(env === 'production'){
    if(minify)
      plugins.push(new BabiliPlugin({mangle: false})); // PI: Remove mangle when Safari 10 is dropped: https://github.com/mishoo/UglifyJS2/issues/1753
  }else{
    if(hotModuleReload)
      plugins.push(new webpack.HotModuleReplacementPlugin());
    if(commonChunks)
      plugins.push(new webpack.optimize.CommonsChunkPlugin({name: 'webpack-bootstrap.js'}));

    if(sizeAnalyzerServer && basename(process.argv[1]) === 'webpack-dev-server')
      plugins.push(new GraphBundleAnalyzerPlugin({openAnalyzer: false}));
  }

  if(Array.isArray(configuration.plugins))
    plugins.push(...configuration.plugins);

  return plugins;
}
