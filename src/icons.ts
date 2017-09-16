import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as cheerio from 'cheerio';

import {Configuration, IconsLoader, loadConfigurationEntry} from './configuration';

export function loadSVGIcon(path: string, tag: string): Cheerio{
  const icon: Cheerio = cheerio.load(readFileSync(path, 'utf-8'))('svg');

  icon.attr('id', tag);
  for(const attr of ['xmlns', 'width', 'height'])
    icon.removeAttr(attr);

  return icon;
}

export function iconToString(icon: Cheerio): string{
  // Save the definition - as any is needed since .wrap is not in the type definitions yet
  return (icon as any).wrap('<div/>').parent().html().replace(/\n/mg, '').replace(/^\s+/mg, '');
}

export function fontAwesomeLoader(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons{
  const library: CheerioStatic = cheerio.load(readFileSync(resolve(process.cwd(), loaderConfiguration.fontAwesomePath), 'utf-8'));

  const icons: Icons = {
    prefix: loaderConfiguration.prefix,
    tags: {},
    definitions: ''
  };

  icons.tags = library('symbol[id^=icon-]').toArray().reduce<{[key: string]: string}>((accu: {[key: string]: string}, dom: CheerioElement, index: number) => {
    const icon: Cheerio = library(dom);
    const name: string = icon.attr('id').replace(/^icon-/g, '');
    const tag: string = `i${index}`;

    icon.attr('id', tag);
    icon.find('title').remove();
    for(const attr of ['xmlns', 'width', 'height'])
      icon.removeAttr(attr);

    if(toLoad.includes(name)){
      // Save the definition - as any is needed since .wrap is not in the type definitions yet
      icons.definitions += iconToString(icon);
      accu[name] = tag;
    }

    return accu;
  }, {});

  return icons;
}

export function materialLoader(toLoad: Array<string>, loaderConfiguration?: IconsLoader): Icons{
  const icons: Icons = {
    prefix: loaderConfiguration.prefix,
    tags: {},
    definitions: ''
  };

  icons.tags = toLoad.reduce<{[key: string]: string}>((accu: {[key: string]: string}, entry: string, index: number) => {
    if(entry.endsWith(':custom'))
      return accu;

    if(!entry.includes(':'))
      entry += ':action';

    const [name, category]: Array<string> = entry.split(':');
    const tag: string = `i${index}`;
    const svgFile: string = resolve(process.cwd(), `node_modules/material-design-icons/${category}/svg/production/ic_${name.replace(/-/g, '_')}_48px.svg`);

    // Load the file and manipulate it
    icons.definitions += iconToString(loadSVGIcon(svgFile, tag));
    accu[name] = tag;

    return accu;
  }, {});

  return icons;
}

export interface Icons{
  prefix: string;
  tags: {[key: string]: string};
  definitions: string;
}

export function loadIcons(configuration: Configuration): Icons{
  let icons: Icons = null;

  const toLoad: Array<string> = loadConfigurationEntry('icons', configuration);
  const rawIconsLoader: string | IconsLoader = loadConfigurationEntry('iconsLoader', configuration);
  const iconsLoader: IconsLoader = typeof rawIconsLoader === 'string' ? {id: rawIconsLoader} : rawIconsLoader;

  switch(iconsLoader.id.toLowerCase()){
    case 'fontawesome':
      icons = fontAwesomeLoader(toLoad, iconsLoader);
      break;
    case 'material':
      icons = materialLoader(toLoad, iconsLoader);
      break;
  }

  if(typeof iconsLoader.afterHook === 'function')
    icons = iconsLoader.afterHook(icons);

  return icons;
}
