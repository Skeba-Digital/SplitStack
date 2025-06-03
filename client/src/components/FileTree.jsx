import React from "react";

function buildTree(paths) {
  const root = {};
  paths.forEach((p) => {
    const parts = p.split("/");
    let current = root;
    parts.forEach((part, idx) => {
      if (!current[part]) current[part] = idx === parts.length - 1 ? null : {};
      current = current[part] || {};
    });
  });
  return root;
}

function Tree({ node }) {
  return (
    <ul style={{ listStyle: "none", paddingLeft: "1rem" }}>
      {Object.entries(node).map(([name, child]) => (
        <li key={name}>
          {name}
          {child && <Tree node={child} />}
        </li>
      ))}
    </ul>
  );
}

function FileTree({ files }) {
  if (!files.length) return <p style={{ textAlign: "center" }}>No files yet.</p>;
  const tree = buildTree(files);
  return <Tree node={tree} />;
}

export default FileTree;
