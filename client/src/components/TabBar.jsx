/* ================================================================== */
/* === client/src/components/TabBar.jsx  (REPLACE) ================== */
/* ================================================================== */
import React, { useState } from "react";
import { CloseOutlined, FileOutlined, PlusOutlined } from "@ant-design/icons";

function TabBar({ files, active, setActive, onClose, onNewFile, onRename }) {
  const [editing, setEditing] = useState(null);
  const [temp, setTemp] = useState("");

  const startEdit = path => {
    setEditing(path);
    setTemp(path);
  };
  const finish = () => {
    if (editing && temp.trim() && temp !== editing) onRename(editing, temp.trim());
    setEditing(null);
  };

  return (
    <div
      style={{
        display: "flex",
        background: "#f5f5f5",
        borderBottom: "1px solid #d9d9d9",
        overflowX: "auto"
      }}
    >
      {files.map(f => (
        <div
          key={f.path}
          onDoubleClick={() => startEdit(f.path)}
          onClick={() => setActive(f.path)}
          style={{
            padding: "4px 12px",
            cursor: "pointer",
            background: active === f.path ? "#fff" : "transparent",
            borderRight: "1px solid #d9d9d9",
            display: "flex",
            alignItems: "center",
            gap: 6,
            maxWidth: 200
          }}
        >
          <FileOutlined />
          {editing === f.path ? (
            <input
              autoFocus
              value={temp}
              onChange={e => setTemp(e.target.value)}
              onBlur={finish}
              onKeyDown={e => e.key === "Enter" && finish()}
              style={{ flex: 1, minWidth: 0 }}
            />
          ) : (
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {f.path.split("/").pop()}
            </span>
          )}
          {files.length > 1 && (
            <CloseOutlined
              onClick={e => {
                e.stopPropagation();
                onClose(f.path);
              }}
              style={{ fontSize: 10 }}
            />
          )}
        </div>
      ))}

      <div
        onClick={onNewFile}
        style={{
          padding: "4px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          color: "#1677ff"
        }}
      >
        <PlusOutlined />
      </div>
    </div>
  );
}
export default TabBar;