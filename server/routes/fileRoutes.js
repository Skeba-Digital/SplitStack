/* ==================================================================== */
/* === server/routes/fileRoutes.js ==================================== */
/* ==================================================================== */
import express from "express";
import path    from "path";
import fs      from "fs-extra";
import { splitMasterFile }   from "../utils/splitMasterFile.js";
import { composeMasterFile } from "../utils/composeMasterFile.js";

const router        = express.Router();
const PROJECTS_ROOT = path.resolve(process.cwd(), "..", "projects");

/* -------------------------------------------------- */
/* GET master.txt for a project                       */
/* -------------------------------------------------- */
router.get("/:project/master", async (req, res) => {
  const { project } = req.params;
  const masterPath  = path.join(PROJECTS_ROOT, project, "master.txt");

  if (!(await fs.pathExists(masterPath)))
    return res.status(404).json({ error: "Project not found" });

  const content = await fs.readFile(masterPath, "utf8");
  res.json({ content });
});

/* -------------------------------------------------- */
/* PUT (master → split into files)                    */
/* -------------------------------------------------- */
router.put("/:project/master", async (req, res) => {
  const { project } = req.params;
  const { content } = req.body;
  const projectDir  = path.join(PROJECTS_ROOT, project);

  if (!(await fs.pathExists(projectDir)))
    return res.status(404).json({ error: "Project not found" });

  const masterPath = path.join(projectDir, "master.txt");
  await fs.writeFile(masterPath, content, "utf8");

  const files = await splitMasterFile(projectDir, content);
  res.json({ files });                // list for the File‑Tree
});

/* -------------------------------------------------- */
/* POST (compose files → master.txt)                  */
/* -------------------------------------------------- */
router.post("/:project/compose", async (req, res) => {
  const { project } = req.params;
  const projectDir  = path.join(PROJECTS_ROOT, project);

  if (!(await fs.pathExists(projectDir)))
    return res.status(404).json({ error: "Project not found" });

  const { content, fileList } = await composeMasterFile(projectDir);

  await fs.writeFile(
    path.join(projectDir, "master.txt"),
    content,
    "utf8"
  );

  res.json({ content, files: fileList });
});

export default router;