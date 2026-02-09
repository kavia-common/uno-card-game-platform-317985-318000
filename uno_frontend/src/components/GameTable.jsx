import React from "react";
import { UnoCard } from "./UnoCard";
import { normalizeCard } from "../utils/uno";

// PUBLIC_INTERFACE
export function GameTable({
  discardTop,
  drawPileCount,
  currentColor,
  onDraw,
  canDraw,
}) {
  const top = normalizeCard(discardTop);

  return (
    <section className="table" aria-label="Game table">
      <div className="table__piles">
        <div className="pile">
          <div className="pile__label">Draw</div>
          <div className="pile__stack">
            <UnoCard
              faceDown
              size="md"
              onClick={canDraw ? onDraw : undefined}
              disabled={!canDraw}
              ariaLabel={`Draw pile. ${drawPileCount ?? "Unknown"} cards remaining.`}
            />
            <div className="pile__count" aria-label="Draw pile count">
              {typeof drawPileCount === "number" ? drawPileCount : "—"}
            </div>
          </div>
        </div>

        <div className="pile">
          <div className="pile__label">Discard</div>
          <div className="pile__stack">
            <div className="pile__discard">
              <UnoCard card={top} size="md" ariaLabel="Top of discard pile" />
            </div>
            <div className="pile__meta">
              <div className="chip" aria-label="Current color">
                Color: <strong className={`chip__color chip__color--${String(currentColor || top?.color || "wild")}`}>
                  {String(currentColor || top?.color || "wild").toUpperCase()}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
