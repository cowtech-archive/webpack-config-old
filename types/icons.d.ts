/// <reference types="cheerio" />
import { Configuration, IconsLoader } from './configuration';
export declare function loadSVGIcon(path: string, tag: string): Cheerio;
export declare function iconToString(icon: Cheerio): string;
export declare function fontAwesomeLoader(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons;
export declare function materialLoader(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons;
export interface Icons {
    prefix: string;
    tags: {
        [key: string]: string;
    };
    definitions: string;
}
export declare function loadIcons(configuration: Configuration): Icons;
