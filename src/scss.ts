import {readFileSync} from 'fs';
import * as sass from 'sass';

import {Configuration, Scss, defaultConfiguration} from './configuration';

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

export function setupCssPipeline(configuration: Configuration){
  const options: Scss = configuration.scss || {};
  const defaultOptions: Scss = defaultConfiguration.scss;

  const plugins: Array<any> = options.hasOwnProperty('plugins') ? options.plugins : defaultOptions.plugins;
  const browsersWhiteList: Array<string> = options.hasOwnProperty('browsersWhiteList') ? options.browsersWhiteList : defaultOptions.browsersWhiteList;
  const selectorBlackList: Array<string | RegExp> = options.hasOwnProperty('selectorBlackList') ? options.selectorBlackList : defaultOptions.selectorBlackList;

  const pipeline = [
    'css-loader',
    {loader: 'postcss-loader', options: {plugins: () => postcssPlugins(plugins, browsersWhiteList, selectorBlackList)}},
    {loader: 'sass-loader', options: {
      outputStyle: 'compressed',
      functions: {svg: (param: sass.Value) => new sass.types.String(`url('data:image/svg+xml;utf8,${readFileSync(param.getValue())}')`)},
      includePaths: defaultConfiguration.scss.includePaths}
    }
  ];

  if(configuration.environment !== 'production')
    pipeline.unshift('style-loader');

  return pipeline;
}
