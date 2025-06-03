/* =================================================================== */
/* === client/src/components/TopBar.jsx ============================== */
/* =================================================================== */
import React from "react";

function TopBar({
  projectName,
  mode,
  setMode,
  onSave,
  onCompose,
  onNewFile,
  onBack
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0.5rem 1rem",
        background: "#282c34",
        color: "#fff",
        gap: "0.75rem"
      }}
    >
      <strong style={{ marginRight: "auto" }}>{projectName}</strong>

      <button onClick={onBack}>🏠 Projects</button>
      <button onClick={onCompose}>🔄 Compose</button>
      <button onClick={onSave}>💾 Save</button>

      <button onClick={() => setMode(prev => (prev === "single" ? "tabs" : "single"))}>
        {mode === "single" ? "🗂 Tabs View" : "📝 Master View"}
      </button>

      {mode === "tabs" && <button onClick={onNewFile}>➕ New File</button>}
    </div>
  );
}

export default TopBar;