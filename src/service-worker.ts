import * as webpack from 'webpack';

import {Configuration, ServiceWorker, defaultConfiguration, loadConfigurationEntry} from './configuration';

const WorkboxPlugin = require('workbox-webpack-plugin');

export function setupServiceWorker(config: webpack.Configuration, configuration: Configuration): webpack.Configuration{
  const sw: ServiceWorker | boolean = loadConfigurationEntry('serviceWorker', configuration);
  const distFolder: string = loadConfigurationEntry('distFolder', configuration);

  const source: string = loadConfigurationEntry('source', sw as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const dest: string = loadConfigurationEntry('dest', sw as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const globPatterns: Array<string> = loadConfigurationEntry('patterns', sw as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const globIgnores: Array<string> = loadConfigurationEntry('ignores', sw as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const transpilers: Array<string> = loadConfigurationEntry('transpilers', configuration);

  if(sw === false)
    return config;

  (config.entry as webpack.Entry)[dest] = (sw as ServiceWorker).template || `./src/js/service-worker.${transpilers.includes('typescript') ? 'ts' : 'js'}`;
  (config.module as webpack.NewModule).rules.unshift(
    {
      test: /workbox-sw\.[a-z]+\..+\.js$/,
      use: [{loader: 'file-loader', options: {name: 'js/workbox.js'}}, {loader: 'babel-loader', options: {presets: ['minify', {comments: false}]}}]
    }
  );

  config.plugins.push(new WorkboxPlugin({swSrc: `${distFolder}/${source}`, swDest: `${distFolder}/${dest}`, globPatterns, globIgnores}));

  return config;
}
