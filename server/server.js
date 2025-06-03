/* === server/server.js === */
import express from "express";
import cors     from "cors";
import path     from "path";
import fs       from "fs-extra";
import projectRoutes from "./routes/projectRoutes.js";
import fileRoutes    from "./routes/fileRoutes.js";

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api/projects", projectRoutes);
app.use("/api/projects", fileRoutes);          // nested under same base

// Serve CRA build (when `npm run build` has been executed)
const buildPath = path.join(process.cwd(), "..", "client", "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (_, res) =>
    res.sendFile(path.join(buildPath, "index.html"))
  );
}

app.listen(PORT, () => console.log(`✅  Server running on port ${PORT}`));
