import {basename} from 'path';
import * as webpack from 'webpack';

import {Configuration, defaultConfiguration, loadConfigurationEntry} from './configuration';
import {loadIcons} from './icons';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const GraphBundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const BabiliPlugin = require('babili-webpack-plugin');

export function setupPlugins(configuration: Configuration, environment: any): Array<any>{
  const env = configuration.environment;
  const options = configuration.pluginsOptions || {};
  const defaultOptions = defaultConfiguration.pluginsOptions;

  const indexFile = loadConfigurationEntry<string | boolean>('indexFile', configuration);
  const concatenate = loadConfigurationEntry<boolean>('concatenate', options, defaultOptions);
  const minify = loadConfigurationEntry<boolean>('minify', options, defaultOptions);
  const hotModuleReload = loadConfigurationEntry<boolean>('hotModuleReload', options, defaultOptions);
  const commonChunks = loadConfigurationEntry<boolean>('commonChunks', options, defaultOptions);
  const sizeAnalyzerServer = loadConfigurationEntry<boolean>('sizeAnalyzerServer', options, defaultOptions);

  let plugins = [
    new webpack.DefinePlugin({
      env: JSON.stringify(environment),
      version: JSON.stringify(environment.version),
      ICONS: JSON.stringify(loadIcons(configuration)),
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

  if(typeof options.afterHook === 'function')
    plugins = options.afterHook(plugins);

  return plugins;
}
