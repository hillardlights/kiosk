// Auto-fetch album/cover art from the iTunes Search API for songs whose
// Remote Falcon record has no imageUrl. Results are cached in localStorage
// keyed by song name so we only hit the network once per song per kiosk.
// The service worker's runtimeCaching (see vite.config.ts) also caches the
// artwork images themselves, so a warm kiosk serves art with no external
// requests at all.
//
// iTunes Search API is CORS-friendly and requires no API key. Rate limit
// is soft ~20 req/min; we throttle bulk lookups to stay well under it.

const CACHE_KEY = "kiosk.artworkCache.v1";
const REQUEST_TIMEOUT_MS = 4000;

type CacheEntry = {
  // Populated URL when iTunes matched, `null` when we searched and found
  // nothing (so we don't keep re-querying). `undefined` return from
  // `cachedArtwork` means "never searched — try it".
  url: string | null;
  at: number;
};

type Cache = Record<string, CacheEntry>;

function readCache(): Cache {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Cache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Cache): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or blocked — no-op, in-memory state still holds.
  }
}

export function cachedArtwork(songName: string): string | null | undefined {
  const entry = readCache()[songName];
  return entry ? entry.url : undefined;
}

export function rememberArtwork(songName: string, url: string | null): void {
  const cache = readCache();
  cache[songName] = { url, at: Date.now() };
  writeCache(cache);
}

// Split "Title - Artist" style display names for a better query. When RF
// doesn't populate the artist field (currently zero of 39 sequences),
// this recovers the artist token from the title so iTunes has more to
// match on.
function splitTitleArtist(displayName: string): { title: string; artist: string | null } {
  const idx = displayName.indexOf(" - ");
  if (idx <= 0) return { title: displayName, artist: null };
  return {
    title: displayName.slice(0, idx).trim(),
    artist: displayName.slice(idx + 3).trim() || null,
  };
}

// iTunes' artworkUrl100 is `.../100x100bb.jpg`. Bumping to 500x500 gives
// crisp art on the kiosk without paying decode cost of the 1000+ variant.
function upgradeSize(url: string, size = 500): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)/, `/${size}x${size}bb.$1`);
}

type ItunesResult = {
  artworkUrl100?: string;
  trackName?: string;
  artistName?: string;
};

type ItunesResponse = {
  results?: ItunesResult[];
};

export async function fetchArtwork(
  displayName: string,
  artist: string | null,
  signal?: AbortSignal,
): Promise<string | null> {
  const parsed = splitTitleArtist(displayName);
  const artistTerm = artist ?? parsed.artist;
  const term = artistTerm ? `${parsed.title} ${artistTerm}` : parsed.title;
  const url =
    "https://itunes.apple.com/search?" +
    new URLSearchParams({
      term,
      entity: "musicTrack",
      limit: "1",
      country: "US",
    }).toString();

  // Compose our own timeout with the caller's signal so a hanging fetch
  // never stalls the bulk-lookup loop.
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as ItunesResponse;
    const first = data.results?.[0];
    if (!first?.artworkUrl100) return null;
    return upgradeSize(first.artworkUrl100, 500);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
