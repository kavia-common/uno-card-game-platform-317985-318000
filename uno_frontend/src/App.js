import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { ApiClient } from "./api/client";
import { Hand } from "./components/Hand";
import { GameTable } from "./components/GameTable";
import { SettingsPanel } from "./components/SettingsPanel";
import { normalizeCard, makeFallbackState, isWild } from "./utils/uno";
import { createSoundController } from "./utils/sound";

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function safeGameId(state) {
  return state?.gameId || state?.id || state?.game_id || null;
}

function pickYou(state) {
  // Try common shapes: state.you.hand, state.players with isYou, etc.
  if (state?.you?.hand) return { playerId: state.you.playerId || state.you.id || "you", hand: state.you.hand };
  const players = Array.isArray(state?.players) ? state.players : [];
  const you = players.find((p) => p.isYou || p.is_you || p.isHuman || p.is_human);
  return { playerId: you?.id || "you", hand: you?.hand || [] };
}

function extractTop(state) {
  return state?.discardTop || state?.discard_top || state?.top_discard || state?.discard?.[state.discard?.length - 1] || null;
}

function extractCurrentColor(state) {
  return state?.currentColor || state?.current_color || null;
}

function extractDrawCount(state) {
  return state?.drawPileCount || state?.draw_pile_count || state?.drawCount || null;
}

function currentPlayerName(state) {
  const idx = state?.currentPlayerIndex ?? state?.current_player_index ?? 0;
  const players = Array.isArray(state?.players) ? state.players : [];
  const p = players[idx];
  return p?.name || `Player ${idx + 1}`;
}

// PUBLIC_INTERFACE
function App() {
  const sound = useMemo(() => createSoundController(), []);
  const [theme, setTheme] = useState("light");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [animationsEnabled, setAnimationsEnabled] = useState(!prefersReducedMotion());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [pollIntervalMs, setPollIntervalMs] = useState(1200);

  const [state, setState] = useState(() => makeFallbackState());
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [wildColorChoice, setWildColorChoice] = useState("red");

  const pollRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    sound.setEnabled(soundEnabled);
  }, [sound, soundEnabled]);

  const gameId = safeGameId(state);
  const you = pickYou(state);
  const yourHand = Array.isArray(you.hand) ? you.hand.map(normalizeCard).filter(Boolean) : [];
  const topCard = normalizeCard(extractTop(state));
  const currentColor = extractCurrentColor(state) || topCard?.color || "wild";
  const drawPileCount = extractDrawCount(state);

  async function refresh() {
    if (!gameId) return;
    try {
      const s = await ApiClient.getGameState(gameId);
      setState((prev) => ({ ...prev, ...s, gameId: safeGameId(s) || safeGameId(prev) }));
    } catch (e) {
      setBanner(e.message || "Failed to refresh game state.");
    }
  }

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!autoRefreshEnabled || !gameId) return;

    pollRef.current = setInterval(() => {
      refresh();
    }, Math.max(400, pollIntervalMs));

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled, pollIntervalMs, gameId]);

  async function createNewGame() {
    setLoading(true);
    setBanner(null);
    try {
      sound.play("click");
      const s = await ApiClient.createGame({ mode: "singleplayer" });
      const gid = safeGameId(s);
      setState((prev) => ({ ...prev, ...s, gameId: gid || prev.gameId, status: "playing", message: null }));
      setSelectedCard(null);
      if (gid) await ApiClient.getGameState(gid).then((full) => setState((prev) => ({ ...prev, ...full, gameId: gid })));
    } catch (e) {
      sound.play("error");
      setBanner(e.message || "Failed to create game.");
    } finally {
      setLoading(false);
    }
  }

  async function onDraw() {
    if (!gameId) {
      setBanner("Create a game first.");
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      sound.play("draw");
      const s = await ApiClient.drawCard(gameId, {});
      setState((prev) => ({ ...prev, ...s }));
      setSelectedCard(null);
    } catch (e) {
      sound.play("error");
      setBanner(e.message || "Failed to draw a card.");
    } finally {
      setLoading(false);
    }
  }

  async function onPlaySelected() {
    if (!gameId) {
      setBanner("Create a game first.");
      return;
    }
    if (!selectedCard) return;

    const c = normalizeCard(selectedCard);
    const payload = { cardId: c.id };
    if (isWild(c)) payload.chosenColor = wildColorChoice;

    setLoading(true);
    setBanner(null);
    try {
      sound.play("play");
      const s = await ApiClient.playCard(gameId, payload);
      setState((prev) => ({ ...prev, ...s }));
      setSelectedCard(null);
    } catch (e) {
      sound.play("error");
      setBanner(e.message || "Failed to play card.");
    } finally {
      setLoading(false);
    }
  }

  async function onRestart() {
    if (!gameId) return;
    setLoading(true);
    setBanner(null);
    try {
      sound.play("click");
      const s = await ApiClient.restartGame(gameId);
      setState((prev) => ({ ...prev, ...s }));
      setSelectedCard(null);
    } catch (e) {
      sound.play("error");
      setBanner(e.message || "Failed to restart game.");
    } finally {
      setLoading(false);
    }
  }

  const turnName = currentPlayerName(state);
  const statusText = state?.status || "idle";
  const canDraw = Boolean(gameId) && !loading;

  return (
    <div className="App">
      <div className="appShell">
        <header className="topbar">
          <div className="topbar__left">
            <div className="brand">
              <div className="brand__title">UNO</div>
              <div className="brand__subtitle">Modern web table</div>
            </div>

            <div className="chips">
              <span className="chip" aria-label="Game status">
                Status: <strong>{String(statusText).toUpperCase()}</strong>
              </span>
              <span className="chip" aria-label="Turn indicator">
                Turn: <strong>{turnName}</strong>
              </span>
            </div>
          </div>

          <div className="topbar__right">
            <button
              type="button"
              className="btn btnGhost"
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              aria-label="Toggle theme"
            >
              Theme: {theme === "light" ? "Light" : "Dark"}
            </button>

            <button
              type="button"
              className="btn btnGhost"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
            >
              Settings
            </button>
          </div>
        </header>

        {banner && (
          <div className="banner" role="status" aria-live="polite">
            <div className="banner__text">{banner}</div>
            <button type="button" className="banner__close" onClick={() => setBanner(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <main className={`main ${animationsEnabled ? "animOn" : "animOff"}`}>
          <div className="layoutGrid">
            <aside className="sidebar" aria-label="Players and scores">
              <div className="panel">
                <div className="panel__title">Players</div>
                <div className="players">
                  {(Array.isArray(state?.players) ? state.players : []).map((p, idx) => {
                    const isCurrent = idx === (state?.currentPlayerIndex ?? state?.current_player_index ?? 0);
                    const handCount = p.handCount ?? p.hand_count ?? (Array.isArray(p.hand) ? p.hand.length : null);
                    return (
                      <div className={`playerRow ${isCurrent ? "playerRow--current" : ""}`} key={p.id || `${idx}`}>
                        <div className="playerRow__name">
                          {p.name || `Player ${idx + 1}`}
                          {p.isAI || p.is_ai ? <span className="pill">CPU</span> : <span className="pill pill--you">You</span>}
                        </div>
                        <div className="playerRow__meta">
                          <span className="miniStat">Hand: <strong>{handCount ?? "—"}</strong></span>
                          <span className="miniStat">Score: <strong>{p.score ?? 0}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel">
                <div className="panel__title">Game</div>
                <div className="kv">
                  <div className="kv__row">
                    <div className="kv__k">Game ID</div>
                    <div className="kv__v">{gameId || "—"}</div>
                  </div>
                  <div className="kv__row">
                    <div className="kv__k">Direction</div>
                    <div className="kv__v">{(state?.direction ?? 1) === 1 ? "Clockwise" : "Counter"}</div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="center">
              <GameTable
                discardTop={topCard}
                drawPileCount={typeof drawPileCount === "number" ? drawPileCount : null}
                currentColor={currentColor}
                onDraw={onDraw}
                canDraw={canDraw}
              />

              <div className="actionBar" aria-label="Actions">
                <button type="button" className="btn btnPrimary" onClick={createNewGame} disabled={loading}>
                  New game
                </button>
                <button type="button" className="btn btnSecondary" onClick={onRestart} disabled={!gameId || loading}>
                  Restart
                </button>
                <button type="button" className="btn" onClick={refresh} disabled={!gameId || loading}>
                  Refresh
                </button>

                <div className="spacer" />

                {selectedCard && isWild(selectedCard) && (
                  <div className="wildPicker" aria-label="Choose wild color">
                    <label className="wildPicker__label" htmlFor="wildColor">
                      Wild color
                    </label>
                    <select
                      id="wildColor"
                      className="select"
                      value={wildColorChoice}
                      onChange={(e) => setWildColorChoice(e.target.value)}
                      disabled={loading}
                    >
                      <option value="red">Red</option>
                      <option value="yellow">Yellow</option>
                      <option value="green">Green</option>
                      <option value="blue">Blue</option>
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btnPrimary"
                  onClick={onPlaySelected}
                  disabled={!selectedCard || loading}
                  aria-label="Play selected card"
                >
                  Play selected
                </button>
              </div>
            </section>
          </div>

          <footer className="bottombar">
            <div className="bottombar__left">
              <div className="hint">
                Select a playable card from your hand, then press <strong>Play selected</strong>. Tap the draw pile to draw.
              </div>
            </div>
            <div className="bottombar__right">
              <div className="statPills">
                <span className="pillStat">Hand: <strong>{yourHand.length}</strong></span>
                <span className="pillStat">Top: <strong>{topCard ? `${topCard.color || "wild"} ${String(topCard.value)}` : "—"}</strong></span>
              </div>
            </div>
          </footer>

          <Hand
            cards={yourHand}
            topCard={topCard}
            currentColor={currentColor}
            selectedCardId={selectedCard?.id || null}
            onSelectCard={(c) => {
              sound.play("click");
              setSelectedCard((prev) => (prev?.id === c.id ? null : c));
            }}
            disabled={loading}
          />
        </main>

        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          animationsEnabled={animationsEnabled}
          onToggleAnimations={() => setAnimationsEnabled((v) => !v)}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={() => setAutoRefreshEnabled((v) => !v)}
          pollIntervalMs={pollIntervalMs}
          onChangePollIntervalMs={(v) => setPollIntervalMs(Number.isFinite(v) ? v : 1200)}
        />
      </div>
    </div>
  );
}

export default App;
