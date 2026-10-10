/**
 * The screenshots of the dashboard the home page shows, one per theme, with
 * the text that describes them. When a screenshot is taken again, its alt
 * text and caption follow what it shows.
 */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import dark from '../assets/screenshots/dashboard-environments-dark.png';
import light from '../assets/screenshots/dashboard-environments-light.png';

export const dashboard = {
  light,
  dark,
  alt: 'The Environments page of the Spawner dashboard, version 2.2.0: five environments of two projects, owned by Ben, Lina and Ada. Ben\'s feat-comments is building and his feat-login, started by his coding agent, is ready; Lina\'s feat-login is asleep; Ada\'s feat-search, started by her agent, and main are ready. Each row shows its source, its owner, its memory and its lifecycle.',
  caption: 'Two projects, three people and their coding agents: one environment building, one asleep. Screenshot of a local install.',
};

/** The screenshot at its full size, as WebP: what the "full size" link opens, and what structured data points to. */
export async function fullSize(image: ImageMetadata): Promise<string> {
  return (await getImage({ src: image, format: 'webp' })).src;
}
