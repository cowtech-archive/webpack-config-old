import { Configuration } from './configuration';
export declare function normalizeIncludePath(path: string): string;
export declare function setupRules(configuration: Configuration, cssPipeline: any, version: string): any[];
export declare function setupResolvers(configuration: Configuration): Array<string>;
