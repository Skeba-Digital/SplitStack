import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import MonacoEditor from "react-monaco-editor";
import FileTree from "../components/FileTree";

function Editor() {
  const { projectName } = useParams();
  const [code, setCode] = useState("// start typing...");
  const [files, setFiles] = useState([]);

  const loadMaster = async () => {
    const res = await axios.get(`/api/projects/${projectName}/master`);
    setCode(res.data.content);
    setFiles(res.data.files || []);
  };

  const saveMaster = async () => {
    const res = await axios.put(`/api/projects/${projectName}/master`, { content: code });
    setFiles(res.data.files);
    alert("Saved & split!");
  };

  useEffect(() => {
    loadMaster();
    // eslint-disable-next-line
  }, [projectName]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1 }}>
        <MonacoEditor
          language="javascript"
          value={code}
          onChange={setCode}
          options={{ automaticLayout: true }}
        />
        <button onClick={saveMaster} style={{ width: "100%", padding: "1rem" }}>
          Save & Split
        </button>
      </div>
      <div style={{ width: "300px", overflowY: "auto", borderLeft: "1px solid #ccc" }}>
        <h3 style={{ textAlign: "center" }}>File Tree</h3>
        <FileTree files={files} />
      </div>
    </div>
  );
}

export default Editor;
