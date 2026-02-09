const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Create a human-readable error from an API response.
 * @param {Response} res
 * @param {any} body
 * @returns {Error}
 */
function apiError(res, body) {
  const msg =
    (body && (body.detail || body.message)) ||
    `Request failed (${res.status} ${res.statusText})`;
  const err = new Error(msg);
  err.status = res.status;
  err.body = body;
  return err;
}

/**
 * Safely parse JSON; if it fails, return null.
 * @param {Response} res
 * @returns {Promise<any>}
 */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch wrapper with timeout + JSON support.
 * @param {string} path
 * @param {RequestInit & { timeoutMs?: number }} options
 * @returns {Promise<any>} JSON body or null
 */
async function request(path, options = {}) {
  const base =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:3001";

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const body = await safeJson(res);

    if (!res.ok) throw apiError(res, body);
    return body;
  } finally {
    clearTimeout(id);
  }
}

// PUBLIC_INTERFACE
export const ApiClient = {
  /** Get backend health; useful for diagnostics/banners. */
  async health() {
    return request("/");
  },

  /**
   * Generic: for backends that expose a canonical game state endpoint.
   * This project’s backend OpenAPI only shows "/", but the frontend is built
   * to work with the expected UNO endpoints once available.
   */
  async getGameState(gameId) {
    return request(`/games/${encodeURIComponent(gameId)}`, { method: "GET" });
  },

  /** Create a new game (single-player vs AI by default). */
  async createGame(payload) {
    return request(`/games`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  /** Join an existing game. */
  async joinGame(gameId, payload) {
    return request(`/games/${encodeURIComponent(gameId)}/join`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  /** Draw a card for the current player. */
  async drawCard(gameId, payload) {
    return request(`/games/${encodeURIComponent(gameId)}/draw`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  /**
   * Play a card.
   * Expected payload:
   *  - cardId OR { color, value }
   *  - optional chosenColor for wilds
   */
  async playCard(gameId, payload) {
    return request(`/games/${encodeURIComponent(gameId)}/play`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  /** Call UNO (if supported by backend). */
  async callUno(gameId, payload) {
    return request(`/games/${encodeURIComponent(gameId)}/uno`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  /** Restart the current game. */
  async restartGame(gameId) {
    return request(`/games/${encodeURIComponent(gameId)}/restart`, {
      method: "POST",
    });
  },

  /** Update settings. */
  async updateSettings(gameId, payload) {
    return request(`/games/${encodeURIComponent(gameId)}/settings`, {
      method: "PATCH",
      body: JSON.stringify(payload || {}),
    });
  },
};
