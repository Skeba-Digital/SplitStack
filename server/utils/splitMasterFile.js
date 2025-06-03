/* === server/utils/splitMasterFile.js === */
import fs   from "fs-extra";
import path from "path";

/**
 * Parse the master file, create dirs, and write each extracted file.
 * Delimiter format: // === file: path/to/file.js ===
 * Returns an array of file paths that were written.
 */
export async function splitMasterFile(projectDir, content) {
  const regex = /^\/\/\s*===\s*file:\s*(.*?)\s*===\s*$/gm;
  let match;
  const files = [];
  let lastIdx      = 0;
  let currentPath  = null;

  const push = (p, start, end) => {
    const code = content.slice(start, end).trimStart();
    files.push({ path: p, code });
  };

  while ((match = regex.exec(content)) !== null) {
    if (currentPath !== null) push(currentPath, lastIdx, match.index);
    currentPath = match[1].trim();
    lastIdx     = regex.lastIndex;
  }
  if (currentPath !== null) push(currentPath, lastIdx, content.length);

  // Write each extracted file to disk
  const written = [];
  for (const { path: rel, code } of files) {
    const full = path.join(projectDir, rel);
    await fs.ensureDir(path.dirname(full));
    await fs.writeFile(full, code, "utf8");
    written.push(rel);
  }
  return written;
}