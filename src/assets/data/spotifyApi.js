export const getRecommendations = async (token, moodParams) => {
  const query = new URLSearchParams({
    limit: 10,
    market: "US",
    ...moodParams,
  }).toString();

  const res = await fetch(`https://api.spotify.com/v1/recommendations?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recommendations error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.tracks || [];
};

export const createPlaylist = async (token, userId, playlistName) => {
  const res = await fetch(`https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: playlistName,
      description: "Created by Climix — weather + mood powered playlist",
      public: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create playlist error ${res.status}: ${text}`);
  }

  return await res.json();
};

export const addTracksToPlaylist = async (token, playlistId, trackUris) => {
  if (!Array.isArray(trackUris) || trackUris.length === 0) return;

  const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Add tracks error ${res.status}: ${text}`);
  }

  return await res.json();
};

export const getCurrentUserId = async (token) => {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get user error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.id;
};

/* -------------------------
   Mapping weather + mood to
   Spotify recommendation params
   ------------------------- */
const weatherMoodMap = {
  Clear: {
    defaultGenres: ["pop", "dance", "pop-rock"],
    energy: 0.8,
    valence: 0.85,
    tempo: 110,
  },
  Clouds: {
    defaultGenres: ["indie", "alternative", "chill"],
    energy: 0.5,
    valence: 0.55,
    tempo: 95,
  },
  Rain: {
    defaultGenres: ["acoustic", "singer-songwriter", "ambient"],
    energy: 0.35,
    valence: 0.35,
    tempo: 80,
  },
  Drizzle: {
    defaultGenres: ["ambient", "lo-fi", "rnb"],
    energy: 0.4,
    valence: 0.45,
    tempo: 85,
  },
  Snow: {
    defaultGenres: ["classical", "acoustic", "ambient"],
    energy: 0.25,
    valence: 0.3,
    tempo: 70,
  },
  Thunderstorm: {
    defaultGenres: ["electronic", "edm", "rock"],
    energy: 0.85,
    valence: 0.4,
    tempo: 120,
  },
  Mist: {
    defaultGenres: ["ambient", "cinematic", "chill"],
    energy: 0.3,
    valence: 0.4,
    tempo: 70,
  },
};

const moodModifier = {
  happy: { energy: 0.05, valence: 0.1, genresBoost: [] },
  calm: { energy: -0.2, valence: 0.05, genresBoost: ["chill", "ambient"] },
  energetic: { energy: 0.25, valence: 0.05, genresBoost: ["dance", "edm"] },
  melancholy: { energy: -0.2, valence: -0.25, genresBoost: ["acoustic", "singer-songwriter"] },
  romantic: { energy: -0.05, valence: 0.2, genresBoost: ["soul", "rnb"] },
};

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

export function mapWeatherMoodToParams(weatherCondition = "Clear", mood = "happy") {
  // Normalize weather key
  const key = (weatherCondition || "Clear").toLowerCase();
  // find best match in map keys
  const foundKey =
    Object.keys(weatherMoodMap).find((k) => k.toLowerCase().startsWith(key)) || "Clear";

  const base = weatherMoodMap[foundKey] || weatherMoodMap["Clear"];
  const mod = moodModifier[mood] || moodModifier["happy"];

  const target_energy = clamp(base.energy + (mod.energy || 0));
  const target_valence = clamp(base.valence + (mod.valence || 0));
  const target_tempo = Math.round(base.tempo + (mod.tempo || 0));

  const genres = [...base.defaultGenres, ...(mod.genresBoost || [])]
    .slice(0, 3)
    .map((g) => g.toLowerCase())
    .join(",");

  return {
    seed_genres: genres,
    target_energy: target_energy.toFixed(2),
    target_valence: target_valence.toFixed(2),
    target_tempo: `${target_tempo}`,
  };
}

/* -------------------------
   High-level helper: generate playlist
   ------------------------- */
export const generatePlaylist = async (token, weatherCondition, mood, playlistName = null) => {
  if (!token) throw new Error("Missing Spotify access token");

  // map to mood params
  const moodParams = mapWeatherMoodToParams(weatherCondition, mood);

  // get the current user id
  const userId = await getCurrentUserId(token);

  // fetch recommendations (10 tracks)
  const tracks = await getRecommendations(token, moodParams);
  if (!tracks || tracks.length === 0) {
    throw new Error("No recommendations returned by Spotify");
  }

  // create playlist
  const name = playlistName || `Climix: ${weatherCondition} / ${mood} playlist`;
  const playlist = await createPlaylist(token, userId, name);

  // add tracks
  const trackUris = tracks.slice(0, 10).map((t) => t.uri).filter(Boolean);
  if (trackUris.length > 0) {
    await addTracksToPlaylist(token, playlist.id, trackUris);
  }

  return { playlist, tracks };
};