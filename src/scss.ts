import {readFileSync} from 'fs';
import * as sass from 'node-sass';

import {Configuration, Scss, defaultConfiguration, loadConfigurationEntry} from './configuration';

const postcssPlugins = function(toLoad: Array<any>, browsersWhiteList: Array<string>, selectorBlackList: Array<string | RegExp>): Array<any>{
  const plugins: Array<any> = [];

  if(toLoad.includes('remove-selectors'))
    plugins.push(require('postcss-remove-selectors')({selectors: selectorBlackList || defaultConfiguration.scss.selectorBlackList}));

  if(toLoad.includes('cssnext'))
    plugins.push(require('postcss-cssnext')({browsers: browsersWhiteList || defaultConfiguration.scss.browsersWhiteList, cascade: false}));

  if(toLoad.includes('discard-comments'))
    plugins.push(require('postcss-discard-comments')({removeAll: true}));

  for(const additional of toLoad.filter((a: any) => a && typeof a !== 'string'))
    plugins.push(additional);

  return plugins;
};

export function setupCssPipeline(configuration: Configuration): Array<any>{
  const options: Scss = configuration.scss || {};
  const defaultOptions: Scss = defaultConfiguration.scss;

  const plugins: Array<any> = loadConfigurationEntry('plugins', options, defaultOptions);
  const browsersWhiteList: Array<string> = loadConfigurationEntry('browsersWhiteList', options, defaultOptions);
  const selectorBlackList: Array<string | RegExp> = loadConfigurationEntry('selectorBlackList', options, defaultOptions);

  let pipeline: Array<any> = [
    'css-loader',
    {loader: 'postcss-loader', options: {plugins: () => postcssPlugins(plugins, browsersWhiteList, selectorBlackList)}},
    {loader: 'sass-loader', options: {
      outputStyle: 'compressed',
      functions: {svg: (param: sass.Value) => new sass.types.String(`url('data:image/svg+xml;utf8,${readFileSync(param.getValue())}')`)},
      includePaths: defaultOptions.includePaths}
    }
  ];

  if(configuration.environment !== 'production')
    pipeline.unshift('style-loader');

  if(typeof options.afterHook === 'function')
    pipeline = options.afterHook(pipeline);

  return pipeline;
}
