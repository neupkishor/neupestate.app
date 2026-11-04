// Build the canonical listing detail route from its slug and ID.
export function listingPath(listing: { id?: unknown; slug?: unknown; seo?: { slug?: unknown } }): string {
  const id = String(listing.id ?? '');
  const rawSlug = String(listing.slug ?? listing.seo?.slug ?? id);
  const slug = rawSlug.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `/listings/${slug || id}--${encodeURIComponent(id)}`;
}
