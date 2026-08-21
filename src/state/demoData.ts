import type { QueueItem, Song } from "./types";

export const DEMO_SONGS: Song[] = [
  { id: "bond",        title: "James Bond Theme",         artist: "John Barry",         durationSec: 210 },
  { id: "thriller",    title: "Thriller",                 artist: "Michael Jackson",    durationSec: 358 },
  { id: "ghostbust",   title: "Ghostbusters",             artist: "Ray Parker Jr.",     durationSec: 245 },
  { id: "monster",     title: "Monster Mash",             artist: "Bobby Pickett",      durationSec: 190 },
  { id: "this-halo",   title: "This Is Halloween",        artist: "Nightmare Before Christmas", durationSec: 213 },
  { id: "toccata",     title: "Toccata and Fugue in D minor", artist: "J.S. Bach",      durationSec: 264 },
  { id: "carpenter",   title: "Halloween Theme",          artist: "John Carpenter",     durationSec: 178 },
  { id: "crazy-train", title: "Crazy Train",              artist: "Ozzy Osbourne",      durationSec: 296 },
  { id: "bttf",        title: "Back to the Future",       artist: "Alan Silvestri",     durationSec: 220 },
  { id: "time-warp",   title: "Time Warp",                artist: "Rocky Horror",       durationSec: 202 },
  { id: "purple",      title: "Purple People Eater",      artist: "Sheb Wooley",        durationSec: 145 },
  { id: "munsters",    title: "The Munsters Theme",       artist: "Jack Marshall",      durationSec: 110 },
];

export const DEMO_INITIAL_QUEUE: QueueItem[] = [
  { id: "q-1", song: DEMO_SONGS[2]!, queuedAt: Date.now() - 60_000 },
  { id: "q-2", song: DEMO_SONGS[4]!, queuedAt: Date.now() - 30_000 },
];

export const DEMO_INITIAL_NOW_PLAYING_ELAPSED = 83; // start Thriller at 1:23
