import express from "express";
import fs      from "fs-extra";
import path    from "path";

const router        = express.Router();
const PROJECTS_ROOT = path.resolve(process.cwd(), "..", "projects");

fs.ensureDirSync(PROJECTS_ROOT);

/* ---------- list ---------- */
router.get("/", async (_req, res) => {
  const items = await fs.readdir(PROJECTS_ROOT);
  const dirs  = [];
  for (const item of items) {
    const stat = await fs.stat(path.join(PROJECTS_ROOT, item));
    if (stat.isDirectory()) dirs.push(item);
  }
  res.json({ projects: dirs });
});

/* ---------- create ---------- */
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  const dir = path.join(PROJECTS_ROOT, name);
  if (await fs.pathExists(dir)) return res.status(400).json({ error: "Exists" });

  await fs.mkdir(dir);
  await fs.writeFile(path.join(dir, "master.txt"), "", "utf8");
  res.json({ message: "created" });
});

/* ---------- delete ---------- */
router.delete("/:name", async (req, res) => {
  const { name } = req.params;
  const dir = path.join(PROJECTS_ROOT, name);
  if (!(await fs.pathExists(dir))) return res.status(404).json({ error: "Not found" });

  await fs.remove(dir);
  res.json({ message: "deleted" });
});

export default router;