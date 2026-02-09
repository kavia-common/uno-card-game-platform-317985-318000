export const UNO_COLORS = ["red", "yellow", "green", "blue"];
export const WILD_COLORS = [...UNO_COLORS];

/**
 * Normalize a "card" object coming from backend or local fallback.
 * Backend schemas may differ; we handle common shapes.
 * @param {any} c
 */
export function normalizeCard(c) {
  if (!c) return null;
  const color = c.color || c.colour || c.suit || null;
  const value = c.value ?? c.rank ?? c.type ?? c.name ?? null;
  const id = c.id || c.card_id || c.cardId || `${color || "wild"}:${value}`;
  return {
    id,
    color,
    value,
    raw: c,
  };
}

export function cardText(card) {
  if (!card) return "";
  const v = String(card.value ?? "").toUpperCase();
  if (v === "WILD") return "WILD";
  if (v === "WILD_DRAW_FOUR" || v === "WILD+4" || v === "WILD4") return "WILD +4";
  if (v === "DRAW_TWO" || v === "+2") return "+2";
  if (v === "SKIP") return "SKIP";
  if (v === "REVERSE") return "REV";
  return String(card.value ?? "");
}

export function isWild(card) {
  const v = String(card?.value ?? "").toLowerCase();
  return v.includes("wild");
}

/**
 * UI-side playability check (backend remains authoritative).
 * @param {any} topCard
 * @param {any} card
 * @param {string|null} currentColor
 */
export function canPlayOn(topCard, card, currentColor) {
  if (!card) return false;
  if (isWild(card)) return true;

  const top = normalizeCard(topCard);
  const c = normalizeCard(card);

  const colorToMatch = currentColor || top?.color || null;
  if (c.color && colorToMatch && c.color === colorToMatch) return true;
  if (top?.value != null && c.value != null && String(top.value) === String(c.value)) return true;

  return false;
}

/**
 * If backend state is missing/unknown, generate a friendly placeholder.
 */
export function makeFallbackState() {
  return {
    gameId: null,
    status: "idle",
    message:
      "Backend game endpoints not detected from OpenAPI (only /). Start a game once backend routes are available.",
    currentPlayerIndex: 0,
    direction: 1,
    players: [
      { id: "p1", name: "You", handCount: 7, isAI: false, score: 0 },
      { id: "p2", name: "CPU", handCount: 7, isAI: true, score: 0 },
    ],
    you: {
      playerId: "p1",
      hand: [],
    },
    discardTop: { color: "blue", value: "5" },
    currentColor: "blue",
    drawPileCount: 60,
  };
}
