// client/src/pages/Editor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror      from "@uiw/react-codemirror";
import { javascript }  from "@codemirror/lang-javascript";
import { html }        from "@codemirror/lang-html";
import { css }         from "@codemirror/lang-css";
import { oneDark }     from "@codemirror/theme-one-dark";
import { lintGutter }  from "@codemirror/lint";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios  from "axios";
import { message } from "antd";
import Split  from "react-split";

import FileTree       from "../components/FileTree";
import TopBar         from "../components/TopBar";
import TabBar         from "../components/TabBar";
import NewFileModal   from "../components/NewFileModal";
import PreviewPane    from "../components/PreviewPane";
import { parseMasterFile } from "../utils/fileParser";

/* === IMPORTANT: point to your Express server, not React’s port! === */
const API_BASE = "http://localhost:5100/api/projects";

/* file extension → CodeMirror language extension */
const langExt = id =>
  id === "html"       ? html()
  : id === "css"      ? css()
  : javascript({ jsx: true });

/* derive language id from path */
const langIdFromPath = p =>
  p.endsWith(".html") || p.endsWith(".htm") ? "html"
  : p.endsWith(".css")                      ? "css"
  : "javascript";

function Editor() {
  const { projectName } = useParams();
  const allProjects     = useLocation().state?.projects || [projectName];
  const navigate        = useNavigate();
  const editorRef       = useRef(null);

  /* UI state */
  const [mode, setMode]         = useState("single");
  const [master, setMaster]     = useState("");
  const [tabs, setTabs]         = useState([]);        // [{ path, code }]
  const [active, setActive]     = useState("");
  const [files, setFiles]       = useState([]);        // file paths array
  const [treeOpen, setTreeOpen] = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [previewFull, setPreviewFull] = useState(false);

  /* build master content from open tabs */
  const buildMaster = arr =>
    arr.map(t => `// === file: ${t.path} ===\n${t.code.trimEnd()}`).join("\n\n");

  /* load and initialize on mount / project change */
  useEffect(() => {
    (async () => {
      try {
        // 1) Fetch full on-disk file list for the sidebar
        const { data: allFiles } = await axios.get(
          `${API_BASE}/${projectName}/files`
        );
        setFiles(allFiles.filter(f => f !== "master.txt" && f !== "tabs.json"));

        // 2) Fetch which tabs are open
        const { data: tabsData } = await axios.get(
          `${API_BASE}/${projectName}/tabs`
        );
        const initialTabPaths = Array.isArray(tabsData.tabs) ? tabsData.tabs : [];

        // 3) Fetch master.txt so we can pull code for those tabs
        const { data: masterData } = await axios.get(
          `${API_BASE}/${projectName}/master`
        );
        const masterContent = masterData.content || "";
        setMaster(masterContent);

        // 4) Parse master content into { path, code } entries
        const fullParsed = parseMasterFile(masterContent);
        const codeMap = {};
        fullParsed.forEach(entry => {
          codeMap[entry.path] = entry.code;
        });

        // 5) Build initial tabs array with code from master (if present)
        const initialTabs = initialTabPaths.map(p => ({
          path: p,
          code: codeMap[p] || ""
        }));
        setTabs(initialTabs);
        setActive(initialTabs[0]?.path || "");

        // 6) If no tabs saved, clear master (so single‐view is empty)
        if (initialTabs.length === 0) {
          setMaster("");
        }
      } catch {
        message.error("Failed to load project data");
      }
    })();
    // eslint-disable-next-line
  }, [projectName]);

  /* scroll to a section in single‐view mode */
  const scrollToSection = path => {
    if (!editorRef.current || mode !== "single") return;
    const rx = new RegExp(
      `^//\\s*===\\s*file:\\s*${path.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*===`,
      "m"
    );
    const m = master.match(rx);
    if (!m) return;
    const pos = editorRef.current.view.state.doc.lineAt(m.index + 1).from;
    editorRef.current.view.dispatch({
      selection: { anchor: pos },
      scrollIntoView: true
    });
  };

  /* save master.txt: only include open tabs (ignore all other files) */
  const saveMaster = async () => {
    try {
      let content;
      if (mode === "single") {
        content = master;
      } else {
        content = tabs.length ? buildMaster(tabs) : "";
      }

      await axios.put(`${API_BASE}/${projectName}/master`, { content });
      setMaster(content);

      // Re‐sync any code changes from master into tabs (if server changed anything)
      const parsedAfter = parseMasterFile(content);
      const updatedTabs = tabs.map(t => {
        const match = parsedAfter.find(e => e.path === t.path);
        return { path: t.path, code: match ? match.code : t.code };
      });
      setTabs(updatedTabs);
      setActive(updatedTabs[0]?.path || "");

      if (updatedTabs.length === 0) {
        setMaster("");
      }
      message.success("Saved & split!");
    } catch {
      message.error("Save failed");
    }
  };

  /* update tabs.json on the server (unless we’re deleting it) */
  const persistTabs = async newTabs => {
    const paths = newTabs.map(t => t.path);
    try {
      // If there are no tabs, call DELETE /tabs
      if (paths.length === 0) {
        await axios.delete(`${API_BASE}/${projectName}/tabs`);
      } else {
        // Otherwise, write the array
        await axios.put(`${API_BASE}/${projectName}/tabs`, { tabs: paths });
      }
    } catch {
      message.error("Failed to update open tabs");
    }
  };

  /* tab operations */
  const createFile = async p => {
    if (tabs.some(t => t.path === p)) return message.error("File exists");
    const newTab = { path: p, code: "" };
    const updatedTabs = [...tabs, newTab];
    setTabs(updatedTabs);
    setActive(p);

    // Persist to tabs.json (not empty now)
    await persistTabs(updatedTabs);

    // Add to sidebar file list if missing
    setFiles(f => (f.includes(p) ? f : [...f, p]));

    // Also update master in-memory to include this new file section
    setMaster(buildMaster(updatedTabs));

    setModalOpen(false);
  };

  /* closeTab: removes from tabs (does NOT delete file on disk) */
  const closeTab = async p => {
    const remaining = tabs.filter(t => t.path !== p);
    setTabs(remaining);
    setActive(remaining[0]?.path || "");

    // Persist updated tabs.json (this will DELETE if length is 0)
    await persistTabs(remaining);

    // Update master in-memory
    if (remaining.length === 0) {
      setMaster("");
    } else {
      setMaster(buildMaster(remaining));
    }
  };

  /* deleteFile: first delete on disk, then update state */
  const deleteFile = async pathToDelete => {
    try {
      // 1) Delete the actual file on disk
      await axios.delete(
         `${API_BASE}/${projectName}/files/${encodeURI(pathToDelete)}`
      );
      message.success(`Deleted ${pathToDelete}`);
    } catch (err) {
      console.error("Error deleting file on server:", err);
      return message.error("Failed to delete file on server");
    }

    // 2) If it was open in tabs, close it
    const remainingTabs = tabs.filter(t => t.path !== pathToDelete);
    setTabs(remainingTabs);
    setActive(remainingTabs[0]?.path || "");

    // Persist updated tabs.json (DELETE if length=0)
    await persistTabs(remainingTabs);

    // 3) Update in-memory master to drop that file
    if (remainingTabs.length === 0) {
      setMaster("");
    } else {
      setMaster(buildMaster(remainingTabs));
    }

    // 4) Remove from the local sidebar file list
    setFiles(f => f.filter(fpath => fpath !== pathToDelete));
  };

  /* openTab: adds a file to tabs when user selects from sidebar */
  const openTab = async p => {
    if (tabs.some(t => t.path === p)) {
      setActive(p);
      return;
    }
    // Pull code from master (if it exists)
    const parsed = parseMasterFile(master);
    const match = parsed.find(e => e.path === p);
    const newEntry = { path: p, code: match ? match.code : "" };

    const updatedTabs = [...tabs, newEntry];
    setTabs(updatedTabs);
    setActive(p);

    // Persist updated tabs.json
    await persistTabs(updatedTabs);

    // Update master in-memory to include this new file
    setMaster(buildMaster(updatedTabs));
  };

  /* preview files for the iframe (based on mode) */
  const previewFiles = useMemo(
    () => (mode === "single" ? parseMasterFile(master) : tabs),
    [mode, master, tabs]
  );

  /* current code value and language for editor */
  const codeValue =
    mode === "single"
      ? master
      : tabs.find(t => t.path === active)?.code || "";

  const langId = mode === "single" ? "javascript" : langIdFromPath(active);

  const onCodeChange = val => {
    if (mode === "single") {
      setMaster(val);
    } else {
      const updatedTabs = tabs.map(t =>
        t.path === active ? { ...t, code: val } : t
      );
      setTabs(updatedTabs);
      setMaster(buildMaster(updatedTabs));
    }
  };

  // ——————————————————————————
  // FULL‐SCREEN PREVIEW MODE
  // ——————————————————————————
  if (previewFull) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar
          onSave={saveMaster}
          onBack={() => setPreviewFull(false)}
        />
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0
          }}
        >
          <PreviewPane files={previewFiles} visible />
          <button
            onClick={() => setPreviewFull(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Exit Full
          </button>
        </div>
      </div>
    );
  }

  // ——————————————————————————
  // NORMAL MODE (Split: code / preview)
  // ——————————————————————————
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar
        onSave={saveMaster}
        onBack={() => navigate("/")}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* file tree panel */}
        {treeOpen && (
          <div
            style={{
              flex: "0 0 240px",
              overflow: "auto",
              borderRight: "1px solid #d9d9d9"
            }}
          >
            <FileTree
              projects={allProjects}
              currentProject={projectName}
              files={files}
              onSelectFile={openTab}
              onSwitchProject={n =>
                navigate(`/project/${encodeURIComponent(n)}`, { state: { projects: allProjects } })
              }
              onAddDir={d =>
                !files.some(f => f.startsWith(d)) &&
                setFiles([...files, `${d}/__keep`])
              }
              onDeleteFile={deleteFile}
            />
          </div>
        )}

        {/* always-visible sidebar toggle */}
        <div
          onClick={() => setTreeOpen(v => !v)}
          style={{
            width: 14,
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fafafa",
            borderRight: "1px solid #d9d9d9",
            fontSize: 12
          }}
        >
          {treeOpen ? "«" : "»"}
        </div>

        {/* main split: code on top, preview on bottom */}
        <Split
          direction="vertical"
          sizes={[60, 40]}
          minSize={[150, 120]}
          gutterSize={12}
          gutterAlign="center"
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          gutterStyle={() => ({ background: "#d9d9d9", cursor: "row-resize", height: "12px" })}
        >
          {/* code pane */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "4px 8px" }}>
              <button
                onClick={() => setMode("single")}
                style={{
                  marginRight: 8,
                  padding: "4px 12px",
                  background: mode === "single" ? "#1890ff" : "#fff",
                  color: mode === "single" ? "#fff" : "#000",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                Master
              </button>
              <button
                onClick={() => setMode("tabs")}
                style={{
                  marginRight: 16,
                  padding: "4px 12px",
                  background: mode === "tabs" ? "#1890ff" : "#fff",
                  color: mode === "tabs" ? "#fff" : "#000",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                Tabs
              </button>
              <TabBar
                files={tabs}
                active={active}
                setActive={p => {
                  setActive(p);
                  if (mode === "single") scrollToSection(p);
                }}
                onClose={closeTab}
                onNewFile={() => setModalOpen(true)}
                onRename={async (oldP, newP) => {
                  if (tabs.some(t => t.path === newP)) return message.error("Name in use");
                  const updatedTabs = tabs.map(t => (t.path === oldP ? { ...t, path: newP } : t));
                  setTabs(updatedTabs);
                  setActive(newP);

                  // Persist renamed tabs array
                  await persistTabs(updatedTabs);

                  // Update master in-memory (rename inside content)
                  const parsed = parseMasterFile(master).map(entry =>
                    entry.path === oldP
                      ? { path: newP, code: entry.code }
                      : entry
                  );
                  const rebuiltMaster = buildMaster(parsed);
                  setMaster(rebuiltMaster);

                  // Also update sidebar files list
                  setFiles(files.map(f => (f === oldP ? newP : f)));
                }}
              />
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              {mode === "single" ? (
                <CodeMirror
                  value={master}
                  height="100%"
                  theme={oneDark}
                  extensions={[langExt("javascript"), lintGutter()]}
                  onChange={val => setMaster(val)}
                  ref={editorRef}
                />
              ) : (
                tabs.find(t => t.path === active) && (
                  <CodeMirror
                    value={tabs.find(t => t.path === active).code}
                    height="100%"
                    theme={oneDark}
                    extensions={[langExt(langId), lintGutter()]}
                    onChange={val => onCodeChange(val)}
                    ref={editorRef}
                  />
                )
              )}
            </div>
          </div>

          {/* live preview pane */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <PreviewPane files={previewFiles} visible />
          </div>
        </Split>
      </div>

      {/* preview full toggle */}
      <button
        onClick={() => setPreviewFull(true)}
        style={{
          position: "fixed",
          right: 16,
          bottom: 60,
          padding: "4px 10px",
          border: "none",
          borderRadius: 4,
          background: "#1677ff",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Preview Full
      </button>

      {/* new-file modal */}
      <NewFileModal
        visible={modalOpen}
        onCreate={createFile}
        onCancel={() => setModalOpen(false)}
        existingDirs={Array.from(new Set(tabs.map(t => t.path.split("/").slice(0, -1).join("/"))))}
      />
    </div>
  );
}

export default Editor;