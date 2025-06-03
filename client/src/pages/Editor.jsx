/* =================================================================== */
/* === client/src/pages/Editor.jsx (FULL NEW FILE) =================== */
/* =================================================================== */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import MonacoEditor from "react-monaco-editor";
import FileTree from "../components/FileTree";
import TopBar  from "../components/TopBar";
import TabBar  from "../components/TabBar";
import { parseMasterFile } from "../utils/fileParser";

function Editor() {
  const { projectName } = useParams();
  const navigate = useNavigate();

  /* ---------- state ---------- */
  const [mode, setMode]        = useState("single"); // "single" | "tabs"
  const [master, setMaster]    = useState("// start typing…");
  const [files,  setFiles]     = useState([]);       // list of paths (for tree)
  const [tabs,   setTabs]      = useState([]);       // [{path, code}]
  const [active, setActive]    = useState("");       // active tab path

  /* ---------- helpers ---------- */
  const syncTabsFromMaster = content => {
    const parsed = parseMasterFile(content);
    setTabs(parsed);
    setActive(parsed[0]?.path || "");
  };

  const buildMasterFromTabs = tabsArr => {
    let out = "";
    tabsArr.forEach(({ path, code }) => {
      out += `// === file: ${path} ===\n${code.trimEnd()}\n\n`;
    });
    return out.trimEnd();
  };

  /* ---------- load ---------- */
  const loadMaster = async () => {
    const res = await axios.get(`/api/projects/${projectName}/master`);
    setMaster(res.data.content);
    setFiles(res.data.files || []);
    syncTabsFromMaster(res.data.content);
  };

  /* ---------- save (master → split) ---------- */
  const saveMaster = async () => {
    const content = mode === "single" ? master : buildMasterFromTabs(tabs);
    const res = await axios.put(`/api/projects/${projectName}/master`, { content });
    setFiles(res.data.files);
    setMaster(content);
    alert("Saved & split!");
  };

  /* ---------- compose (folder → master) ---------- */
  const composeMaster = async () => {
    const res = await axios.post(`/api/projects/${projectName}/compose`);
    setMaster(res.data.content);
    syncTabsFromMaster(res.data.content);
    setFiles(res.data.files);
    alert("Composed master.txt from folder!");
  };

  /* ---------- new file (tabs mode) ---------- */
  const newFile = () => {
    const path = prompt("Enter new file path, e.g. src/newFile.js");
    if (!path) return;
    if (tabs.some(t => t.path === path)) return alert("File already exists.");
    const updated = [...tabs, { path, code: "" }];
    setTabs(updated);
    setActive(path);
  };

  /* ---------- close tab ---------- */
  const closeTab = path => {
    const filtered = tabs.filter(t => t.path !== path);
    setTabs(filtered);
    setActive(filtered[0]?.path || "");
  };

  /* ---------- effect ---------- */
  useEffect(() => {
    loadMaster();
    // eslint-disable-next-line
  }, [projectName]);

  /* ---------- editor content / onChange ---------- */
  const singleOnChange = val => setMaster(val);

  const tabOnChange = val => {
    setTabs(tabs.map(t => (t.path === active ? { ...t, code: val } : t)));
  };

  const activeTab = tabs.find(t => t.path === active);

  /* ---------- render ---------- */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar
        projectName={projectName}
        mode={mode}
        setMode={setMode}
        onSave={saveMaster}
        onCompose={composeMaster}
        onNewFile={newFile}
        onBack={() => navigate("/")}
      />

      {mode === "tabs" && (
        <TabBar
          files={tabs}
          active={active}
          setActive={setActive}
          onClose={closeTab}
        />
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* ------------ Editor pane ------------ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === "single" ? (
            <MonacoEditor
              language="javascript"
              value={master}
              onChange={singleOnChange}
              options={{ automaticLayout: true }}
            />
          ) : (
            activeTab && (
              <MonacoEditor
                language="javascript"
                value={activeTab.code}
                onChange={tabOnChange}
                options={{ automaticLayout: true }}
              />
            )
          )}
        </div>

        {/* ------------ File‑tree pane ----------- */}
        <div
          style={{
            width: "300px",
            overflowY: "auto",
            borderLeft: "1px solid #ccc"
          }}
        >
          <h3 style={{ textAlign: "center" }}>File Tree</h3>
          <FileTree files={files} />
        </div>
      </div>
    </div>
  );
}

export default Editor;