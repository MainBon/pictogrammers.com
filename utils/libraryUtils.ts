import fs from 'node:fs/promises';
import { join } from 'node:path';
import getConfig from 'next/config';
import slugify from 'slugify';

import { IconLibraries, IconLibraryIcon } from '../interfaces/icons';
import { ContributorProps } from '../interfaces/contributor';

import allContributors from '../public/contributors/contributors.json';

const { publicRuntimeConfig: config } = getConfig();
const { libraries: { icons: iconLibraries = [] } } = config;

interface SlugInterface {
  contributorSlugs: string[];
  iconSlugs: string[];
  versionSlugs: string[];
}

export const getAllLibraryPaths = async () => {
  const allIcons = await iconLibraries.reduce(async (prevPromise: Promise<string[]>, library: IconLibraries) => {
    let output = await prevPromise;

    const { i: icons, t: categories } = JSON.parse(await fs.readFile(join(process.cwd(), `public/libraries/${library.id}.json`), 'utf-8'));
    const { contributorSlugs, iconSlugs, versionSlugs } = icons.reduce((output: SlugInterface, icon: IconLibraryIcon) => {
      output.iconSlugs.push(`${library.id}/icon/${icon.n}`);

      const versionSlug = `${library.id}/version/${icon.v}`;
      if (!output.versionSlugs.includes(versionSlug)) {
        output.versionSlugs.push(versionSlug);
      }

      const contributor = allContributors.contributors.find((contributor: ContributorProps) => contributor.id === icon.a);
      if (contributor) {
        const contributorSlug = `${library.id}/author/${slugify(contributor.github, { lower: true })}`;
        if (!output.contributorSlugs.includes(contributorSlug)) {
          output.contributorSlugs.push(contributorSlug);
        }
      }

      return output;
    }, { contributorSlugs: [], iconSlugs: [], versionSlugs: [] });
  
    const categorySlugs = categories.map((category: string) => `${library.id}/category/${slugify(category, { lower: true })}`);

    output = [
      ...output,
      ...versionSlugs,
      ...categorySlugs,
      ...contributorSlugs,
      ...iconSlugs
    ];
    return output;
  }, Promise.resolve([]));

  const libraries = iconLibraries.map((library: IconLibraries) => library.id);

  return [ ...libraries, ...allIcons ];
};

export const getIcon = async (library: string, icon: string): Promise<IconLibraryIcon> => {
  const { i: icons } = JSON.parse(await fs.readFile(join(process.cwd(), `public/libraries/${library}.json`), 'utf-8'));
  const iconInfo = icons.find((i: IconLibraryIcon) => i.n === icon);
  return iconInfo;
};
