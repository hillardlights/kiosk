import { config } from "../config";

export type RfSequence = {
  name: string;
  displayName: string | null;
  artist: string | null;
  imageUrl: string | null;
  category: string | null;
  order: number | null;
  visibilityCount: number | null;
  active: boolean;
  index: number | null;
};

export type RfPlayingSequence = {
  name: string;
  displayName: string | null;
  artist: string | null;
  imageUrl: string | null;
  duration: number | null;
};

export type RfRequest = {
  position: number;
  sequence: {
    name: string;
    displayName: string | null;
    artist: string | null;
    imageUrl: string | null;
  };
};

export type RfPreferences = {
  viewerControlEnabled: boolean | null;
  viewerControlMode: string | null;
  jukeboxDepth: number | null;
  jukeboxRequestLimit: number | null;
  checkIfRequested: boolean | null;
  locationCheckMethod: string | null;
};

export type RfShow = {
  showName: string | null;
  playingNow: string | null;
  playingNext: string | null;
  playingNowSequence: RfPlayingSequence | null;
  playingNextSequence: RfPlayingSequence | null;
  requests: RfRequest[];
  sequences: RfSequence[];
  preferences: RfPreferences | null;
};

// Rejection messages surfaced by RF's rule chain — see viewer/rules/*.java
export type RfRejectionCode =
  | "NAUGHTY"
  | "ALREADY_REQUESTED"
  | "QUEUE_FULL"
  | "INVALID_LOCATION"
  | "SEQUENCE_REQUESTED"
  | "SEQUENCE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type RfQueueResult =
  | { ok: true }
  | { ok: false; code: RfRejectionCode | "NETWORK_ERROR"; message: string };

const GET_SHOW_QUERY = `
  query GetShow($subdomain: String!) {
    getShow(showSubdomain: $subdomain) {
      showName
      playingNow
      playingNext
      playingNowSequence { name displayName artist imageUrl duration }
      playingNextSequence { name displayName artist imageUrl duration }
      requests {
        position
        sequence { name displayName artist imageUrl }
      }
      sequences {
        name displayName artist imageUrl category order visibilityCount active index
      }
      preferences {
        viewerControlEnabled viewerControlMode
        jukeboxDepth jukeboxRequestLimit checkIfRequested
        locationCheckMethod
      }
    }
  }
`.trim();

const UPDATE_ACTIVE_VIEWERS_MUTATION = `
  mutation Presence($subdomain: String!, $viewerId: String!) {
    updateActiveViewers(showSubdomain: $subdomain, viewerId: $viewerId)
  }
`.trim();

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  };
  if (signal) init.signal = signal;
  const res = await fetch(`${config.rfBaseUrl}/graphql`, init);
  if (!res.ok) {
    throw new Error(`RF HTTP ${res.status}`);
  }
  const body = (await res.json()) as GraphQLResponse<T>;
  if (body.errors && body.errors.length > 0) {
    throw new Error(body.errors[0]!.message);
  }
  if (!body.data) {
    throw new Error("RF response missing data");
  }
  return body.data;
}

export async function getShow(signal?: AbortSignal): Promise<RfShow> {
  const data = await gql<{ getShow: RfShow }>(
    GET_SHOW_QUERY,
    { subdomain: config.rfSubdomain },
    signal,
  );
  return data.getShow;
}

export async function addSequenceToQueue(
  sequenceName: string,
  viewerId: string,
): Promise<RfQueueResult> {
  try {
    const res = await fetch(`${config.rfBaseUrl}/addSequenceToQueue`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        showSubdomain: config.rfSubdomain,
        sequence: sequenceName,
        viewerId,
      }),
    });
    // The REST endpoint returns `{}` on success or `{ message: "CODE" }` on rejection.
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!body.message) return { ok: true };
    const code = body.message as RfRejectionCode;
    return { ok: false, code, message: friendlyRejection(code) };
  } catch (err) {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function updateActiveViewers(viewerId: string): Promise<void> {
  await gql(UPDATE_ACTIVE_VIEWERS_MUTATION, {
    subdomain: config.rfSubdomain,
    viewerId,
  }).catch(() => {
    // Presence pings are best-effort; ignore failures.
  });
}

export function friendlyRejection(code: RfRejectionCode): string {
  switch (code) {
    case "NAUGHTY":
      return "Requests are blocked from this device.";
    case "ALREADY_REQUESTED":
      return "You already have a song queued — wait for it to play.";
    case "QUEUE_FULL":
      return "The queue is full. Try again in a minute.";
    case "INVALID_LOCATION":
      return "You're too far from the show to request songs.";
    case "SEQUENCE_REQUESTED":
      return "That song was just requested — pick another.";
    case "SEQUENCE_UNAVAILABLE":
      return "That song isn't available right now.";
    case "UNEXPECTED_ERROR":
    default:
      return "Something went wrong. Try again.";
  }
}
