/* =================================================================== */
/* === client/src/components/TabBar.jsx ============================== */
/* =================================================================== */
import React from "react";

function TabBar({ files, active, setActive, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        background: "#ddd",
        borderBottom: "1px solid #aaa"
      }}
    >
      {files.map(f => (
        <div
          key={f.path}
          onClick={() => setActive(f.path)}
          style={{
            padding: "0.25rem 0.75rem",
            cursor: "pointer",
            background: active === f.path ? "#fff" : "transparent",
            borderRight: "1px solid #aaa",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          <span title={f.path} style={{ whiteSpace: "nowrap" }}>
            {f.path.split("/").pop()}
          </span>
          {files.length > 1 && (
            <span onClick={e => (e.stopPropagation(), onClose(f.path))} style={{ cursor: "pointer" }}>
              ✕
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default TabBar;
