import type { QueueItem, Song } from "./types";

export const DEMO_SONGS: Song[] = [
  { name: "bond",        displayName: "James Bond Theme",         artist: "John Barry",                    imageUrl: null, category: "Movie",     active: true, durationSec: 165 },
  { name: "thriller",    displayName: "Thriller",                 artist: "Michael Jackson",               imageUrl: null, category: "Halloween", active: true, durationSec: 358 },
  { name: "ghostbust",   displayName: "Ghostbusters",             artist: "Ray Parker Jr.",                imageUrl: null, category: "Movie",     active: true, durationSec: 246 },
  { name: "monster",     displayName: "Monster Mash",             artist: "Bobby Pickett",                 imageUrl: null, category: "Halloween", active: true, durationSec: 199 },
  { name: "this-halo",   displayName: "This Is Halloween",        artist: "Nightmare Before Christmas",    imageUrl: null, category: "Movie",     active: true, durationSec: 205 },
  { name: "toccata",     displayName: "Toccata and Fugue in D minor", artist: "J.S. Bach",                 imageUrl: null, category: "Classical", active: true, durationSec: 540 },
  { name: "carpenter",   displayName: "Halloween Theme",          artist: "John Carpenter",                imageUrl: null, category: "Movie",     active: true, durationSec: 172 },
  { name: "crazy-train", displayName: "Crazy Train",              artist: "Ozzy Osbourne",                 imageUrl: null, category: "Rock",      active: true, durationSec: 289 },
  { name: "bttf",        displayName: "Back to the Future",       artist: "Alan Silvestri",                imageUrl: null, category: "Movie",     active: true, durationSec: 213 },
  { name: "time-warp",   displayName: "Time Warp",                artist: "Rocky Horror",                  imageUrl: null, category: "Movie",     active: true, durationSec: 197 },
  { name: "purple",      displayName: "Purple People Eater",      artist: "Sheb Wooley",                   imageUrl: null, category: "Halloween", active: true, durationSec: 138 },
  { name: "munsters",    displayName: "The Munsters Theme",       artist: "Jack Marshall",                 imageUrl: null, category: "TV",        active: true, durationSec: 62  },
];

export const DEMO_INITIAL_QUEUE: QueueItem[] = [
  { position: 1, song: DEMO_SONGS[2]! },
  { position: 2, song: DEMO_SONGS[4]! },
];

export const DEMO_INITIAL_NOW_PLAYING_ELAPSED = 83; // start Thriller at 1:23
export const DEMO_INITIAL_NOW_PLAYING_DURATION = 358;
