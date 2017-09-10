import { Configuration } from './configuration';
export interface Icons {
    prefix: string;
    tags: {
        [key: string]: string;
    };
    definitions: string;
}
export declare function loadIcons(configuration: Configuration): Icons;
