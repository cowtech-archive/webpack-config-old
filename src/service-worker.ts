import * as webpack from 'webpack';

import {Configuration, ServiceWorker, defaultConfiguration, loadConfigurationEntry} from './configuration';

const WorkboxPlugin = require('workbox-webpack-plugin');

export function setupServiceWorker(config: webpack.Configuration, configuration: Configuration): webpack.Configuration{
  const options = loadConfigurationEntry<ServiceWorker | boolean>('serviceWorker', configuration);
  const distFolder = loadConfigurationEntry('distFolder', configuration);

  const source = loadConfigurationEntry('source', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const dest = loadConfigurationEntry('dest', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const globPatterns = loadConfigurationEntry<Array<string>>('patterns', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const globIgnores = loadConfigurationEntry<Array<string>>('ignores', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const templatedUrls = loadConfigurationEntry<Array<string>>('templatedUrls', options as ServiceWorker, defaultConfiguration.serviceWorker as ServiceWorker);
  const transpilers = loadConfigurationEntry<Array<string>>('transpilers', configuration);

  if(options === false)
    return config;

  (config.entry as webpack.Entry)[dest] = (options as ServiceWorker).template || `./src/js/service-worker.${transpilers.includes('typescript') ? 'ts' : 'js'}`;
  (config.module as webpack.NewModule).rules.unshift(
    {
      test: /workbox-sw\.[a-z]+\..+\.js$/,
      use: [{loader: 'file-loader', options: {name: 'js/workbox.js'}}, {loader: 'babel-loader', options: {presets: ['minify', {comments: false}]}}]
    }
  );

  let plugin = new WorkboxPlugin({swSrc: `${distFolder}/${source}`, swDest: `${distFolder}/${dest}`, globPatterns, globIgnores, templatedUrls});

  if(typeof (options as ServiceWorker).afterHook === 'function')
    plugin = (options as ServiceWorker).afterHook(plugin);

  config.plugins.push(plugin);

  return config;
}
