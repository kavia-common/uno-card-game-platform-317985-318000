import React from "react";
import { UnoCard } from "./UnoCard";
import { canPlayOn, normalizeCard } from "../utils/uno";

// PUBLIC_INTERFACE
export function Hand({
  cards,
  topCard,
  currentColor,
  selectedCardId,
  onSelectCard,
  disabled,
}) {
  const norm = (cards || []).map(normalizeCard).filter(Boolean);

  return (
    <div className="hand" role="region" aria-label="Your hand">
      <div className="hand__scroller">
        {norm.length === 0 ? (
          <div className="hand__empty">No cards in hand.</div>
        ) : (
          norm.map((c) => {
            const playable = canPlayOn(topCard, c, currentColor);
            const isSelected = selectedCardId === c.id;
            return (
              <div className="hand__cardWrap" key={c.id}>
                <UnoCard
                  card={c}
                  size="sm"
                  disabled={disabled || !playable}
                  selected={isSelected}
                  onClick={() => onSelectCard && onSelectCard(c)}
                  ariaLabel={`${
                    playable ? "Playable" : "Not playable"
                  } card ${c.color || "wild"} ${String(c.value)}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
