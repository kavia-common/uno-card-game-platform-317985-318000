import React, { useEffect, useRef } from "react";

// PUBLIC_INTERFACE
export function SettingsPanel({
  open,
  onClose,
  soundEnabled,
  onToggleSound,
  animationsEnabled,
  onToggleAnimations,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  pollIntervalMs,
  onChangePollIntervalMs,
}) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__header">
          <div className="modal__title">Settings</div>
          <button
            type="button"
            className="iconBtn"
            onClick={onClose}
            aria-label="Close settings"
            ref={closeBtnRef}
          >
            ✕
          </button>
        </div>

        <div className="modal__content">
          <div className="settingRow">
            <div className="settingRow__label">
              <div className="settingRow__name">Sound</div>
              <div className="settingRow__hint">Card actions and alerts</div>
            </div>
            <button type="button" className="toggleBtn" onClick={onToggleSound} aria-pressed={soundEnabled}>
              {soundEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="settingRow">
            <div className="settingRow__label">
              <div className="settingRow__name">Animations</div>
              <div className="settingRow__hint">Smooth motion (respects reduced motion)</div>
            </div>
            <button
              type="button"
              className="toggleBtn"
              onClick={onToggleAnimations}
              aria-pressed={animationsEnabled}
            >
              {animationsEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="settingRow">
            <div className="settingRow__label">
              <div className="settingRow__name">Auto-refresh</div>
              <div className="settingRow__hint">Poll backend for updated state</div>
            </div>
            <button
              type="button"
              className="toggleBtn"
              onClick={onToggleAutoRefresh}
              aria-pressed={autoRefreshEnabled}
            >
              {autoRefreshEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="settingRow">
            <div className="settingRow__label">
              <div className="settingRow__name">Refresh interval</div>
              <div className="settingRow__hint">Milliseconds</div>
            </div>
            <input
              className="textInput"
              type="number"
              min={400}
              step={100}
              value={pollIntervalMs}
              onChange={(e) => onChangePollIntervalMs(Number(e.target.value || 0))}
              aria-label="Polling interval in milliseconds"
            />
          </div>

          <div className="divider" />

          <div className="note">
            Backend game endpoints must exist for gameplay actions. If you only see the health check in OpenAPI,
            implement the UNO backend routes to match the client paths in <code>src/api/client.js</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
