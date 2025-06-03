/* ================================================================== */
/* === client/src/components/FileTree.jsx (REPLACED) ================ */
/* ================================================================== */
import React from "react";
import { Tree } from "antd";
import { FolderOutlined, FileOutlined } from "@ant-design/icons";

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

  const toAntd = (obj, parentKey = "") =>
    Object.entries(obj).map(([name, child]) => {
      const key = parentKey ? `${parentKey}/${name}` : name;
      return child
        ? {
            title: name,
            key,
            icon: <FolderOutlined />,
            children: toAntd(child, key)
          }
        : {
            title: name,
            key,
            icon: <FileOutlined />,
            isLeaf: true
          };
    });

  return toAntd(root);
}

function FileTree({ files, rootName = "project" }) {
  if (!files.length) return <p style={{ textAlign: "center" }}>No files yet.</p>;
  const treeData = [{ title: rootName, key: rootName, icon: <FolderOutlined />, children: buildTreeData(files) }];
  return <Tree showIcon defaultExpandAll treeData={treeData} />;
}
export default FileTree;
