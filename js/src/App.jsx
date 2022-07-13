import React from "react";
import ProjectDetails from "./components/ProjectDetails";
import Timer from "./components/Timer";
import "./App.css";
import Slider from "./components/Slider";

function App() {
  return (
    <div className="App">
      <Timer />
      <Slider />
      <ProjectDetails />
    </div>
  );
}

export default App;
