// Static album art shipped with the kiosk. Keys are Remote Falcon sequence
// names (`Song.name`, exactly as RF returns them). Values are absolute URLs
// under /artwork/ served from `public/artwork/`.
//
// Add a file to public/artwork/, then add its entry here. Sequences without
// a manifest entry render with no album art (same behavior as when RF
// doesn't populate imageUrl).

export const ARTWORK_MANIFEST: Record<string, string> = {
  "Abracadabra - Lady Gaga": "/artwork/Abracadabra - Lady Gaga.jpg",
  "Back to the Future": "/artwork/Back to the Future.webp",
  "Beetlejuice": "/artwork/Beetlejuice.webp",
  "Burial - Anne Hathaway": "/artwork/Burial - Anne Hathaway.jpg",
  "Burnin' Up - Jonas Brothers": "/artwork/Burnin' Up - Jonas Brothers.webp",
  "Dracula - Tame Impala": "/artwork/Dracula - Tame Impala.webp",
  "Enter Sandman - Metallica": "/artwork/Enter Sandman - Metallica.webp",
  "Everybody - Backstreet Boys": "/artwork/Everybody - Backstreet Boys.webp",
  "Gangnam Style - Adam Sandler": "/artwork/Gangnam Style - Adam Sandler.webp",
  "Gangsta's Paradise - Coolio": "/artwork/Gangsta's Paradise - Coolio.webp",
  "Ghost - Rob Thomas": "/artwork/Ghost - Rob Thomas.webp",
  "Ghostbusters - Ray Parker Jr": "/artwork/Ghostbusters - Ray Parker Jr.webp",
  "Haunted Mansion & This is Halloween - Intro": "/artwork/Haunted Mansion & This is Halloween - Intro.jpg",
  "Houdini Thriller Breath Mashup - Joshuel Mashups": "/artwork/Houdini Thriller Breath Mashup - Joshuel Mashups.jpg",
  "James Bond Collection": "/artwork/James Bond Collection.jpg",
  "Madame Leotas Swinging Wake - Disneyland": "/artwork/Madame Leotas Swinging Wake - Disneyland.webp",
  "Monster - Skillet": "/artwork/Monster - Skillet.webp",
  "Ozzy Osbourne Medley": "/artwork/Ozzy Osbourne Medley.webp",
  "Patient Zero - Taylor Swift": "/artwork/Patient Zero - Taylor Swift.webp",
  "Rotten to the Core - Descendants": "/artwork/Rotten to the Core - Descendants.webp",
  "Sleepy Hollow TV Show Theme": "/artwork/Sleepy Hollow TV Show Theme.webp",
  "Spooky Scary Skeletons - Undead Tombstone Remix": "/artwork/Spooky Scary Skeletons - Undead Tombstone Remix.webp",
  "The Addams Family Theme": "/artwork/The Addams Family Theme.webp",
  "The Dead Dance - Lady Gaga": "/artwork/The Dead Dance - Lady Gaga.webp",
  "The Fate of Ophelia - Taylor Swift": "/artwork/The Fate of Ophelia - Taylor Swift.webp",
  "This is Halloween - Marilyn Manson": "/artwork/This is Halloween - Marilyn Manson.webp",
  "Thriller - Michael Jackson": "/artwork/Thriller - Michael Jackson.webp",
  "Twisting The Knife - Ice Nine Kills": "/artwork/Twisting The Knife - Ice Nine Kills.webp",
  "Whos Afraid of Little Old Me - Taylor Swift": "/artwork/Whos Afraid of Little Old Me - Taylor Swift.webp",
};

export function lookupArtwork(sequenceName: string): string | null {
  return ARTWORK_MANIFEST[sequenceName] ?? null;
}
