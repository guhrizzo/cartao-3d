import React from "react";
import { createRoot } from "react-dom/client";
import GradientWaves from "./GradientWaves";

const art = document.querySelector(".hero-art-motion");
const root = createRoot(art);
root.render(
  <GradientWaves
    horizonColor="#5625B6"
    waveColor="#C379F8"
    crestColor="#FFE2FF"
    backgroundColor="#10051e"
    speed={0.4}
    amplitude={2.5}
    relief={1}
    lightAngle={120}
    intro={false}
    quality="low"
    dpr={0.8}
    mouseInteraction
    swellOnClick
  />
);

if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
