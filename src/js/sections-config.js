/** Public gallery sections ↔ admin tabs */
export const SECTION_CATALOG = [
  { key: 'featured', sectionId: 'section-featured', adminTab: 'featured', defaultLabel: 'Featured' },
  { key: 'timeline', sectionId: 'section-timeline', adminTab: 'timeline', defaultLabel: 'Our Story' },
  { key: 'thennow', sectionId: 'section-then-now', adminTab: 'thennow', defaultLabel: 'Then & Now' },
  { key: 'wedding', sectionId: 'section-wedding', adminTab: 'wedding', defaultLabel: 'Wedding' },
  { key: 'highlights', sectionId: 'section-highlights', adminTab: 'highlights', defaultLabel: 'Highlights' },
  { key: 'quotes', sectionId: 'section-quotes', adminTab: 'quotes', defaultLabel: 'Quotes' },
  { key: 'places', sectionId: 'section-places', adminTab: 'places', defaultLabel: 'Places' },
  { key: 'letter', sectionId: 'section-letter', adminTab: 'letter', defaultLabel: 'Letter' },
  { key: 'song', sectionId: 'section-song', adminTab: 'song', defaultLabel: 'Our Song' },
  { key: 'messages', sectionId: 'section-messages', adminTab: 'messages', defaultLabel: 'Messages' },
  { key: 'videos', sectionId: 'section-videos', adminTab: 'videos', defaultLabel: 'Videos' },
  { key: 'gallery', sectionId: 'section-gallery', adminTab: 'gallery', defaultLabel: 'Gallery' },
];

export function catalogEntry(key) {
  return SECTION_CATALOG.find((s) => s.key === key);
}

export function defaultNavTabs() {
  return SECTION_CATALOG.map((s) => ({
    key: s.key,
    label: s.defaultLabel,
    enabled: true,
  }));
}

export function resolveNavTabs(galleryData) {
  const saved = galleryData?.navTabs;
  if (!saved?.length) return defaultNavTabs();

  const catalogKeys = new Set(SECTION_CATALOG.map((s) => s.key));
  const ordered = saved
    .filter((t) => catalogKeys.has(t.key))
    .map((t) => {
      const cat = catalogEntry(t.key);
      return {
        key: t.key,
        label: t.label?.trim() || cat.defaultLabel,
        enabled: t.enabled !== false,
      };
    });

  SECTION_CATALOG.forEach((s) => {
    if (!ordered.some((t) => t.key === s.key)) {
      ordered.push({ key: s.key, label: s.defaultLabel, enabled: true });
    }
  });

  return ordered;
}

export function enabledNavTabs(galleryData) {
  return resolveNavTabs(galleryData).filter((t) => t.enabled);
}

export function isNavTabEnabled(galleryData, key) {
  const tab = resolveNavTabs(galleryData).find((t) => t.key === key);
  return tab?.enabled !== false;
}
