/*
 * This file is part of the webpack-config package. Copyright (C) 2017 and above Shogun <shogun@cowtech.it>.
 * Licensed under the MIT license, which can be found at http://www.opensource.org/licenses/mit-license.php.
 */

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const sass = require("node-sass");
const cheerio = require("cheerio");
const moment = require("moment");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackExcludeAssetsPlugin = require("html-webpack-exclude-assets-plugin");
const GraphBundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const BabiliPlugin = require("babili-webpack-plugin");
const packageInfo = require(path.resolve(process.cwd(), "./package.json"));

const defaults = {
  indexFile: "index.html.ejs",
  distFolder: "dist",
  babel: {
    browsers: ["last 2 versions"]
  },
  postcss: {
    browsers: ["last 2 versions", "IE 11"],
    selectorBlackList: [
      /figure|hr|pre|abbr|code|kbd|samp|dfn|mark|small|sub|sup|audio|video|details|menu|summary|canvas|template|code|figcaption|main|input|fieldset/,
      /button|optgroup|select|textarea|legend|progress|textarea|file-upload-button|::-webkit-file-upload-button/,
      /b$/, 'html [type="button"]', '[type="', "[hidden]"
    ]
  },
  icons: {
    svgPath: "src/css/font-awesome.svg"
  },
  sass: {
    includePaths: ["lazier.sass", "ribbon.css", "normalize.css"].map(l => `node_modules/${l}`)
  },
  devServer: {
    host: "home.cowtech.it",
    port: 4200,
    https: {
      key: "./config/ssl/private-key.pem",
      cert: "./config/ssl/certificate.pem"
    }
  }
};

module.exports.defaults = defaults;

module.exports.postcssPlugins = function(browsersWhiteList, selectorBlackList){
  return [
    require("postcss-remove-selectors")({selectors: selectorBlackList || defaults.postcss.selectorBlackList}),
    require("postcss-cssnext")({browsers: browsersWhiteList || defaults.postcss.browsers, cascade: false}),
    require("postcss-discard-comments")({removeAll: true})
  ];
};

module.exports.cssPipeline = function(env, includePaths, browsersWhiteList, selectorBlackList){
  const pipeline = [
    "css-loader",
    {loader: "postcss-loader", options: {plugins: () => module.exports.postcssPlugins(browsersWhiteList, selectorBlackList)}},
    {loader: "sass-loader", options: {
      outputStyle: "compressed",
      functions: {svg: param => new sass.types.String(`url('data:image/svg+xml;utf8,${fs.readFileSync(param.getValue())}')`)},
      includePaths: defaults.sass.includePaths}
    }
  ];

  if(env !== "production")
    pipeline.unshift("style-loader");

  return pipeline;
};

module.exports.loadIcons = function(whitelist, svgPath, prefix = "icon"){
  const library = cheerio.load(fs.readFileSync(path.resolve(process.cwd(), svgPath || defaults.icons.svgPath), "utf-8"));

  const icons = library("symbol[id^=icon-]").toArray().reduce((accu, dom, index) => {
    const icon = library(dom);
    const name = icon.attr("id").replace(/^icon-/g, "");
    const tag = `i${index}`;

    icon.attr("id", tag);
    icon.find("title").remove();

    if(!Array.isArray(whitelist))
      whitelist = [whitelist];
    if(whitelist.includes(name)){
      const definition = icon.wrap("<div/>").parent().html().replace(/\n/mg, "").replace(/^\s+/mg, "");
      accu[name] = {tag, reference: `<svg class="${prefix} ${prefix}-${name} %s"><use xlink:href="#${tag}"></use></svg>`, definition};
    }

    return accu;
  }, {});

  return icons;
};

module.exports.setupEnvironment = function(env, serviceWorkerEnabled = true, version = null){
  if(!env)
    env = "development";

  return Object.assign(
    {environment: env, serviceWorkerEnabled, version: version || moment.utc().format("YYYYMMDD-HHmm")},
    packageInfo.site.common, (packageInfo.site[env] || {})
  );
};

module.exports.setupPlugins = function(environment, indexFile, icons, otherPlugins){
  let env = environment.environment;

  if(!env)
    env = "development";

  const plugins = [
    new webpack.DefinePlugin({
      "env": JSON.stringify(environment),
      "version": JSON.stringify(environment.version),
      "ICONS": JSON.stringify(module.exports.loadIcons(icons)),
      "process.env": {NODE_ENV: JSON.stringify(env)} // This is needed by React for production mode
    }),
    new HtmlWebpackPlugin({template: indexFile || defaults.indexFile, minify: {collapseWhitespace: true}, excludeAssets: [/\.js$/]}),
    new HtmlWebpackExcludeAssetsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin()
  ];

  if(env === "production")
    plugins.push(new BabiliPlugin({mangle: false})); // PI: Remove mangle when Safari 10 is dropped: https://github.com/mishoo/UglifyJS2/issues/1753
  else{
    plugins.push(new webpack.HotModuleReplacementPlugin());

    if(path.basename(process.argv[1]) === "webpack-dev-server")
      plugins.push(new GraphBundleAnalyzerPlugin({openAnalyzer: false}));
  }

  if(Array.isArray(otherPlugins))
    plugins.push(...otherPlugins);

  return plugins;
};

module.exports.setupRules = function(transpilers, cssPipeline, version){
  const rules = [
    {test: /\.scss$/, use: cssPipeline},
    {
      test: /\.(?:png|jpg|svg)$/,
      use: [
        {
          loader: "file-loader",
          options: {name: "[path][name].[ext]", outputPath: p => `${p.replace("src/", "")}`, publicPath: p => `/${p.replace("src/", "")}`}
        }
      ]
    },
    {
      test: /manifest\.json$/,
      use: [{loader: "file-loader", options: {name: "manifest.json"}}, {loader: "string-replace-loader", query: {search: "@version@", replace: version}}]
    }
  ];

  if(transpilers.includes("babel")){
    rules.unshift({
      test: /\.jsx?$/, exclude: /node_modules/,
      use: {loader: "babel-loader", options: {presets: ["react", ["env", {targets: {browsers: defaults.babel.browsers}}]]}}
    });
  }

  if(transpilers.includes("typescript"))
    rules.unshift({test: /\.tsx?$/, loader: "awesome-typescript-loader"});

  return rules;
};

module.exports.setupResolvers = function(transpilers){
  const extensions = [".json", ".js"];

  if(transpilers.includes("babel"))
    extensions.push(".jsx");

  if(transpilers.includes("typescript"))
    extensions.push(".ts", ".tsx");

  return extensions;
};

module.exports.setupDevServer = function(host, port, https){
  const config = {
    host: host || defaults.devServer.host,
    port: port || defaults.devServer.port
  };

  if(https){
    config.https = {
      key: https.key || fs.readFileSync(path.resolve(process.cwd(), defaults.devServer.https.key)),
      cert: https.cert || fs.readFileSync(path.resolve(process.cwd(), defaults.devServer.https.cert))
    };
  }

  return config;
};

module.exports.webpackConfig = function(env, configuration){
  if(!env)
    env = "development";

  const environment = module.exports.setupEnvironment(env, configuration.serviceWorkerEnabled, configuration.version);
  const destination = path.resolve(process.cwd(), configuration.distFolder || defaults.distFolder);
  const plugins = module.exports.setupPlugins(environment, configuration.indexFile, configuration.icons, configuration.plugins);
  const version = JSON.stringify(environment.version);
  const cssPipeline = module.exports.cssPipeline(env);

  return {
    entry: configuration.entries,
    output: {filename: "[name]", path: destination, publicPath: "/"},
    module: {
      rules: module.exports.setupRules(configuration.transpilers, cssPipeline, version)
    },
    resolve: {extensions: module.exports.setupResolvers(configuration.transpilers)},
    plugins,
    externals: configuration.externals,
    devServer: Object.assign(
      {
        contentBase: destination,
        historyApiFallback: true,
        compress: true,
        hot: true
      },
      module.exports.setupDevServer(configuration.host, configuration.port, configuration.https)
    )
  };
};
