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
  alt: 'The Environments page of the Spawner dashboard: feat-comments building, feat-search started by an agent and ready, feat-login asleep, main and another feat-login ready, each with its source, its owner, its memory and its lifecycle.',
  caption: 'Two projects, one environment started by an agent, one building. Screenshot of a local install.',
};

/** The screenshot at its full size, as WebP: what the "full size" link opens, and what structured data points to. */
export async function fullSize(image: ImageMetadata): Promise<string> {
  return (await getImage({ src: image, format: 'webp' })).src;
}
