// Static album art shipped with the kiosk. Keys are Remote Falcon sequence
// names (`Song.name`, exactly as RF returns them). Values are absolute URLs
// under /artwork/ served from `public/artwork/`.
//
// Add a file to public/artwork/, then add its entry here. Sequences without
// a manifest entry render with no album art (same behavior as when RF
// doesn't populate imageUrl).

export const ARTWORK_MANIFEST: Record<string, string> = {
  "Abracadabra - Lady Gaga": "/artwork/Abracadabra - Lady Gaga.jpg",
  "Back to the Future": "/artwork/Back to the Future.jpg",
  "Burial - Anne Hathaway": "/artwork/Burial - Anne Hathaway.jpg",
  "Burnin' Up - Jonas Brothers": "/artwork/Burnin' Up - Jonas Brothers.webp",
  "James Bond Collection": "/artwork/James Bond Collection.jpg",
};

export function lookupArtwork(sequenceName: string): string | null {
  return ARTWORK_MANIFEST[sequenceName] ?? null;
}
