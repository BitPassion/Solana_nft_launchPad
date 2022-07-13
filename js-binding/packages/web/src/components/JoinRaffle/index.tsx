import React from "react";
import ProjectDetails from "../ProjectDetails";
import Timer from "../Timer";
import Slider from "../Slider";

function JoinRaffle() {
  return (
    <div className="join-raffle">
      <Timer />
      <Slider />
      <ProjectDetails />
    </div>
  );
}

export default JoinRaffle;
