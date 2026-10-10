import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { CHANGELOG } from './docs-pages';

/** The pages of docs/, in sidebar order. */
export async function docPages(): Promise<CollectionEntry<'docs'>[]> {
  const entries = await getCollection('docs', (entry) => entry.id.startsWith('docs/'));
  return entries.sort((a, b) => (a.data.sidebar.order ?? 100) - (b.data.sidebar.order ?? 100));
}

/** The changelog's entry. */
export async function changelogPage(): Promise<CollectionEntry<'docs'> | undefined> {
  return getEntry('docs', CHANGELOG.id);
}
