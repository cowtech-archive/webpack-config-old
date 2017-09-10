import * as sass from 'sass';
import { Configuration } from './configuration';
export declare function setupCssPipeline(configuration: Configuration): (string | {
    loader: string;
    options: {
        plugins: () => any[];
    };
} | {
    loader: string;
    options: {
        outputStyle: string;
        functions: {
            svg: (param: sass.Value) => sass.types.String;
        };
        includePaths: string[];
    };
})[];
