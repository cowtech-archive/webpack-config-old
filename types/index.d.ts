/// <reference types="webpack" />
import * as webpack from 'webpack';
import { Configuration } from './configuration';
export declare type Hook = (configuration: webpack.Configuration) => webpack.Configuration;
export * from './configuration';
export * from './environment';
export * from './icons';
export * from './plugins';
export * from './rules';
export * from './scss';
export declare function setupServer(configuration: Configuration): any;
export declare function setup(env: string, configuration: Configuration, afterHook?: Hook): webpack.Configuration;
