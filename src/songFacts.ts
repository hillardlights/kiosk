// Short trivia strings shown when a queued song is tapped. Keys must match
// Remote Falcon sequence `name` (or `displayName`) — the queue popup checks
// both. One or two sentences max; the reveal area is narrow.
//
// Add entries as new sequences show up in RF. Sequences without a fact
// still show duration + category, so an empty entry is harmless.

export const SONG_FACTS: Record<string, string> = {
  "Abracadabra - Lady Gaga":
    "A dark-pop dance track from Gaga's 2025 album MAYHEM. The Latin-flavored hook took over TikTok within a week of release.",
  "Burnin' Up - Jonas Brothers":
    "The 2008 single that turned the Jonas Brothers into a phenomenon. Big Rob, their real-life bodyguard, drops the rap verse.",
  "Dracula - Tame Impala":
    "A moody late-night cut. Kevin Parker records nearly every Tame Impala track himself in his home studio in Fremantle, Australia.",
  "Gangsta's Paradise - Coolio":
    "Built on a sample of Stevie Wonder's 'Pastime Paradise' (1976). Won Best Rap Solo Performance at the 1996 Grammys.",
  "Houdini Thriller Breath Mashup - Joshuel Mashups":
    "A Halloween mashup blending Eminem's 'Houdini' (2024) with Michael Jackson's 'Thriller' — modern hit meets classic spook.",
};

export function lookupFact(name: string, displayName?: string | null): string | null {
  return SONG_FACTS[name] ?? (displayName ? SONG_FACTS[displayName] ?? null : null);
}
