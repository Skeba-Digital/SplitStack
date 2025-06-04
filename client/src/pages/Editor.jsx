/* ================================================================== */
/* === client/src/pages/Editor.jsx  (REPLACE) ======================= */
/* ================================================================== */
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import Split from "react-split";

import MonacoEditor  from "react-monaco-editor";
import FileTree      from "../components/FileTree";
import TopBar        from "../components/TopBar";
import TabBar        from "../components/TabBar";
import NewFileModal  from "../components/NewFileModal";
import PreviewPane   from "../components/PreviewPane";
import { parseMasterFile } from "../utils/fileParser";

/* helper: path → language id */
const langFromPath = p => {
  if (/\.(jsx?|mjs)$/.test(p))        return "javascript";
  if (/\.(tsx?|mts)$/.test(p))        return "typescript";
  if (p.endsWith(".css"))             return "css";
  if (/\.(html?|xhtml)$/.test(p))     return "html";
  if (p.endsWith(".json"))            return "json";
  if (p.endsWith(".md"))              return "markdown";
  if (p.endsWith(".py"))              return "python";
  return "plaintext";
};

function Editor() {
  const { projectName } = useParams();
  const allProjects = useLocation().state?.projects || [projectName];
  const navigate = useNavigate();
  const editorRef = useRef(null);

  /* UI state */
  const [mode, setMode]     = useState("single");
  const [master, setMaster] = useState("// start typing…");
  const [files, setFiles]   = useState([]);
  const [tabs, setTabs]     = useState([]);
  const [active, setActive] = useState("");
  const [treeOpen, setTreeOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);

  /* ---------- Monaco diagnostics ---------- */
  useEffect(() => {
    const ts = monaco.languages.typescript;
    ts.javascriptDefaults.setCompilerOptions({
      allowJs: true, checkJs: true, jsx: ts.JsxEmit.React
    });

    monaco.languages.html.htmlDefaults?.setOptions?.({ validate: true });
    monaco.languages.css.cssDefaults?.setDiagnosticsOptions?.({ validate: true });
  }, []);

  /* ---------- helpers ---------- */
  const syncTabs = c => {
    const parsed = parseMasterFile(c);
    setTabs(parsed);
    setActive(parsed[0]?.path || "");
  };
  const buildMaster = arr =>
    arr.map(t => `// === file: ${t.path} ===\n${t.code.trimEnd()}`).join("\n\n");

  const scrollToSection = path => {
    if (!editorRef.current || mode !== "single") return;
    const rx = new RegExp(
      `^//\\s*===\\s*file:\\s*${path.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\s*===`,
      "m"
    );
    const m = master.match(rx);
    if (!m) return;
    const pos = editorRef.current.getModel().getPositionAt(m.index);
    editorRef.current.revealPositionInCenter(pos);
    editorRef.current.setPosition(pos);
  };

  /* ---------- load master on mount ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/projects/${projectName}/master`);
        setMaster(data.content);
        const parsed = parseMasterFile(data.content);
        setFiles(parsed.map(p => p.path));
        syncTabs(data.content);
      } catch { message.error("Failed to load master"); }
    })();
    // eslint-disable-next-line
  }, [projectName]);

  /* ---------- save ---------- */
  const saveMaster = async () => {
    try {
      const content = mode === "single" ? master : buildMaster(tabs);
      const { data } = await axios.put(`/api/projects/${projectName}/master`, { content });
      setFiles(data.files);
      setMaster(content);
      syncTabs(content);
      message.success("Saved & split!");
    } catch { message.error("Save failed"); }
  };

  /* ---------- tab ops ---------- */
  const createFile = p => {
    if (tabs.some(t => t.path === p)) return message.error("File exists");
    setTabs([...tabs, { path: p, code: "" }]); setActive(p); setModalOpen(false);
  };
  const renameFile = (o,n) => {
    if (tabs.some(t => t.path === n)) return message.error("Name in use");
    setTabs(tabs.map(t=>t.path===o?{...t,path:n}:t)); setActive(n);
  };
  const closeTab = p => {
    const rest = tabs.filter(t=>t.path!==p);
    setTabs(rest); setActive(rest[0]?.path||"");
  };

  /* ---------- preview files ---------- */
  const previewFiles = useMemo(
    () => (mode==="single"?parseMasterFile(master):tabs),
    [mode, master, tabs]
  );

  /* ---------- compute sizes ---------- */
  const treeWidth = treeOpen ? 220 : 0;
  const activeTab = tabs.find(t=>t.path===active);
  const lang = mode==="single"?"javascript":langFromPath(active);

  /* ---------- render ---------- */
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <TopBar mode={mode} setMode={setMode} onSave={saveMaster} onBack={()=>navigate("/")} />

      <div style={{display:"flex",flex:1,minHeight:0}}>
        {/* sidebar */}
        <div style={{
          width:treeWidth,
          transition:"width .2s",
          overflow:"hidden",
          borderRight:"1px solid #d9d9d9"
        }}>
          {treeOpen && (
            <FileTree
              projects={allProjects}
              currentProject={projectName}
              files={files}
              onSelectFile={p=>{ setActive(p); scrollToSection(p); }}
              onSwitchProject={n => navigate(`/project/${encodeURIComponent(n)}`,{state:{projects:allProjects}})}
              onAddDir={d => !files.some(f=>f.startsWith(d)) && setFiles([...files,`${d}/__keep`])}
            />
          )}
        </div>

        {/* sidebar toggle */}
        <div
          onClick={()=>setTreeOpen(o=>!o)}
          style={{
            width:12, cursor:"pointer", userSelect:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"#f0f0f0", borderRight:"1px solid #d9d9d9",
            fontSize:12
          }}
        >
          {treeOpen ? "«" : "»"}
        </div>

        {/* code + preview split */}
        <Split
          direction="vertical"
          sizes={previewFull ? [0,100] : [70,30]}
          minSize={previewFull ? [0,0] : [200,150]}
          gutterSize={6}
          style={{flex:1,display:"flex",flexDirection:"column"}}
        >
          {/* code area */}
          <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
            <TabBar
              files={tabs}
              active={active}
              setActive={p=>{ setActive(p); scrollToSection(p); }}
              onClose={closeTab}
              onNewFile={()=>setModalOpen(true)}
              onRename={renameFile}
            />
            <div style={{flex:1,minHeight:0}}>
              {mode==="single" ? (
                <MonacoEditor
                  monaco={monaco}
                  language="javascript"
                  value={master}
                  onChange={setMaster}
                  editorDidMount={e=>editorRef.current=e}
                  options={{automaticLayout:true,lineNumbers:"off"}}
                />
              ) : (
                activeTab && (
                  <MonacoEditor
                    monaco={monaco}
                    language={lang}
                    value={activeTab.code}
                    onChange={val=>setTabs(tabs.map(t=>t.path===active?{...t,code:val}:t))}
                    editorDidMount={e=>editorRef.current=e}
                    options={{automaticLayout:true,lineNumbers:"off"}}
                  />
                )
              )}
            </div>
          </div>

          {/* preview pane */}
          <PreviewPane files={previewFiles} visible height={250} />
        </Split>
      </div>

      {/* preview full toggle */}
      <button
        onClick={()=>setPreviewFull(f=>!f)}
        style={{
          position:"fixed",right:16,bottom:60,
          padding:"4px 10px",border:"none",borderRadius:4,
          background:"#1677ff",color:"#fff",cursor:"pointer"
        }}
      >
        {previewFull?"Exit Full":"Preview Full"}
      </button>

      {/* new file modal */}
      <NewFileModal
        visible={modalOpen}
        onCreate={createFile}
        onCancel={()=>setModalOpen(false)}
        existingDirs={Array.from(
          new Set(tabs.map(t=>t.path.split("/").slice(0,-1).join("/")))
        )}
      />
    </div>
  );
}
export default Editor;