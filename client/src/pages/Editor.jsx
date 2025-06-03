/* ================================================================ */
/* === client/src/pages/Editor.jsx  (replace entire file again) ==== */
/* ================================================================ */
import React, { useEffect, useMemo, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api"; 
import { useNavigate, useParams } from "react-router-dom";
import axios        from "axios";
import { message }  from "antd";
import MonacoEditor from "react-monaco-editor";

import FileTree      from "../components/FileTree";
import TopBar        from "../components/TopBar";
import TabBar        from "../components/TabBar";
import NewFileModal  from "../components/NewFileModal";
import { parseMasterFile } from "../utils/fileParser";

function Editor() {
  const { projectName } = useParams();
  const navigate = useNavigate();

  const [mode, setMode]        = useState("single");
  const [master, setMaster]    = useState("// start typing…");
  const [files,  setFiles]     = useState([]);
  const [tabs,   setTabs]      = useState([]);
  const [active, setActive]    = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  /* ---------- helper fns ---------- */
  const syncTabsFromMaster = content => {
    const parsed = parseMasterFile(content);
    setTabs(parsed);
    setActive(parsed[0]?.path || "");
  };
  const buildMasterFromTabs = arr =>
    arr.map(t => `// === file: ${t.path} ===\n${t.code.trimEnd()}`).join("\n\n");

  /* ---------- load master on mount ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/api/projects/${projectName}/master`);
        const content = res.data.content;
        setMaster(content);
        setFiles(parseMasterFile(content).map(p => p.path));
        syncTabsFromMaster(content);
      } catch {
        message.error("Failed to load master file");
      }
    })();
    // eslint-disable-next-line
  }, [projectName]);

  /* ---------- save & split ---------- */
  const saveMaster = async () => {
    try {
      const content = mode === "single" ? master : buildMasterFromTabs(tabs);
      const res = await axios.put(`/api/projects/${projectName}/master`, { content });
      setFiles(res.data.files);
      setMaster(content);
      syncTabsFromMaster(content);  
      message.success("Saved & split!");
    } catch {
      message.error("Save failed");
    }
  };

  /* ---------- tab ops ---------- */
  const createFile = path => {
    if (tabs.some(t => t.path === path)) return message.error("File exists");
    setTabs([...tabs, { path, code: "" }]);
    setActive(path);
    setModalOpen(false);
  };
  const renameFile = (oldPath, newPath) => {
    if (tabs.some(t => t.path === newPath)) return message.error("Name in use");
    setTabs(tabs.map(t => (t.path === oldPath ? { ...t, path: newPath } : t)));
    setActive(newPath);
  };
  const closeTab = path => {
    const filtered = tabs.filter(t => t.path !== path);
    setTabs(filtered);
    setActive(filtered[0]?.path || "");
  };

  /* ---------- dirs for New‑File modal ---------- */
  const existingDirs = useMemo(() => {
    const dirs = new Set([""]);
    tabs.forEach(t => {
      const parts = t.path.split("/");
      if (parts.length > 1) dirs.add(parts.slice(0, -1).join("/"));
    });
    return Array.from(dirs).sort();
  }, [tabs]);

  /* ---------- Monaco mount callback ---------- */
 const editorDidMount = () => {
  // enable JS diagnostics if the TS worker is present
monaco.languages?.typescript?.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation  : false
   });
   };

  /* ---------- render ---------- */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar
        projectName={projectName}
        mode={mode}
        setMode={setMode}
        onSave={saveMaster}
        onBack={() => navigate("/")}
      />

      {mode === "tabs" && (
        <TabBar
          files={tabs}
          active={active}
          setActive={setActive}
          onClose={closeTab}
          onNewFile={() => setModalOpen(true)}
          onRename={renameFile}
        />
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* ----------- editor ----------- */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === "single" ? (
            <MonacoEditor
            monaco={monaco}   
              editorDidMount={editorDidMount}
              language="javascript"
              value={master}
              onChange={val => setMaster(val)}
              options={{ automaticLayout: true, lineNumbers: "off" }}
            />
          ) : (
            tabs.find(t => t.path === active) && (
              <MonacoEditor
              monaco={monaco}   
                editorDidMount={editorDidMount}
                language="javascript"
                value={tabs.find(t => t.path === active).code}
                onChange={val =>
                  setTabs(tabs.map(t => (t.path === active ? { ...t, code: val } : t)))
                }
                options={{ automaticLayout: true, lineNumbers: "off" }}
              />
            )
          )}
        </div>

        {/* ----------- file tree ----------- */}
        <div style={{ width: 300, overflowY: "auto", borderLeft: "1px solid #ccc" }}>
          <h3 style={{ textAlign: "center" }}>File Tree</h3>
          <FileTree files={files} rootName={projectName} />
        </div>
      </div>

      {/* ----------- modal ----------- */}
      <NewFileModal
        visible={modalOpen}
        onCreate={createFile}
        onCancel={() => setModalOpen(false)}
        existingDirs={existingDirs}
      />
    </div>
  );
}
export default Editor;