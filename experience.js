import "@fontsource-variable/manrope";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import heroImage from "./assets/hero-violeta.webp?url";

const motion = matchMedia("(prefers-reduced-motion: reduce)");
const loader = document.getElementById("preloader");
const art = document.querySelector(".hero-art");
const image = new Image();
image.src = heroImage;
const imageReady = image.decode().then(() => {
  art.style.setProperty("--hero-image", `url("${heroImage}")`);
});
let updateCardPose = () => {};
const cardReady = import("./main.js").then(({ cardReady, setScrollPose }) => {
  updateCardPose = setScrollPose;
  return cardReady;
});
const windowReady = document.readyState === "complete"
  ? Promise.resolve()
  : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
const media = gsap.matchMedia();
let smoother;
const sceneSection = document.querySelector(".scenes-section");
const sceneViewport = sceneSection.querySelector(".scenes-viewport");
const sceneTrack = sceneSection.querySelector(".scenes-track");
const sceneWindow = sceneSection.querySelector(".scenes-window");
const scenePanels = sceneTrack.querySelectorAll(".scene-panel");
const sceneDistance = () => Math.max(0, sceneTrack.scrollWidth - sceneViewport.clientWidth);

function updateSceneLayers() {
  const width = sceneViewport.clientWidth;
  if (!width) return;
  const end = sceneDistance();
  const position = sceneSection.classList.contains("is-pinned")
    ? -Number(gsap.getProperty(sceneTrack, "x"))
    : sceneViewport.scrollLeft;
  const offset = gsap.utils.clamp(0, end, position);
  const fadeWidth = Math.min(62, Math.max(20, width * 0.068));
  sceneWindow.style.setProperty("--edge-width", fadeWidth + "px");
  sceneWindow.style.setProperty("--edge-left", Math.min(1, offset / fadeWidth));
  sceneWindow.style.setProperty("--edge-right", Math.min(1, (end - offset) / fadeWidth));

  if (!sceneSection.classList.contains("has-panel-motion")) return;
  const viewportCenter = offset + width / 2;
  scenePanels.forEach((panel) => {
    const center = panel.offsetLeft + panel.offsetWidth / 2;
    const relative = (viewportCenter - center) / (width / 2 + panel.offsetWidth * 0.17);
    const shift = 11 * gsap.utils.clamp(-1, 1, relative);
    panel.style.setProperty("--scene-shift", shift.toFixed(2) + "%");
  });
}

sceneViewport.addEventListener("scroll", updateSceneLayers, { passive: true });
new ResizeObserver(updateSceneLayers).observe(sceneViewport);
ScrollTrigger.addEventListener("refresh", updateSceneLayers);

media.add("(prefers-reduced-motion: no-preference)", () => {
  smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.1,
    smoothTouch: false,
    effects: false,
  });

  const reveal = { y: 22, opacity: 0.64, duration: 0.72, ease: "power2.out" };
  gsap.utils.toArray("[data-reveal]").forEach((element) => {
    gsap.from(element, {
      ...reveal,
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  });

  const heroEntrance = gsap.from(".hero-copy > *", { ...reveal, stagger: 0.1, paused: true });
  const revealHero = () => heroEntrance.play();
  if (loader.hidden || loader.classList.contains("is-leaving")) revealHero();
  else window.addEventListener("nubank:intro-revealing", revealHero, { once: true });

  const panelObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ intersectionRatio, target }) => {
      if (intersectionRatio < 0.26) return;
      target.classList.add("is-in-view");
      panelObserver.unobserve(target);
    });
  }, { threshold: 0.26 });
  sceneSection.classList.add("has-panel-motion");
  scenePanels.forEach((panel) => panelObserver.observe(panel));
  updateSceneLayers();

  const photoFrames = document.querySelectorAll(".photo-frame");
  photoFrames.forEach((frame) => {
    frame.classList.add("has-parallax");
    gsap.fromTo(frame.querySelector("img"), { yPercent: -13.5 }, {
      yPercent: 13.5,
      ease: "none",
      scrollTrigger: {
        trigger: frame,
        start: "top 84%",
        end: "clamp(bottom 24%)",
        scrub: 0.35,
      },
    });
  });

  art.classList.add("has-parallax");
  gsap.to(".hero-art-motion", {
    yPercent: 15,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.45 },
  });

  const tiers = document.querySelector(".savings-options");
  const lightLeak = gsap.timeline({
    scrollTrigger: { trigger: tiers, start: "top 90%", end: "bottom 30%", scrub: 0.55 },
  });

  tiers.querySelectorAll("article").forEach((card, index) => {
    const start = index * 0.46;
    lightLeak.fromTo(card, { "--leak-offset": "-58%" }, {
      "--leak-offset": "58%",
      duration: 0.64,
      ease: "none",
    }, start);
    lightLeak.to(card, { "--leak-opacity": 0.86, duration: 0.28, ease: "sine.out" }, start);
    lightLeak.to(card, { "--leak-opacity": 0, duration: 0.36, ease: "sine.in" }, start + 0.28);
  });

  const hero = document.querySelector(".hero");
  const details = document.querySelector(".details");
  const stage = document.getElementById("stage");
  const origin = document.querySelector(".stage-anchor");
  const arrival = document.querySelector(".card-arrival");
  const arrivalFraction = 0.56;
  const fadeStart = 0.77;
  const pose = { progress: 0 };
  let journey;

  function measureJourney() {
    const start = origin.getBoundingClientRect();
    const end = arrival.getBoundingClientRect();
    const centerY = end.top + end.height / 2;
    const heroTop = hero.getBoundingClientRect().top;
    const headerHeight = document.querySelector(".header").offsetHeight;
    const startScroll = Math.max(0, start.top - heroTop - headerHeight + 12);
    const travel = Math.max(window.innerHeight * 0.28, centerY - heroTop - window.innerHeight * 0.57 - startScroll);
    journey = {
      startScroll,
      travel,
      x: end.left + end.width / 2 - (start.left + start.width / 2),
      y: centerY - (start.top + start.height / 2),
      scale: end.width / start.width,
    };
  }

  details.classList.add("has-card-journey");
  measureJourney();
  const flight = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: () => `top+=${journey.startScroll} top`,
      end: () => `+=${journey.travel / arrivalFraction}`,
      scrub: 0.45,
      invalidateOnRefresh: true,
      onRefreshInit: measureJourney,
    },
    onUpdate() {
      stage.classList.toggle("is-in-transit", this.progress() > 0.04);
    },
  });
  flight.to(stage, {
    x: () => journey.x,
    y: () => journey.y,
    scale: () => journey.scale,
    duration: arrivalFraction,
    ease: "none",
  }, 0);
  flight.to(stage, {
    y: () => journey.y - 24,
    scale: () => journey.scale * 0.93,
    autoAlpha: 0,
    duration: 1 - fadeStart,
    ease: "sine.inOut",
  }, fadeStart);
  flight.to(pose, {
    progress: 1,
    duration: arrivalFraction,
    ease: "sine.inOut",
    onUpdate: () => updateCardPose(pose.progress),
  }, 0);

  return () => {
    window.removeEventListener("nubank:intro-revealing", revealHero);
    panelObserver.disconnect();
    sceneSection.classList.remove("has-panel-motion");
    scenePanels.forEach((panel) => panel.classList.remove("is-in-view"));
    photoFrames.forEach((frame) => frame.classList.remove("has-parallax"));
    art.classList.remove("has-parallax");
    details.classList.remove("has-card-journey");
    stage.classList.remove("is-in-transit");
    updateCardPose(0);
    smoother?.kill();
    smoother = undefined;
  };
});

media.add("(min-width: 861px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)", () => {
  const progress = sceneSection.querySelector(".scenes-progress > div");
  const header = document.querySelector(".header");

  sceneSection.classList.add("is-pinned");
  sceneViewport.scrollLeft = 0;
  const horizontal = gsap.timeline({
    scrollTrigger: {
      trigger: sceneSection,
      start: () => `top top+=${header.offsetHeight}`,
      end: () => `+=${sceneDistance() * 1.2}`,
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 1,
    },
  })
    .to(sceneTrack, { x: () => -sceneDistance(), ease: "none", onUpdate: updateSceneLayers }, 0)
    .fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);

  function scrollWithArrows(event) {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const trigger = horizontal.scrollTrigger;
    const target = trigger.scroll() + direction * sceneViewport.clientWidth * 0.55;
    trigger.scroll(gsap.utils.clamp(trigger.start, trigger.end, target));
  }
  sceneViewport.addEventListener("keydown", scrollWithArrows);

  return () => {
    sceneViewport.removeEventListener("keydown", scrollWithArrows);
    sceneSection.classList.remove("is-pinned");
    updateSceneLayers();
  };
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const hash = link.getAttribute("href");
  const target = document.getElementById(hash.slice(1));
  if (!target) return;

  event.preventDefault();
  if (location.hash !== hash) history.pushState(null, "", hash);
  target.focus({ preventScroll: true });
  if (smoother && !ScrollTrigger.isTouch) {
    const offset = target.id === "inicio" ? 0 : document.querySelector(".header").offsetHeight + 12;
    smoother.scrollTo(Math.max(0, smoother.offset(target, "top top") - offset), true);
  } else {
    target.scrollIntoView({ behavior: motion.matches ? "instant" : "smooth" });
  }
});

const fontsReady = Promise.all([document.fonts.load('800 16px "Manrope Variable"'), document.fonts.ready]);
const loadWaves = () => import("./hero-waves.jsx").catch((error) => {
  console.warn("GradientWaves indisponível. Usando o fundo estático.", error);
});
if (loader.hidden || loader.classList.contains("is-leaving")) loadWaves();
else window.addEventListener("nubank:intro-revealing", loadWaves, { once: true });
Promise.allSettled([imageReady, cardReady, windowReady, fontsReady]).then(() => {
  ScrollTrigger.refresh();
  window.completePreloader?.();
});
