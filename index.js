'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var moment = require('moment');
var sass = require('node-sass');
var webpack = require('webpack');
var cheerio = require('cheerio');

const defaultConfiguration = {
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
        includePaths: ['lazier.sass', 'ribbon.css', 'normalize.css'].map(l => `node_modules/${l}`),
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
    serviceWorker: {
        source: 'sw.js',
        dest: 'sw.js',
        patterns: ['**/*.{html,js,json,css}', 'images/favicon.png'],
        ignores: ['sw.js', 'js/workbox.js']
    }
};
function loadConfigurationEntry(key, configuration, defaults = defaultConfiguration) {
    return configuration.hasOwnProperty(key) ? configuration[key] : defaults[key];
}

function loadEnvironment(configuration) {
    const packageInfo = require(path.resolve(process.cwd(), './package.json'));
    const environment = loadConfigurationEntry('environment', configuration);
    const version = loadConfigurationEntry('version', configuration);
    const sw = loadConfigurationEntry('serviceWorker', configuration);
    if (!packageInfo.site)
        packageInfo.site = {};
    return Object.assign({ environment, serviceWorkerEnabled: sw !== false, version: version || moment.utc().format('YYYYMMDD-HHmmss') }, (packageInfo.site.common || {}), (packageInfo.site[environment] || {}));
}

const postcssPlugins = function (toLoad, browsersWhiteList, selectorBlackList) {
    const plugins = [];
    if (toLoad.includes('remove-selectors'))
        plugins.push(require('postcss-remove-selectors')({ selectors: selectorBlackList || defaultConfiguration.scss.selectorBlackList }));
    if (toLoad.includes('cssnext'))
        plugins.push(require('postcss-cssnext')({ browsers: browsersWhiteList || defaultConfiguration.scss.browsersWhiteList, cascade: false }));
    if (toLoad.includes('discard-comments'))
        plugins.push(require('postcss-discard-comments')({ removeAll: true }));
    for (const additional of toLoad.filter((a) => a && typeof a !== 'string'))
        plugins.push(additional);
    return plugins;
};
function setupCssPipeline(configuration) {
    const options = configuration.scss || {};
    const defaultOptions = defaultConfiguration.scss;
    const plugins = loadConfigurationEntry('plugins', options, defaultOptions);
    const browsersWhiteList = loadConfigurationEntry('browsersWhiteList', options, defaultOptions);
    const selectorBlackList = loadConfigurationEntry('selectorBlackList', options, defaultOptions);
    const pipeline = [
        'css-loader',
        { loader: 'postcss-loader', options: { plugins: () => postcssPlugins(plugins, browsersWhiteList, selectorBlackList) } },
        { loader: 'sass-loader', options: {
                outputStyle: 'compressed',
                functions: { svg: (param) => new sass.types.String(`url('data:image/svg+xml;utf8,${fs.readFileSync(param.getValue())}')`) },
                includePaths: defaultOptions.includePaths
            }
        }
    ];
    if (configuration.environment !== 'production')
        pipeline.unshift('style-loader');
    return pipeline;
}

const fontAwesomeLoader = function (toLoad, loaderConfiguration) {
    const library = cheerio.load(fs.readFileSync(path.resolve(process.cwd(), loaderConfiguration.fontAwesomePath), 'utf-8'));
    const icons = {
        prefix: loaderConfiguration.prefix,
        tags: {},
        definitions: ''
    };
    icons.tags = library('symbol[id^=icon-]').toArray().reduce((accu, dom, index) => {
        const icon = library(dom);
        const name = icon.attr('id').replace(/^icon-/g, '');
        const tag = `i${index}`;
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
const materialLoader = function (toLoad, loaderConfiguration) {
    const icons = {
        prefix: loaderConfiguration.prefix,
        tags: {},
        definitions: ''
    };
    icons.tags = toLoad.reduce((accu, entry, index) => {
        if (entry.endsWith(':custom'))
            return accu;
        if (!entry.includes(':'))
            entry += ':action';
        const [name, category] = entry.split(':');
        const tag = `i${index}`;
        const svgFile = path.resolve(process.cwd(), `node_modules/material-design-icons/${category}/svg/production/ic_${name.replace(/-/g, '_')}_48px.svg`);
        // Load the file and manipulate it
        const icon = cheerio.load(fs.readFileSync(svgFile, 'utf-8'))('svg');
        icon.attr('id', tag);
        for (const attr of ['xmlns', 'width', 'height'])
            icon.removeAttr(attr);
        // Save the definition - as any is needed since .wrap is not in the type definitions yet
        icons.definitions += icon.wrap('<div/>').parent().html().replace(/\n/mg, '').replace(/^\s+/mg, '');
        accu[name] = tag;
        return accu;
    }, {});
    return icons;
};
function loadIcons(configuration) {
    let icons = null;
    const toLoad = loadConfigurationEntry('icons', configuration);
    const rawIconsLoader = loadConfigurationEntry('iconsLoader', configuration);
    const iconsLoader = typeof rawIconsLoader === 'string' ? { id: rawIconsLoader } : rawIconsLoader;
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

const HtmlWebpackPlugin = require('html-webpack-plugin');
const GraphBundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const BabiliPlugin = require('babili-webpack-plugin');
function setupPlugins(configuration, environment) {
    const env = configuration.environment;
    const options = configuration.pluginsOptions || {};
    const defaultOptions = defaultConfiguration.pluginsOptions;
    const indexFile = loadConfigurationEntry('indexFile', configuration);
    const concatenate = loadConfigurationEntry('concatenate', options, defaultOptions);
    const minify = loadConfigurationEntry('minify', options, defaultOptions);
    const hotModuleReload = loadConfigurationEntry('hotModuleReload', options, defaultOptions);
    const commonChunks = loadConfigurationEntry('commonChunks', options, defaultOptions);
    const sizeAnalyzerServer = loadConfigurationEntry('sizeAnalyzerServer', options, defaultOptions);
    const plugins = [
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
        plugins.push(...configuration.plugins);
    return plugins;
}

function setupRules(configuration, cssPipeline, version) {
    const babel = loadConfigurationEntry('babel', configuration);
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    const babelEnv = ['env', { targets: { browsers: babel.browsersWhiteList }, exclude: babel.exclude }];
    const rules = [
        { test: /\.scss$/, use: cssPipeline },
        {
            test: /\.(?:png|jpg|svg)$/,
            use: [
                {
                    loader: 'file-loader',
                    options: { name: '[path][name].[ext]', outputPath: (p) => `${p.replace('src/', '')}`, publicPath: (p) => `/${p.replace('src/', '')}` }
                }
            ]
        },
        {
            test: /manifest\.json$/,
            use: [{ loader: 'file-loader', options: { name: 'manifest.json' } }, { loader: 'string-replace-loader', query: { search: '@version@', replace: version } }]
        },
        { test: /robots\.txt$/, use: [{ loader: 'file-loader', options: { name: 'robots\.txt' } }] }
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
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    const extensions = ['.json', '.js'];
    if (transpilers.includes('babel'))
        extensions.push('.jsx');
    if (transpilers.includes('typescript'))
        extensions.push('.ts', '.tsx');
    return extensions;
}

const WorkboxPlugin = require('workbox-webpack-plugin');
function setupServiceWorker(config, configuration) {
    const sw = loadConfigurationEntry('serviceWorker', configuration);
    const distFolder = loadConfigurationEntry('distFolder', configuration);
    const source = loadConfigurationEntry('source', sw, defaultConfiguration.serviceWorker);
    const dest = loadConfigurationEntry('dest', sw, defaultConfiguration.serviceWorker);
    const globPatterns = loadConfigurationEntry('patterns', sw, defaultConfiguration.serviceWorker);
    const globIgnores = loadConfigurationEntry('ignores', sw, defaultConfiguration.serviceWorker);
    const transpilers = loadConfigurationEntry('transpilers', configuration);
    if (sw === false)
        return config;
    config.entry[dest] = sw.template || `./src/js/service-worker.${transpilers.includes('typescript') ? 'ts' : 'js'}`;
    config.module.rules.unshift({
        test: /workbox-sw\.[a-z]+\..+\.js$/,
        use: [{ loader: 'file-loader', options: { name: 'js/workbox.js' } }, { loader: 'babel-loader', options: { presets: ['minify', { comments: false }] } }]
    });
    config.plugins.push(new WorkboxPlugin({ swSrc: `${distFolder}/${source}`, swDest: `${distFolder}/${dest}`, globPatterns, globIgnores }));
    return config;
}

function setupServer(configuration) {
    const server = configuration.server || {};
    const defaultServer = defaultConfiguration.server;
    const https = loadConfigurationEntry('https', server, defaultServer);
    const config = {
        host: loadConfigurationEntry('host', server, defaultServer),
        port: loadConfigurationEntry('port', server, defaultServer),
        historyApiFallback: loadConfigurationEntry('historyApiFallback', server, defaultServer),
        compress: loadConfigurationEntry('compress', server, defaultServer),
        hot: loadConfigurationEntry('hot', server, defaultServer)
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
    if (!configuration.environment)
        configuration.environment = env;
    const environment = loadEnvironment(configuration);
    const destination = path.resolve(process.cwd(), configuration.distFolder || defaultConfiguration.distFolder);
    const version = JSON.stringify(environment.version);
    const cssPipeline = setupCssPipeline(configuration);
    const plugins = setupPlugins(configuration, environment);
    let config = {
        entry: configuration.entries || defaultConfiguration.entries,
        output: { filename: '[name]', path: destination, publicPath: '/' },
        module: {
            rules: setupRules(configuration, cssPipeline, version)
        },
        resolve: { extensions: setupResolvers(configuration) },
        plugins,
        externals: configuration.externals,
        devtool: env === 'development' ? (configuration.sourceMapsType || defaultConfiguration.sourceMapsType) : false,
        devServer: Object.assign({ contentBase: destination }, setupServer(configuration))
    };
    if (env === 'production')
        config = setupServiceWorker(config, configuration);
    if (typeof afterHook === 'function')
        config = afterHook(config);
    return config;
}

exports.setupServer = setupServer;
exports.setup = setup;
exports.defaultConfiguration = defaultConfiguration;
exports.loadConfigurationEntry = loadConfigurationEntry;
exports.loadEnvironment = loadEnvironment;
exports.loadIcons = loadIcons;
exports.setupPlugins = setupPlugins;
exports.setupRules = setupRules;
exports.setupResolvers = setupResolvers;
exports.setupCssPipeline = setupCssPipeline;
