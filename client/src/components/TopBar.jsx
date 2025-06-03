/* ================================================================== */
/* === client/src/components/TopBar.jsx (REPLACED) ================== */
/* ================================================================== */
import React from "react";
import { Button } from "antd";

function TopBar({ projectName, mode, setMode, onSave, onBack }) {
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

      <Button onClick={onBack}>🏠 Projects</Button>
      <Button type="primary" onClick={onSave}>💾 Save & Split</Button>

      <Button onClick={() => setMode(prev => (prev === "single" ? "tabs" : "single"))}>
        {mode === "single" ? "🗂 Tabs View" : "📝 Master View"}
      </Button>
    </div>
  );
}
export default TopBar;
