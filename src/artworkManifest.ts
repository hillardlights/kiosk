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
  "Dracula - Tame Impala": "/artwork/Dracula - Tame Impala.webp",
  "Gangsta's Paradise - Coolio": "/artwork/Gangsta's Paradise - Coolio.webp",
  "James Bond Collection": "/artwork/James Bond Collection.jpg",
  "Madame Leotas Swinging Wake - Disneyland": "/artwork/Madame Leotas Swinging Wake - Disneyland.webp",
  "Monster - Skillet": "/artwork/Monster - Skillet.webp",
  "Rotten to the Core - Descendants": "/artwork/Rotten to the Core - Descendants.webp",
};

export function lookupArtwork(sequenceName: string): string | null {
  return ARTWORK_MANIFEST[sequenceName] ?? null;
}
