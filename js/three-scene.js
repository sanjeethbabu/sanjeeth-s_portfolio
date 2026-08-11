import * as THREE from "three";

const ACCENT = { r: 0.36, g: 0.55, b: 1.0 };
const ACCENT2 = { r: 0.13, g: 0.83, b: 0.93 };
const BACKGROUND = 0x05070f;

export function initScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.FogExp2(BACKGROUND, 0.018);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 0, 26);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  /* ---------------- Particle field ---------------- */
  function softTexture() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  const COUNT = 700;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const radius = 12 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const t = Math.random();
    colors[i * 3] = ACCENT.r + (ACCENT2.r - ACCENT.r) * t;
    colors[i * 3 + 1] = ACCENT.g + (ACCENT2.g - ACCENT.g) * t;
    colors[i * 3 + 2] = ACCENT.b + (ACCENT2.b - ACCENT.b) * t;

    scales[i] = 0.6 + Math.random() * 1.6;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  pGeo.setAttribute("size", new THREE.BufferAttribute(scales, 1));

  const pMat = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: softTexture() },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      void main() {
        vec4 tex = texture2D(pointTexture, gl_PointCoord);
        gl_FragColor = vec4(vColor, 1.0) * tex;
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(pGeo, pMat);
  sceneGroup.add(particles);

  /* ---------------- Floating 3D shapes ---------------- */
  const shapes = [];
  const definitions = [
    { geo: new THREE.IcosahedronGeometry(2.2, 1), x: -16, y: 6, z: -8, s: 0.35 },
    { geo: new THREE.TorusKnotGeometry(1.3, 0.38, 90, 14), x: 17, y: 7, z: -12, s: 0.25 },
    { geo: new THREE.OctahedronGeometry(1.6, 0), x: -19, y: -7, z: -6, s: 0.4 },
    { geo: new THREE.BoxGeometry(1.7, 1.7, 1.7), x: 15, y: -8, z: -4, s: 0.3 },
    { geo: new THREE.TorusGeometry(1.1, 0.32, 18, 44), x: 0, y: 14, z: -16, s: 0.5 },
    { geo: new THREE.IcosahedronGeometry(1.1, 1), x: 22, y: 0, z: -18, s: 0.6 },
    { geo: new THREE.OctahedronGeometry(2.4, 1), x: -24, y: 2, z: -20, s: 0.2 },
    { geo: new THREE.TorusKnotGeometry(0.9, 0.28, 70, 10), x: -11, y: -12, z: -10, s: 0.5 },
  ];

  definitions.forEach((d) => {
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x5b8cff : 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.35 + Math.random() * 0.3,
    });
    const mesh = new THREE.Mesh(d.geo, mat);
    mesh.position.set(d.x, d.y, d.z);
    mesh.rotation.set(Math.random() * 2, Math.random() * 2, 0);
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.008,
      rotY: (Math.random() - 0.5) * 0.008,
      drift: (Math.random() - 0.5) * 0.01,
    };
    sceneGroup.add(mesh);
    shapes.push(mesh);
  });

  /* ---------------- Mouse parallax ---------------- */
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );

  /* ---------------- Resize ---------------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------------- Animation loop ---------------- */
  let scrollFactor = 0;
  window.addEventListener(
    "scroll",
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollFactor = max > 0 ? window.scrollY / max : 0;
    },
    { passive: true }
  );

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let rafId = null;
  const animate = () => {
    rafId = requestAnimationFrame(animate);

    if (!reducedMotion) {
      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0001;

      shapes.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotX;
        mesh.rotation.y += mesh.userData.rotY;
        mesh.position.y += Math.sin(Date.now() * 0.001 + mesh.position.x) * 0.003 + mesh.userData.drift * 0.05;
      });

      target.x = mouse.x * 1.6;
      target.y = mouse.y * 1.0;
    }

    camera.position.x += (target.x - camera.position.x) * 0.04;
    camera.position.y += (target.y - camera.position.y) * 0.04;
    camera.position.z = 26 + scrollFactor * 4;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  };

  animate();

  return {
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", null);
      window.removeEventListener("resize", null);
      window.removeEventListener("scroll", null);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
