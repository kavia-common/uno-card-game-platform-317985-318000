import React from "react";
import { cardText, isWild, normalizeCard } from "../utils/uno";

/**
 * Map UNO card colors to CSS theme tokens.
 */
function colorClass(color) {
  const c = String(color || "").toLowerCase();
  if (c === "red") return "unoCard--red";
  if (c === "yellow") return "unoCard--yellow";
  if (c === "green") return "unoCard--green";
  if (c === "blue") return "unoCard--blue";
  return "unoCard--wild";
}

// PUBLIC_INTERFACE
export function UnoCard({
  card,
  size = "md",
  faceDown = false,
  disabled = false,
  selected = false,
  onClick,
  ariaLabel,
}) {
  const c = normalizeCard(card);

  const label = faceDown ? "Card back" : `${c?.color || "wild"} ${cardText(c)}`;
  const finalAria = ariaLabel || label;

  const classes = [
    "unoCard",
    `unoCard--${size}`,
    faceDown ? "unoCard--back" : colorClass(c?.color),
    disabled ? "unoCard--disabled" : "",
    selected ? "unoCard--selected" : "",
    onClick ? "unoCard--clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={disabled ? undefined : onClick}
      aria-label={finalAria}
      disabled={disabled}
    >
      {!faceDown && (
        <>
          <span className="unoCard__corner unoCard__corner--tl">{cardText(c)}</span>
          <span className="unoCard__center">
            <span className="unoCard__centerText">{cardText(c)}</span>
            {isWild(c) && <span className="unoCard__wildDots" aria-hidden="true" />}
          </span>
          <span className="unoCard__corner unoCard__corner--br">{cardText(c)}</span>
        </>
      )}
    </button>
  );
}
