/* =================================================================== */
/* === client/src/components/TabBar.jsx ============================== */
/* =================================================================== */
import React, { useState } from "react";

function TabBar({ files, active, setActive, onClose, onNewFile, onRename }) {
  const [editing, setEditing] = useState(null);
  const [temp, setTemp]       = useState("");

  const startEdit = path => {
    setEditing(path);
    setTemp(path);
  };

  const finishEdit = () => {
    if (editing && temp.trim() && temp !== editing) onRename(editing, temp.trim());
    setEditing(null);
  };

  return (
    <div style={{ display: "flex", background: "#ddd", borderBottom: "1px solid #aaa" }}>
      {files.map(f => (
        <div
          key={f.path}
          onDoubleClick={() => startEdit(f.path)}
          onClick={() => setActive(f.path)}
          style={{
            padding: "0.25rem 0.75rem",
            cursor: "pointer",
            background: active === f.path ? "#fff" : "transparent",
            borderRight: "1px solid #aaa",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            maxWidth: 180
          }}
        >
          {editing === f.path ? (
            <input
              autoFocus
              value={temp}
              onChange={e => setTemp(e.target.value)}
              onBlur={finishEdit}
              onKeyDown={e => e.key === "Enter" && finishEdit()}
              style={{ flex: 1, minWidth: 0 }}
            />
          ) : (
            <span title={f.path} style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {f.path.split("/").pop()}
            </span>
          )}
          {files.length > 1 && (
            <span onClick={e => (e.stopPropagation(), onClose(f.path))} style={{ cursor: "pointer" }}>✕</span>
          )}
        </div>
      ))}

      {/* PLUS button */}
      <div
        onClick={onNewFile}
        style={{
          padding: "0 0.75rem",
          cursor: "pointer",
          userSelect: "none",
          fontWeight: "bold"
        }}
      >
        ＋
      </div>
    </div>
  );
}

export default TabBar;