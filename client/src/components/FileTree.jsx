/* =================================================================== */
/* === 2 | client/src/components/FileTree.jsx (REPLACED) ============= */
/* =================================================================== */
import React from "react";
import { Tree, Modal, Input, message } from "antd";
import { FolderOpenOutlined, FolderOutlined, FileOutlined } from "@ant-design/icons";

function buildTreeData(paths) {
  const root = {};
  paths.forEach(p => {
    const parts = p.split("/");
    let node = root;
    parts.forEach((part, idx) => {
      if (!node[part]) node[part] = idx === parts.length - 1 ? null : {};
      node = node[part] || {};
    });
  });
  const toAntd = (obj, parent = "") =>
    Object.entries(obj).map(([name, child]) => {
      const key = parent ? `${parent}/${name}` : name;
      return child
        ? {
            title: name,
            key,
            icon: <FolderOutlined />,
            children: toAntd(child, key),
            isLeaf: false
          }
        : { title: name, key, icon: <FileOutlined />, isLeaf: true };
    });
  return toAntd(root);
}

function FileTree({
  projects,
  currentProject,
  files,
  onSelectFile,
  onSwitchProject,
  onAddDir
}) {
  const rootNodes = projects.map(p => ({
    title: p,
    key: p,
    icon: p === currentProject ? <FolderOpenOutlined /> : <FolderOutlined />,
    children: p === currentProject ? buildTreeData(files) : [],
    isLeaf: false
  }));

  const handleSelect = ([key], { node }) => {
    if (!key) return;
    if (projects.includes(key)) {
      if (key !== currentProject) onSwitchProject(key);
    } else {
      if (node.isLeaf) onSelectFile(key);
    }
  };

  /* new folder menu */
  const handleRightClick = ({ node }) => {
    if (node.isLeaf) return;
    Modal.confirm({
      title: "New folder inside " + node.key,
      content: <Input id="newDirInput" placeholder="folder-name" />,
      okText: "Create",
      onOk: () => {
        const name = document.getElementById("newDirInput").value.trim();
        if (!name) return;
        const newPath = `${node.key}/${name}`;
        onAddDir(newPath);
        message.success("Folder added (save to persist)");
      }
    });
  };

  return (
    <Tree
      showIcon
      defaultExpandAll
      treeData={rootNodes}
      onSelect={handleSelect}
      onRightClick={handleRightClick}
      style={{ width: 220, overflowY: "auto", borderRight: "1px solid #aaa" }}
    />
  );
}
export default FileTree;
