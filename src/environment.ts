import {resolve} from 'path';
import * as moment from 'moment';

import {Configuration, defaultConfiguration} from './configuration';

export function loadEnvironment(configuration: Configuration): any{
  const packageInfo: any = require(resolve(process.cwd(), './package.json'));
  const environment: string = configuration.hasOwnProperty('environment') ? configuration.environment : defaultConfiguration.environment;
  const swe: boolean = configuration.hasOwnProperty('serviceWorkerEnabled') ? configuration.serviceWorkerEnabled : defaultConfiguration.serviceWorkerEnabled;
  const version: string = configuration.hasOwnProperty('version') ? configuration.version : defaultConfiguration.version;

  if(!packageInfo.site)
    packageInfo.site = {};

  return {
    environment,
    serviceWorkerEnabled: swe,
    version: version || moment.utc().format('YYYYMMDD-HHmmss'),
    ...(packageInfo.site.common || {}),
    ...(packageInfo.site[environment] || {})
  };
}
