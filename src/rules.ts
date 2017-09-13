import {Configuration, Babel, loadConfigurationEntry} from './configuration';

export function setupRules(configuration: Configuration, cssPipeline: any, version: string){
  const babel: Babel = loadConfigurationEntry('babel', configuration);
  const transpilers: Array<string> = loadConfigurationEntry('transpilers', configuration);

  const babelEnv = ['env', {targets: {browsers: babel.browsersWhiteList}, exclude: babel.exclude}];

  const rules: Array<any> = [
    {test: /\.scss$/, use: cssPipeline},
    {
      test: /\.(?:png|jpg|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {name: '[path][name].[ext]', outputPath: (p: string) => `${p.replace('src/', '')}`, publicPath: (p: string) => `/${p.replace('src/', '')}`}
        }
      ]
    },
    {
      test: /manifest\.json$/,
      use: [{loader: 'file-loader', options: {name: 'manifest.json'}}, {loader: 'string-replace-loader', query: {search: '@version@', replace: version}}]
    },
    {test: /robots\.txt$/, use: [{loader: 'file-loader', options: {name: 'robots\.txt'}}]}
  ];

  if(transpilers.includes('babel')){
    if(transpilers.includes('inferno')){
      rules.unshift({
        test: /\.jsx$/, exclude: /node_modules/,
        use: {loader: 'babel-loader', options: {presets: ['react', babelEnv], plugins: ['syntax-jsx', ['inferno', {imports: true}]]}}
      });
    }else if(transpilers.includes('react'))
      rules.unshift({test: /\.jsx$/, exclude: /node_modules/, use: {loader: 'babel-loader', options: {presets: ['react', babelEnv]}}});

    rules.unshift({test: /\.js$/, exclude: /node_modules/, use: {loader: 'babel-loader', options: {presets: [babelEnv]}}});
  }

  if(transpilers.includes('typescript')){
    if(transpilers.includes('inferno')){
      rules.unshift({
        test: /\.tsx$/,
        use: [
          {loader: 'babel-loader', options: {presets: [babelEnv], plugins: ['syntax-jsx', ['inferno', {imports: true}]]}},
          {loader: 'awesome-typescript-loader'}
        ]
      });
    }else if(transpilers.includes('react'))
      rules.unshift({test: /\.tsx$/, loader: 'awesome-typescript-loader'});

    rules.unshift({test: /\.ts$/, loader: 'awesome-typescript-loader'});
  }

  return rules;
}

export function setupResolvers(configuration: Configuration): Array<string>{
  const transpilers: Array<string> = loadConfigurationEntry('transpilers', configuration);
  const extensions = ['.json', '.js'];

  if(transpilers.includes('babel'))
    extensions.push('.jsx');

  if(transpilers.includes('typescript'))
    extensions.push('.ts', '.tsx');

  return extensions;
}
