import typescript from 'rollup-plugin-typescript2';

export default {
  input: './src/index.ts',
  output: {
    file: './index.js',
    format: 'cjs'
  },
  plugins: [
    typescript({clean: true, cacheRoot: 'tmp/.rpt2_cache', tsconfig: 'tsconfig.json', useTsconfigDeclarationDir: true}),
    // Workaround for external sass module
    {transformBundle: code => ({code: code.replace("var sass = require('sass');\n", ''), map: {mappings: ''}})}
  ],
  external: [...Object.keys(require('./package.json').dependencies), 'fs', 'path', 'webpack', 'cheerio']
};
