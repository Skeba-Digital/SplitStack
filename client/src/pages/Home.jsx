import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProjectSelectorModal from "../components/ProjectSelectorModal";

function Home() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    const res = await axios.get("/api/projects");
    setProjects(res.data.projects);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openProject = (name) => navigate(`/project/${encodeURIComponent(name)}`);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>SplitStack Projects</h1>
      <button onClick={() => setShowModal(true)}>+ New Project</button>
      <ul>
        {projects.map((p) => (
          <li key={p}>
            <button onClick={() => openProject(p)}>{p}</button>
          </li>
        ))}
      </ul>
      {showModal && (
        <ProjectSelectorModal
          onClose={() => setShowModal(false)}
          onCreated={(name) => {
            setShowModal(false);
            openProject(name);
          }}
        />
      )}
    </div>
  );
}

export default Home;
