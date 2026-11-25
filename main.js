import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CONFIG } from "./config.js";
import logoSvg from "./assets/nubank-logo.svg?raw";

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let markReady;
export const cardReady = new Promise((resolve) => { markReady = resolve; });
let scrollPose = 0;
export function setScrollPose(progress) { scrollPose = progress; }

const { acabamento } = CONFIG;
document.documentElement.style.setProperty("--card-color", acabamento.cor);
document.documentElement.style.setProperty("--glow", acabamento.brilho);

/* ---------- cena ---------- */
const stage = $("stage");
/* medidas do cartão (unidades = 10 mm) */
const W = 8.56, H = 5.4, R = 0.36, D = 0.12, BEV = 0.018;
const FRONT_Z = D / 2 + BEV;

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

/* posição do chip no cartão */
const CHIP = { w: 1.12, h: 0.86, x: -W / 2 + 1.2 + 0.56, y: 0.55 };
const MODEL_CHIP = { w: 1.28, h: 0.95, x: -2.77, y: 0.46 };

/* ---------- texturas desenhadas em canvas ---------- */
const PX = 200; // pixels por unidade
function makeCanvas(wUnits, hUnits) {
  const c = document.createElement("canvas");
  c.width = Math.round(wUnits * PX);
  c.height = Math.round(hUnits * PX);
  return c;
}
const toX = (u) => (u + W / 2) * PX;
const toY = (u) => (H / 2 - u) * PX;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const logoPaths = new DOMParser().parseFromString(logoSvg, "image/svg+xml").querySelectorAll("path");
const nubankLogo = new Path2D();
for (const path of logoPaths) {
  nubankLogo.addPath(new Path2D(path.getAttribute("d")));
}

function drawLogo(ctx, x, y, width) {
  const scale = width / 44;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fill(nubankLogo);
  ctx.restore();
}

function drawFront(ctx) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = acabamento.texto;
  ctx.textBaseline = "alphabetic";

  drawLogo(ctx, toX(-W / 2 + 0.7), toY(H / 2 - 0.48), 1.22 * PX);

  if (!usaModelo) {
    // contactless
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = acabamento.texto;
    ctx.lineWidth = 0.075 * PX;
    ctx.lineCap = "round";
    const cx = toX(W / 2 - 1.5), cy = toY(CHIP.y);
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx - 0.35, cy, i * 0.3 * PX, -0.75, 0.75);
      ctx.stroke();
    }

    // número em relevo (pontos + final)
    ctx.globalAlpha = 0.92;
    ctx.font = `600 ${0.46 * PX}px ${FONT}`;
    const num = `••••  ••••  ••••  ${CONFIG.ultimosDigitos}`;
    const nx = toX(-W / 2 + 0.7), ny = toY(-0.62);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillText(num, nx + 2, ny + 3);
    ctx.fillStyle = acabamento.texto;
    ctx.fillText(num, nx, ny);
  }

  // nome
  ctx.font = `600 ${0.34 * PX}px ${FONT}`;
  ctx.globalAlpha = 0.9;
  // no modelo, a faixa de baixo tem números em relevo: o nome sobe para não cobrir
  const yTexto = usaModelo ? -H / 2 + 1.25 : -H / 2 + 0.62;
  ctx.fillText(CONFIG.nomeNoCartao, toX(-W / 2 + 0.7), toY(yTexto));

  // tipo
  ctx.font = `700 ${0.3 * PX}px ${FONT}`;
  ctx.textAlign = "right";
  ctx.globalAlpha = 0.8;
  ctx.fillText("crédito", toX(W / 2 - 0.7), toY(yTexto));
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}

function drawBack(ctx) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  // tarja magnética
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, toY(H / 2 - 0.95), w, 1.0 * PX);
  // faixa de assinatura
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.fillRect(toX(-W / 2 + 0.7), toY(0.35), 4.6 * PX, 0.75 * PX);
  ctx.fillStyle = "#111";
  ctx.font = `italic 500 ${0.3 * PX}px ${FONT}`;
  ctx.fillText(CONFIG.nomeNoCartao.toLowerCase(), toX(-W / 2 + 0.9), toY(-0.02));
  ctx.fillStyle = acabamento.texto;
  ctx.globalAlpha = 0.7;
  drawLogo(ctx, toX(-W / 2 + 0.7), toY(-H / 2 + 0.7), 0.57 * PX);
  ctx.globalAlpha = 1;
}

function drawChip(ctx) {
  const { width: w, height: h } = ctx.canvas;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = w * 0.024;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(w * 0.35, h * 0.13, w * 0.30, h * 0.74, h * 0.11);
  for (const row of [0.34, 0.66]) {
    ctx.moveTo(w * 0.06, h * row);
    ctx.lineTo(w * 0.35, h * row);
    ctx.moveTo(w * 0.65, h * row);
    ctx.lineTo(w * 0.94, h * row);
  }
  ctx.stroke();
}

function addChip(chip, baseZ) {
  const depth = 0.014;
  const shape = roundedRect(chip.w, chip.h, 0.16);
  const plate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 }),
    new THREE.MeshStandardMaterial({ color: "#d4ae65", metalness: 0.63, roughness: 0.34 })
  );
  plate.position.set(chip.x, chip.y, baseZ);

  const canvas = makeCanvas(chip.w * 2, chip.h * 2);
  drawChip(canvas.getContext("2d"));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const traces = new THREE.Mesh(
    new THREE.PlaneGeometry(chip.w, chip.h),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
  );
  traces.position.set(chip.x, chip.y, baseZ + depth + 0.002);
  card.add(plate, traces);
}

/* ---------- construção do cartão ---------- */
let renderer, scene, camera, card;
const bodyColor = new THREE.Color(acabamento.cor);

/* ---------- cartão a partir do modelo GLB ---------- */
let usaModelo = false;
const REF_LUM = 0.55; // luminância (linear) do cinza do corpo na textura

function pintarCorpo(material) {
  // Recolore a malha e preserva os relevos. O chip tem material próprio.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBodyColor = { value: bodyColor };
    shader.uniforms.uRef = { value: REF_LUM };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aEdge;\nvarying float vEdge;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEdge = aEdge;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uBodyColor;\nuniform float uRef;\nvarying float vEdge;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        #ifdef USE_MAP
          float lum = dot(sampledDiffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          float k = mix(clamp(lum / uRef, 0.82, 1.08), 1.0, vEdge);
          diffuseColor.rgb = uBodyColor * k;
        #endif`
      )
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uBodyColor * 0.55 * vEdge;");
  };
  material.needsUpdate = true;
}

function addDecals() {
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  function makeDecal(draw) {
    const canvas = makeCanvas(W, H);
    draw(canvas.getContext("2d"));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    const material = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, depthWrite: false, toneMapped: false,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(W, H), material);
  }

  const front = makeDecal(drawFront);
  front.position.z = FRONT_Z + 0.002;
  const back = makeDecal(drawBack);
  back.rotation.y = Math.PI;
  back.position.z = -FRONT_Z - 0.002;
  card.add(front, back);
}

function buildModelCard(gltf) {
  usaModelo = true;
  card = new THREE.Group();
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = W / size.x;
  model.scale.set(s, s, s * (D / (size.z * s)));
  model.position.set(-center.x * s, -center.y * s, -center.z * s * (D / (size.z * s)));
  model.traverse((o) => {
    if (!o.isMesh) return;
    // Alisa o corpo: normais quase retas viram retas (tira os vincos) e as bordas
    // são marcadas para usar cor lisa, sem a textura bagunçada do contorno.
    const g = o.geometry;
    // Endireita as bordas retas (a malha vem levemente torta), sem mexer nos cantos.
    g.computeBoundingBox();
    const bb = g.boundingBox, pos = g.attributes.position;
    // tolerância mínima: só pontos praticamente na borda (o contactless fica perto dela e não pode ser puxado)
    const mX = (bb.max.x - bb.min.x) * 0.1, mY = (bb.max.y - bb.min.y) * 0.1, tol = 0.006;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const meioX = x > bb.min.x + mX && x < bb.max.x - mX;
      const meioY = y > bb.min.y + mY && y < bb.max.y - mY;
      if (meioX && y > bb.max.y - tol * 2) pos.setY(i, bb.max.y);
      else if (meioX && y < bb.min.y + tol * 2) pos.setY(i, bb.min.y);
      if (meioY && x > bb.max.x - tol * 2) pos.setX(i, bb.max.x);
      else if (meioY && x < bb.min.x + tol * 2) pos.setX(i, bb.min.x);
    }
    pos.needsUpdate = true;
    const n = g.attributes.normal;
    const edge = new Float32Array(n.count);
    for (let i = 0; i < n.count; i++) {
      const nz = n.getZ(i);
      if (nz > 0.85) n.setXYZ(i, 0, 0, 1);
      else if (nz < -0.85) n.setXYZ(i, 0, 0, -1);
      edge[i] = Math.abs(nz) <= 0.85 ? 1 : 0;
    }
    n.needsUpdate = true;
    g.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
    const mat = new THREE.MeshPhysicalMaterial({
      map: o.material.map, roughness: 0.55, metalness: 0.1,
      clearcoat: 0.18, clearcoatRoughness: 0.5, envMapIntensity: 0.65,
      side: THREE.DoubleSide, // tapa pequenos buracos da malha mostrando o interior
    });
    if (mat.map) { mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); }
    pintarCorpo(mat);
    o.material = mat;
  });
  // A abertura na face do GLB deixa o verso aparecer. O núcleo fica entre as duas faces.
  const innerDepth = D * 0.76;
  const inner = new THREE.ExtrudeGeometry(roundedRect(W - 0.004, size.y * s - 0.004, R + 0.04), {
    depth: innerDepth, bevelEnabled: false, curveSegments: 24,
  });
  inner.translate(0, 0, -innerDepth / 2);
  const innerMaterial = new THREE.MeshPhysicalMaterial({
    color: bodyColor, roughness: 0.55, metalness: 0.1,
    clearcoat: 0.18, clearcoatRoughness: 0.5, envMapIntensity: 0.65,
  });
  card.add(new THREE.Mesh(inner, innerMaterial), model);
  addDecals();
  addChip(MODEL_CHIP, D / 2 + 0.002);
  scene.add(card);
}

async function buildCard() {
  if (CONFIG.modelo) {
    try {
      const gltf = await new GLTFLoader().loadAsync(CONFIG.modelo);
      buildModelCard(gltf);
      stage.dataset.cardSource = "glb";
      return;
    } catch (error) {
      console.warn("Modelo indisponível. Usando a geometria local.", error);
      usaModelo = false;
      if (card) scene.remove(card);
    }
  }
  buildProceduralCard();
  stage.dataset.cardSource = "procedural";
}

function buildProceduralCard() {
  card = new THREE.Group();

  const geo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
    depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV,
    bevelSegments: 4, curveSegments: 32,
  });
  geo.translate(0, 0, -D / 2);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor, roughness: 0.42, metalness: 0.12,
    clearcoat: 0.55, clearcoatRoughness: 0.35,
  });
  card.add(new THREE.Mesh(geo, bodyMat));

  addDecals();

  addChip(CHIP, FRONT_Z + 0.004);

  scene.add(card);
}

/* ---------- interação (arrastar para girar) ---------- */
let rotY = 0, velY = 0, dragging = false, lastX = 0, flipTarget = null, tiltX = 0, tiltY = 0;
stage.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  if (event.repeat) return;
  const faceAtual = Math.round(rotY / Math.PI);
  flipTarget = (faceAtual + 1) * Math.PI;
  velY = 0;
});

function bindPointer() {
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    dragging = true; lastX = e.clientX; velY = 0; flipTarget = null;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (!e.isPrimary) return;
    const r = el.getBoundingClientRect();
    tiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
    tiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.25;
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    rotY += dx * 0.012; velY = dx * 0.012;
  });
  const end = () => { dragging = false; };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("lostpointercapture", end);
  el.addEventListener("pointerleave", () => { tiltX = 0; tiltY = 0; });
}

/* ---------- loop ---------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const half = (15 * Math.PI) / 180;
  const dist = Math.max(15, (W * 1.18) / (2 * Math.tan(half) * camera.aspect));
  camera.position.set(0, 0, dist);
  camera.updateProjectionMatrix();
}

async function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 8);
  scene.add(key);

  renderer.domElement.setAttribute("aria-hidden", "true");
  await buildCard();
  bindPointer();
  resize();
  new ResizeObserver(resize).observe(stage);

  const clock = new THREE.Clock();
  let interactiveYaw = -0.26;
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(stage);
  renderer.setAnimationLoop(() => {
    if (!visible || stage.style.visibility === "hidden") return;
    const reduce = reducedMotion.matches;
    const t = clock.getElapsedTime();
    // inércia e encaixe na face mais próxima
    if (!dragging) {
      rotY += reduce ? 0 : velY;
      velY *= reduce ? 0 : 0.92;
      const alvo = flipTarget ?? Math.round(rotY / Math.PI) * Math.PI;
      if (Math.abs(velY) < 0.004) rotY += (alvo - rotY) * (reduce ? 1 : 0.08);
      if (flipTarget !== null && Math.abs(flipTarget - rotY) < 0.002) flipTarget = null;
    }
    const yaw = reduce ? 0 : -0.26 + Math.sin(t * 0.7) * 0.09 + tiltY + scrollPose * 0.45;
    const pitch = reduce ? 0 : -0.14 + Math.sin(t * 0.9) * 0.04 + tiltX;
    interactiveYaw += (rotY + yaw - interactiveYaw) * (reduce ? 1 : 0.18);
    card.rotation.y = interactiveYaw + (reduce ? 0 : scrollPose * Math.PI * 2);
    card.rotation.x += (pitch - card.rotation.x) * (reduce ? 1 : 0.12);
    card.rotation.z = reduce ? 0 : 0.19 - scrollPose * 0.15;
    card.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.10;

    renderer.render(scene, camera);
  });

  card.rotation.set(-0.14, -0.26, 0.19);
  if (reducedMotion.matches) card.rotation.set(0, 0, 0);
  renderer.render(scene, camera);
  stage.classList.add("is-ready");
  stage.tabIndex = 0;
  stage.setAttribute("aria-label", "Cartão Nubank. Pressione Enter ou Espaço para girar.");
  stage.setAttribute("aria-keyshortcuts", "Enter Space");
}

init().catch((error) => {
  console.warn("3D indisponível. Usando a versão estática.", error);
  renderer?.dispose();
  renderer?.domElement.remove();
}).finally(markReady);
