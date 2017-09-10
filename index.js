'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var sass = require('sass');
var webpack = require('webpack');
var cheerio = require('cheerio');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */



var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var defaultConfiguration = {
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
        includePaths: ['lazier.sass', 'ribbon.css', 'normalize.css'].map(function (l) { return "node_modules/" + l; }),
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

function loadEnvironment(configuration) {
    var packageInfo = require(path.resolve(process.cwd(), './package.json'));
    var environment = configuration.hasOwnProperty('environment') ? configuration.environment : defaultConfiguration.environment;
    var swe = configuration.hasOwnProperty('serviceWorkerEnabled') ? configuration.serviceWorkerEnabled : defaultConfiguration.serviceWorkerEnabled;
    var version = configuration.hasOwnProperty('version') ? configuration.version : defaultConfiguration.version;
    if (!packageInfo.site)
        packageInfo.site = {};
    return __assign({ environment: environment, serviceWorkerEnabled: swe, version: version || moment.utc().format('YYYYMMDD-HHmmss') }, (packageInfo.site.common || {}), (packageInfo.site[environment] || {}));
}

var postcssPlugins = function (toLoad, browsersWhiteList, selectorBlackList) {
    var plugins = [];
    if (toLoad.includes('remove-selectors'))
        plugins.push(require('postcss-remove-selectors')({ selectors: selectorBlackList || defaultConfiguration.scss.selectorBlackList }));
    if (toLoad.includes('cssnext'))
        plugins.push(require('postcss-cssnext')({ browsers: browsersWhiteList || defaultConfiguration.scss.browsersWhiteList, cascade: false }));
    if (toLoad.includes('discard-comments'))
        plugins.push(require('postcss-discard-comments')({ removeAll: true }));
    for (var _i = 0, _a = toLoad.filter(function (a) { return a && typeof a !== 'string'; }); _i < _a.length; _i++) {
        var additional = _a[_i];
        plugins.push(additional);
    }
    return plugins;
};
function setupCssPipeline(configuration) {
    var options = configuration.scss || {};
    var defaultOptions = defaultConfiguration.scss;
    var plugins = options.hasOwnProperty('plugins') ? options.plugins : defaultOptions.plugins;
    var browsersWhiteList = options.hasOwnProperty('browsersWhiteList') ? options.browsersWhiteList : defaultOptions.browsersWhiteList;
    var selectorBlackList = options.hasOwnProperty('selectorBlackList') ? options.selectorBlackList : defaultOptions.selectorBlackList;
    var pipeline = [
        'css-loader',
        { loader: 'postcss-loader', options: { plugins: function () { return postcssPlugins(plugins, browsersWhiteList, selectorBlackList); } } },
        { loader: 'sass-loader', options: {
                outputStyle: 'compressed',
                functions: { svg: function (param) { return new sass.types.String("url('data:image/svg+xml;utf8," + fs.readFileSync(param.getValue()) + "')"); } },
                includePaths: defaultConfiguration.scss.includePaths
            }
        }
    ];
    if (configuration.environment !== 'production')
        pipeline.unshift('style-loader');
    return pipeline;
}

var fontAwesomeLoader = function (toLoad, loaderConfiguration) {
    var library = cheerio.load(fs.readFileSync(path.resolve(process.cwd(), loaderConfiguration.fontAwesomePath), 'utf-8'));
    var icons = {
        prefix: loaderConfiguration.prefix,
        tags: {},
        definitions: ''
    };
    icons.tags = library('symbol[id^=icon-]').toArray().reduce(function (accu, dom, index) {
        var icon = library(dom);
        var name = icon.attr('id').replace(/^icon-/g, '');
        var tag = "i" + index;
        icon.attr('id', tag);
        icon.find('title').remove();
        if (toLoad.includes(name)) {
            // Save the definition - as any is needed since .wrap is not in the type definitions yet
            icons.definitions += icon.wrap('<div/>').parent().html().replace(/\n/mg, '').replace(/^\s+/mg, '');
            accu[name] = tag;
        }
        return accu;
    }, {});
    return icons;
};
var materialLoader = function (toLoad, loaderConfiguration) {
    var icons = {
        prefix: loaderConfiguration.prefix,
        tags: {},
        definitions: ''
    };
    icons.tags = toLoad.reduce(function (accu, entry, index) {
        if (!entry.includes(':'))
            entry += ':action';
        var _a = entry.split(':'), name = _a[0], category = _a[1];
        var tag = "i" + index;
        var svgFile = path.resolve(process.cwd(), "node_modules/material-design-icons/" + category + "/svg/production/ic_" + name.replace(/-/g, '_') + "_48px.svg");
        // Load the file and manipulate it
        var icon = cheerio.load(fs.readFileSync(svgFile, 'utf-8'))('svg');
        icon.attr('id', tag);
        for (var _i = 0, _b = ['xmlns', 'width', 'height']; _i < _b.length; _i++) {
            var attr = _b[_i];
            icon.removeAttr(attr);
        }
        // Save the definition - as any is needed since .wrap is not in the type definitions yet
        icons.definitions += icon.wrap('<div/>').parent().html().replace(/\n/mg, '').replace(/^\s+/mg, '');
        accu[name] = tag;
        return accu;
    }, {});
    return icons;
};
function loadIcons(configuration) {
    var icons = null;
    var toLoad = configuration.hasOwnProperty('icons') ? configuration.icons : defaultConfiguration.icons;
    var rawIconsLoader = configuration.hasOwnProperty('iconsLoader') ? configuration.iconsLoader : defaultConfiguration.iconsLoader;
    var iconsLoader = typeof rawIconsLoader === 'string' ? { id: rawIconsLoader } : rawIconsLoader;
    switch (iconsLoader.id.toLowerCase()) {
        case 'fontawesome':
            icons = fontAwesomeLoader(toLoad, iconsLoader);
            break;
        case 'material':
            icons = materialLoader(toLoad, iconsLoader);
            break;
    }
    return icons;
}

var HtmlWebpackPlugin = require('html-webpack-plugin');
var GraphBundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var BabiliPlugin = require('babili-webpack-plugin');
function setupPlugins(configuration, environment) {
    var env = configuration.environment;
    var options = configuration.pluginsOptions || {};
    var defaultOptions = defaultConfiguration.pluginsOptions;
    var indexFile = configuration.hasOwnProperty('indexFile') ? configuration.indexFile : defaultConfiguration.indexFile;
    var concatenate = options.hasOwnProperty('concatenate') ? options.concatenate : defaultOptions.concatenate;
    var minify = options.hasOwnProperty('minify') ? options.minify : defaultOptions.minify;
    var hotModuleReload = options.hasOwnProperty('hotModuleReload') ? options.hotModuleReload : defaultOptions.hotModuleReload;
    var commonChunks = options.hasOwnProperty('commonChunks') ? options.commonChunks : defaultOptions.commonChunks;
    var sizeAnalyzerServer = options.hasOwnProperty('sizeAnalyzerServer') ? options.sizeAnalyzerServer : defaultOptions.sizeAnalyzerServer;
    var plugins = [
        new webpack.DefinePlugin({
            'env': JSON.stringify(environment),
            'version': JSON.stringify(environment.version),
            'ICONS': JSON.stringify(loadIcons(configuration)),
            'process.env': { NODE_ENV: JSON.stringify(env) } // This is needed by React for production mode
        })
    ];
    if (indexFile)
        plugins.push(new HtmlWebpackPlugin({ template: indexFile, minify: { collapseWhitespace: true }, inject: false, excludeAssets: [/\.js$/] }));
    if (concatenate)
        plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
    if (env === 'production') {
        if (minify)
            plugins.push(new BabiliPlugin({ mangle: false })); // PI: Remove mangle when Safari 10 is dropped: https://github.com/mishoo/UglifyJS2/issues/1753
    }
    else {
        if (hotModuleReload)
            plugins.push(new webpack.HotModuleReplacementPlugin());
        if (commonChunks)
            plugins.push(new webpack.optimize.CommonsChunkPlugin({ name: 'webpack-bootstrap.js' }));
        if (sizeAnalyzerServer && path.basename(process.argv[1]) === 'webpack-dev-server')
            plugins.push(new GraphBundleAnalyzerPlugin({ openAnalyzer: false }));
    }
    if (Array.isArray(configuration.plugins))
        plugins.push.apply(plugins, configuration.plugins);
    return plugins;
}

function setupRules(configuration, cssPipeline, version) {
    var babel = configuration.hasOwnProperty('babel') ? configuration.babel : defaultConfiguration.babel;
    var transpilers = configuration.hasOwnProperty('transpilers') ? configuration.transpilers : defaultConfiguration.transpilers;
    var babelEnv = ['env', { targets: { browsers: babel.browsersWhiteList }, exclude: babel.exclude }];
    var rules = [
        { test: /\.scss$/, use: cssPipeline },
        {
            test: /\.(?:png|jpg|svg)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: { name: '[path][name].[ext]', outputPath: function (p) { return "" + p.replace('src/', ''); }, publicPath: function (p) { return "/" + p.replace('src/', ''); } }
                }
            ]
        },
        {
            test: /manifest\.json$/,
            use: [{ loader: 'file-loader', options: { name: 'manifest.json' } }, { loader: 'string-replace-loader', query: { search: '@version@', replace: version } }]
        }
    ];
    if (transpilers.includes('babel')) {
        if (transpilers.includes('inferno')) {
            rules.unshift({
                test: /\.jsx$/, exclude: /node_modules/,
                use: { loader: 'babel-loader', options: { presets: ['react', babelEnv], plugins: ['syntax-jsx', ['inferno', { imports: true }]] } }
            });
        }
        else if (transpilers.includes('react'))
            rules.unshift({ test: /\.jsx$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['react', babelEnv] } } });
        rules.unshift({ test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: [babelEnv] } } });
    }
    if (transpilers.includes('typescript')) {
        if (transpilers.includes('inferno')) {
            rules.unshift({
                test: /\.tsx$/,
                use: [
                    { loader: 'babel-loader', options: { presets: [babelEnv], plugins: ['syntax-jsx', ['inferno', { imports: true }]] } },
                    { loader: 'awesome-typescript-loader' }
                ]
            });
        }
        else if (transpilers.includes('react'))
            rules.unshift({ test: /\.tsx$/, loader: 'awesome-typescript-loader' });
        rules.unshift({ test: /\.ts$/, loader: 'awesome-typescript-loader' });
    }
    return rules;
}
function setupResolvers(configuration) {
    var transpilers = configuration.hasOwnProperty('transpilers') ? configuration.transpilers : defaultConfiguration.transpilers;
    var extensions = ['.json', '.js'];
    if (transpilers.includes('babel'))
        extensions.push('.jsx');
    if (transpilers.includes('typescript'))
        extensions.push('.ts', '.tsx');
    return extensions;
}

function setupServer(configuration) {
    var server = configuration.server || {};
    var defaultServer = defaultConfiguration.server;
    var https = server.hasOwnProperty('https') ? server.https : defaultServer.https;
    var config = {
        host: server.host || defaultServer.host,
        port: server.port || defaultServer.port,
        historyApiFallback: server.hasOwnProperty('historyApiFallback') ? server.historyApiFallback : defaultServer.historyApiFallback,
        compress: server.hasOwnProperty('compress') ? server.compress : defaultServer.compress,
        hot: server.hasOwnProperty('hot') ? server.hot : defaultServer.hot
    };
    if (https) {
        config.https = {
            key: https.key || fs.readFileSync(path.resolve(process.cwd(), defaultServer.https.key)),
            cert: https.cert || fs.readFileSync(path.resolve(process.cwd(), defaultServer.https.cert))
        };
    }
    return config;
}
function setup(env, configuration, afterHook) {
    if (!env)
        env = 'development';
    if (configuration.environment)
        configuration.environment = env;
    var environment = loadEnvironment(configuration);
    var destination = path.resolve(process.cwd(), configuration.distFolder || defaultConfiguration.distFolder);
    var version = JSON.stringify(environment.version);
    var cssPipeline = setupCssPipeline(configuration);
    var plugins = setupPlugins(configuration, environment);
    var config = {
        entry: configuration.entries || defaultConfiguration.entries,
        output: { filename: '[name]', path: destination, publicPath: '/' },
        module: {
            rules: setupRules(configuration, cssPipeline, version)
        },
        resolve: { extensions: setupResolvers(configuration) },
        plugins: plugins,
        externals: configuration.externals,
        devtool: env === 'development' ? (configuration.sourceMapsType || defaultConfiguration.sourceMapsType) : null,
        devServer: __assign({ contentBase: destination }, setupServer(configuration))
    };
    if (typeof afterHook === 'function')
        config = afterHook(config);
    return config;
}

exports.setupServer = setupServer;
exports.setup = setup;
exports.defaultConfiguration = defaultConfiguration;
exports.loadEnvironment = loadEnvironment;
exports.loadIcons = loadIcons;
exports.setupPlugins = setupPlugins;
exports.setupRules = setupRules;
exports.setupResolvers = setupResolvers;
exports.setupCssPipeline = setupCssPipeline;
