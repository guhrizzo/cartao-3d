import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CONFIG } from "./config.js?v=5";

/* ---------- textos e links vindos do config ---------- */
const $ = (id) => document.getElementById(id);
$("marca").textContent = CONFIG.marca;
$("titulo").textContent = CONFIG.titulo;
$("subtitulo").textContent = CONFIG.subtitulo;
$("rodape").textContent = `© ${new Date().getFullYear()} ${CONFIG.marca}`;
document.title = `${CONFIG.marca} • Site que chama atenção`;
const zap = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Oi! Vi o cartão 3D e quero um site assim.")}`;
$("cta-whats").href = zap;
$("cta-principal").href = zap;
$("cta-principal").target = "_blank";
$("cta-principal").rel = "noopener";
$("cta-insta").href = `https://instagram.com/${CONFIG.instagram}`;
$("grade").innerHTML = CONFIG.beneficios
  .map((b) => `<article class="item"><h3>${b.t}</h3><p>${b.d}</p></article>`)
  .join("");

/* ---------- estado dos temas ---------- */
const temas = CONFIG.temas;
let idx = 0;
let auto = true;
let autoTimer = null;

/* ---------- cena ---------- */
const stage = $("stage");
const webglOk = (() => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
})();

if (!webglOk) {
  stage.innerHTML = '<p class="sem-webgl">Seu navegador não conseguiu abrir o 3D.</p>';
}

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

function drawFront(ctx, tema) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = tema.texto;
  ctx.textBaseline = "alphabetic";

  // marca (texto simples, sem logotipo de terceiros)
  ctx.font = `800 ${0.52 * PX}px ${FONT}`;
  ctx.globalAlpha = 0.96;
  ctx.fillText(CONFIG.marca, toX(-W / 2 + 0.7), toY(H / 2 - 0.95));

  if (!usaModelo) {
    // contactless
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = tema.texto;
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
    ctx.fillStyle = tema.texto;
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

function drawBack(ctx, tema) {
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
  ctx.fillStyle = tema.texto;
  ctx.globalAlpha = 0.7;
  ctx.font = `500 ${0.24 * PX}px ${FONT}`;
  ctx.fillText(CONFIG.marca, toX(-W / 2 + 0.7), toY(-H / 2 + 0.7));
  ctx.globalAlpha = 1;
}

function drawChip(ctx) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(90,60,10,.75)";
  ctx.lineWidth = 3;
  const m = 6;
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
  [1 / 3, 2 / 3].forEach((f) => {
    ctx.beginPath(); ctx.moveTo(w * f, m); ctx.lineTo(w * f, h - m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m, h * f); ctx.lineTo(w - m, h * f); ctx.stroke();
  });
  ctx.strokeRect(w / 3, h / 3, w / 3, h / 3);
}

/* ---------- construção do cartão ---------- */
let renderer, scene, camera, card, bodyMat, frontTex, backTex, frontCtx, backCtx;
const bodyColor = new THREE.Color(temas[0].cor);
const targetColor = new THREE.Color(temas[0].cor);

/* ---------- cartão a partir do modelo GLB ---------- */
let usaModelo = false;
const REF_LUM = 0.55; // luminância (linear) do cinza do corpo na textura

function pintarCorpo(material) {
  // Troca só a cor cinza do corpo; o dourado do chip e os relevos continuam.
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
        float gold = 0.0;
        #ifdef USE_MAP
          vec3 texC = sampledDiffuseColor.rgb;
          float mx = max(texC.r, max(texC.g, texC.b));
          float mn = min(texC.r, min(texC.g, texC.b));
          gold = smoothstep(0.14, 0.32, (mx - mn) / max(mx, 0.0001)) * (1.0 - vEdge);
          float lum = dot(texC, vec3(0.2126, 0.7152, 0.0722));
          float k = mix(clamp(lum / uRef, 0.82, 1.08), 1.0, vEdge);
          vec3 ouro = mix(texC, vec3(0.72, 0.45, 0.08), 0.55);
          diffuseColor.rgb = mix(uBodyColor * k, ouro, gold);
        #endif`
      )
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uBodyColor * 0.55 * vEdge;")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.3, gold);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.85, gold);");
  };
  material.needsUpdate = true;
}

function addDecals() {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const decalMat = (tex) => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, toneMapped: false,
  });
  const fc = makeCanvas(W, H); frontCtx = fc.getContext("2d");
  frontTex = new THREE.CanvasTexture(fc);
  frontTex.colorSpace = THREE.SRGBColorSpace; frontTex.anisotropy = aniso;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), decalMat(frontTex));
  front.position.z = FRONT_Z + 0.002;
  card.add(front);
  const bc = makeCanvas(W, H); backCtx = bc.getContext("2d");
  backTex = new THREE.CanvasTexture(bc);
  backTex.colorSpace = THREE.SRGBColorSpace; backTex.anisotropy = aniso;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), decalMat(backTex));
  back.rotation.y = Math.PI;
  back.position.z = -FRONT_Z - 0.002;
  card.add(back);
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
    const mX = (bb.max.x - bb.min.x) * 0.1, mY = (bb.max.y - bb.min.y) * 0.1, tol = 0.025;
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
  card.add(model);
  addDecals();
  scene.add(card);
  applyTheme(false);
}

function buildCard() {
  const fallback = () => buildProceduralCard();
  if (!CONFIG.modelo) return fallback();
  new GLTFLoader().load(
    CONFIG.modelo,
    (gltf) => { try { buildModelCard(gltf); } catch (e) { console.error(e); fallback(); } },
    undefined,
    (err) => { console.warn("Modelo não carregou, usando cartão em código.", err); fallback(); }
  );
}

function buildProceduralCard() {
  card = new THREE.Group();

  const geo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
    depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV,
    bevelSegments: 4, curveSegments: 32,
  });
  geo.translate(0, 0, -D / 2);
  bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor, roughness: 0.42, metalness: 0.12,
    clearcoat: 0.55, clearcoatRoughness: 0.35,
  });
  card.add(new THREE.Mesh(geo, bodyMat));

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const decalMat = (tex) => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, toneMapped: false,
  });

  // frente
  const fc = makeCanvas(W, H); frontCtx = fc.getContext("2d");
  frontTex = new THREE.CanvasTexture(fc);
  frontTex.colorSpace = THREE.SRGBColorSpace; frontTex.anisotropy = aniso;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), decalMat(frontTex));
  front.position.z = FRONT_Z + 0.002;
  card.add(front);

  // verso
  const bc = makeCanvas(W, H); backCtx = bc.getContext("2d");
  backTex = new THREE.CanvasTexture(bc);
  backTex.colorSpace = THREE.SRGBColorSpace; backTex.anisotropy = aniso;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), decalMat(backTex));
  back.rotation.y = Math.PI;
  back.position.z = -FRONT_Z - 0.002;
  card.add(back);

  // chip em ouro (placa metálica + linhas)
  const chipGeo = new THREE.ExtrudeGeometry(roundedRect(CHIP.w, CHIP.h, 0.16), {
    depth: 0.012, bevelEnabled: false, curveSegments: 16,
  });
  const chip = new THREE.Mesh(chipGeo, new THREE.MeshStandardMaterial({
    color: "#d8b45f", metalness: 0.95, roughness: 0.28,
  }));
  chip.position.set(CHIP.x, CHIP.y, FRONT_Z + 0.004);
  card.add(chip);
  const lc = document.createElement("canvas"); lc.width = 224; lc.height = 172;
  drawChip(lc.getContext("2d"));
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  const lines = new THREE.Mesh(
    new THREE.PlaneGeometry(CHIP.w, CHIP.h),
    new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthWrite: false, toneMapped: false })
  );
  lines.position.set(CHIP.x, CHIP.y, FRONT_Z + 0.0175);
  card.add(lines);

  scene.add(card);
  applyTheme(false);
}

function applyTheme(updateUI = true) {
  const tema = temas[idx];
  targetColor.set(tema.cor);
  document.body.dataset.theme = tema.id;
  document.documentElement.style.setProperty("--glow", tema.brilho);
  if (frontCtx) { drawFront(frontCtx, tema); frontTex.needsUpdate = true; }
  if (backCtx) { drawBack(backCtx, tema); backTex.needsUpdate = true; }
  if (updateUI) {
    [...$("cores").children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === idx)));
  }
}

/* ---------- botões de cor ---------- */
$("cores").innerHTML = temas
  .map((t, i) => `<button class="cor" type="button" data-i="${i}" aria-pressed="${i === 0}"><i style="background:${t.cor}"></i>${t.nome}</button>`)
  .join("");
$("cores").addEventListener("click", (e) => {
  const b = e.target.closest(".cor");
  if (!b) return;
  setAuto(false);
  idx = Number(b.dataset.i);
  applyTheme();
});

function setAuto(on) {
  auto = on;
  clearInterval(autoTimer);
  if (on && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    autoTimer = setInterval(() => { idx = (idx + 1) % temas.length; applyTheme(); }, CONFIG.trocaAutomaticaMs);
  }
  const b = $("btn-auto");
  b.setAttribute("aria-pressed", String(on));
  b.textContent = `Troca automática: ${on ? "ligada" : "desligada"}`;
}
$("btn-auto").addEventListener("click", () => setAuto(!auto));

/* ---------- interação (arrastar para girar) ---------- */
let rotY = 0, velY = 0, dragging = false, lastX = 0, flipTarget = null, tiltX = 0, tiltY = 0;
$("btn-virar").addEventListener("click", () => {
  const faceAtual = Math.round(rotY / Math.PI);
  flipTarget = (faceAtual + 1) * Math.PI;
});

function bindPointer() {
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; velY = 0; flipTarget = null;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
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

function init() {
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

  buildCard();
  bindPointer();
  resize();
  new ResizeObserver(resize).observe(stage);

  const clock = new THREE.Clock();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    if (!card) return renderer.render(scene, camera);
    // inércia e encaixe na face mais próxima
    if (!dragging) {
      rotY += velY; velY *= 0.92;
      const alvo = flipTarget ?? Math.round(rotY / Math.PI) * Math.PI;
      if (Math.abs(velY) < 0.004) rotY += (alvo - rotY) * 0.08;
      if (flipTarget !== null && Math.abs(flipTarget - rotY) < 0.002) flipTarget = null;
    }
    const sway = reduce ? 0 : Math.sin(t * 0.7) * 0.1;
    card.rotation.y += ((rotY + sway + tiltY) - card.rotation.y) * 0.18;
    card.rotation.x += ((reduce ? 0 : Math.sin(t * 0.9) * 0.05) + tiltX - card.rotation.x) * 0.12;
    card.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.08;

    bodyColor.lerp(targetColor, 0.08);
    if (!card) return renderer.render(scene, camera);
    if (bodyMat) bodyMat.color.copy(bodyColor);
    renderer.render(scene, camera);
  });

  setAuto(true);
}

if (webglOk) init();
