import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * A procedural luxury wristwatch — no model file to download.
 * Units: 1 = case radius. The dial faces +Z, 12 o'clock is +Y, the crown is at +X.
 */

export interface WatchModel {
  group: Group;
  hands: { hour: Object3D; minute: Object3D; second: Object3D };
  /** Resolves when the dial artwork (logo emblem + lettering) has been painted. */
  dialReady: Promise<void>;
  dispose: () => void;
}

interface WatchModelOptions {
  /** The official emblem, printed on the dial exactly as supplied. */
  emblemUrl: string;
  maxAnisotropy: number;
  lowPower: boolean;
}

const GOLD_PRINT = '#e6b955';

/** Maps a shape drawn in (y, z) and extruded along its depth onto world axes (depth → +X). */
const SIDE_PROFILE_BASIS = new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0));

export function createWatchModel({ emblemUrl, maxAnisotropy, lowPower }: WatchModelOptions): WatchModel {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const radial = lowPower ? 72 : 128;

  const material = <T extends Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const mesh = (geometry: BufferGeometry, mat: Material, parent: Object3D = group) => {
    geometries.push(geometry);
    const m = new Mesh(geometry, mat);
    parent.add(m);
    return m;
  };

  // ── Materials ────────────────────────────────────────────────────────────
  const polished = material(new MeshStandardMaterial({ color: 0xedb654, metalness: 1, roughness: 0.1, envMapIntensity: 1.15 }));
  const brushed = material(new MeshStandardMaterial({ color: 0xe3ab4a, metalness: 1, roughness: 0.3, envMapIntensity: 1.05 }));
  const handGold = material(new MeshStandardMaterial({ color: 0xf4c468, metalness: 1, roughness: 0.16, envMapIntensity: 1.2 }));
  /** Gloss-black ceramic for the bracelet's centre links — the black half of black-and-gold. */
  const ceramic = material(new MeshStandardMaterial({ color: 0x08080a, metalness: 0.85, roughness: 0.14, envMapIntensity: 1.5 }));
  const rehautMat = material(new MeshStandardMaterial({ color: 0x8a6a2c, metalness: 1, roughness: 0.42, envMapIntensity: 0.9 }));

  /** Revolves a (radius, height) profile around the watch axis. Travel counter-clockwise so normals face out. */
  const lathe = (profile: [number, number][], mat: Material) => {
    const geometry = new LatheGeometry(
      profile.map(([r, h]) => new Vector2(r, h)),
      radial,
    );
    geometry.rotateX(Math.PI / 2); // lathe axis Y → watch axis Z
    return mesh(geometry, mat);
  };

  const arc = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 8): [number, number][] =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = from + ((to - from) * i) / steps;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });

  // ── Case ─────────────────────────────────────────────────────────────────
  lathe([[0, -0.2], [0.78, -0.2]], brushed); // case back
  lathe(arc(0.78, -0.06, 0.22, 0.14, -Math.PI / 2, 0), polished); // rounded underside
  lathe([[1, -0.06], [1, 0.07]], brushed); // case band
  lathe([[1, 0.07], [0.965, 0.105]], polished); // shoulder chamfer
  const bezel = lathe([[0.965, 0.105], [0.965, 0.152], [0.948, 0.18], [0.915, 0.203], [0.872, 0.216]], polished);
  bezel.castShadow = true;
  const lip = lathe([[0.872, 0.216], [0.85, 0.2]], polished);
  lip.castShadow = true;
  lathe([[0.85, 0.2], [0.82, 0.09]], rehautMat); // inner flange

  // Fluted bezel: a ring of small ridges that catch the light as the watch turns.
  const fluteCount = lowPower ? 90 : 120;
  const fluteSide = (Math.PI * 2 * 0.912) / fluteCount / Math.SQRT2;
  const fluteGeometry = new BoxGeometry(fluteSide, 0.094, fluteSide);
  geometries.push(fluteGeometry);
  const flutes = new InstancedMesh(fluteGeometry, polished, fluteCount);
  const flute = new Object3D();
  const roll = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
  const slope = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.6);
  const around = new Quaternion();
  for (let i = 0; i < fluteCount; i += 1) {
    const a = (i / fluteCount) * Math.PI * 2;
    flute.position.set(Math.sin(a) * 0.912, Math.cos(a) * 0.912, 0.178);
    around.setFromAxisAngle(new Vector3(0, 0, 1), -a);
    flute.quaternion.copy(around).multiply(slope).multiply(roll);
    flute.updateMatrix();
    flutes.setMatrixAt(i, flute.matrix);
  }
  flutes.instanceMatrix.needsUpdate = true;
  group.add(flutes);

  const backRing = mesh(new TorusGeometry(0.6, 0.012, 8, radial), polished);
  backRing.position.z = -0.2;

  // Engraved case back: lettering around a black medallion carrying the official emblem.
  const backCanvas = document.createElement('canvas');
  backCanvas.width = backCanvas.height = lowPower ? 512 : 768;
  const backTexture = new CanvasTexture(backCanvas);
  backTexture.colorSpace = SRGBColorSpace;
  backTexture.anisotropy = maxAnisotropy;
  paintCaseBack(backCanvas);
  const backMat = material(new MeshStandardMaterial({ map: backTexture, metalness: 1, roughness: 0.3, envMapIntensity: 1.05 }));
  const caseBack = mesh(new CircleGeometry(0.59, radial), backMat);
  caseBack.rotation.y = Math.PI; // faces the wrist; turning (not mirroring) keeps the lettering readable
  caseBack.position.z = -0.2012;

  // ── Dial ─────────────────────────────────────────────────────────────────
  const dialCanvas = document.createElement('canvas');
  dialCanvas.width = dialCanvas.height = lowPower ? 768 : 1024;
  const dialTexture = new CanvasTexture(dialCanvas);
  dialTexture.colorSpace = SRGBColorSpace;
  dialTexture.anisotropy = maxAnisotropy;
  paintDial(dialCanvas);

  const dialMat = material(new MeshStandardMaterial({ map: dialTexture, metalness: 0.8, roughness: 0.42, envMapIntensity: 0.6 }));
  const dial = mesh(new CircleGeometry(0.822, radial), dialMat);
  dial.position.z = 0.09;
  dial.receiveShadow = true;

  const dialReady = Promise.all([loadImage(emblemUrl), loadDialFont()]).then(([emblem]) => {
    paintDial(dialCanvas, emblem);
    dialTexture.needsUpdate = true;
    paintCaseBack(backCanvas, emblem);
    backTexture.needsUpdate = true;
  });

  // ── Applied hour markers ─────────────────────────────────────────────────
  const baton = new BoxGeometry(0.046, 0.19, 0.03);
  const batonWide = new BoxGeometry(0.062, 0.21, 0.03);
  geometries.push(baton, batonWide);
  const addMarker = (geometry: BufferGeometry, angle: number, radius: number, sideways = 0) => {
    const marker = new Mesh(geometry, polished);
    marker.position.set(Math.sin(angle) * radius + Math.cos(angle) * sideways, Math.cos(angle) * radius - Math.sin(angle) * sideways, 0.105);
    marker.rotation.z = -angle;
    marker.castShadow = true;
    group.add(marker);
  };
  for (let hour = 0; hour < 12; hour += 1) {
    const angle = (hour / 12) * Math.PI * 2;
    if (hour === 0) {
      addMarker(baton, angle, 0.645, -0.036);
      addMarker(baton, angle, 0.645, 0.036);
    } else if (hour % 3 === 0) {
      addMarker(batonWide, angle, 0.635);
    } else {
      addMarker(baton, angle, 0.645);
    }
  }

  // ── Hands ────────────────────────────────────────────────────────────────
  const handShape = (halfWidth: number, tail: number, shoulder: number, tip: number) => {
    const shape = new Shape();
    shape.moveTo(-halfWidth * 0.8, -tail);
    shape.lineTo(halfWidth * 0.8, -tail);
    shape.lineTo(halfWidth, shoulder);
    shape.lineTo(0, tip);
    shape.lineTo(-halfWidth, shoulder);
    shape.closePath();
    return shape;
  };
  const handExtrude = { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 };
  const makeHand = (shape: Shape, z: number) => {
    const hand = mesh(new ExtrudeGeometry(shape, handExtrude), handGold);
    hand.position.z = z;
    hand.castShadow = true;
    hand.receiveShadow = true;
    return hand;
  };
  const hour = makeHand(handShape(0.031, 0.08, 0.3, 0.44), 0.112);
  const minute = makeHand(handShape(0.025, 0.1, 0.52, 0.7), 0.132);

  const second = new Group();
  second.position.z = 0.152;
  group.add(second);
  const needle = mesh(new BoxGeometry(0.011, 0.96, 0.008), handGold, second);
  needle.position.y = 0.28;
  needle.castShadow = true;
  const counterweight = mesh(new CylinderGeometry(0.034, 0.034, 0.008, 24), handGold, second);
  counterweight.rotation.x = Math.PI / 2;
  counterweight.position.y = -0.15;
  counterweight.castShadow = true;

  const cap = mesh(new CylinderGeometry(0.046, 0.05, 0.06, 32), polished);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.135;
  cap.castShadow = true;

  // ── Crystal: additive, so only its reflections are drawn ────────────────
  const crystalMat = material(
    new MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 0.2, // soft sheen rather than a pin-sharp hot spot from the cursor light
      envMapIntensity: 0.15,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  const crystal = lathe([[0.852, 0.2], [0.7, 0.212], [0.45, 0.221], [0.2, 0.225], [0, 0.226]], crystalMat);
  crystal.renderOrder = 2;

  // ── Crown ────────────────────────────────────────────────────────────────
  const crownShape = new Shape();
  const teeth = 30;
  for (let i = 0; i <= teeth * 2; i += 1) {
    const r = i % 2 === 0 ? 0.108 : 0.094;
    const a = (i / (teeth * 2)) * Math.PI * 2;
    if (i === 0) crownShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else crownShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const crownGeometry = new ExtrudeGeometry(crownShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.01, bevelSegments: 2 });
  crownGeometry.applyMatrix4(SIDE_PROFILE_BASIS);
  const crown = mesh(crownGeometry, polished);
  crown.position.x = 1.05;
  const stem = mesh(new CylinderGeometry(0.062, 0.062, 0.1, 24), brushed);
  stem.rotation.z = -Math.PI / 2;
  stem.position.x = 1.01;

  // ── Lugs + end pieces (built once for 12 o'clock, mirrored for 6 o'clock) ─
  const lugShape = new Shape();
  lugShape.moveTo(0.5, 0.07);
  lugShape.lineTo(0.95, 0.064);
  lugShape.quadraticCurveTo(1.17, 0.045, 1.24, -0.12);
  lugShape.lineTo(1.228, -0.225);
  lugShape.quadraticCurveTo(1.0, -0.21, 0.5, -0.19);
  lugShape.closePath();
  const lugGeometry = new ExtrudeGeometry(lugShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 16 });
  lugGeometry.applyMatrix4(SIDE_PROFILE_BASIS);
  geometries.push(lugGeometry);
  const endPieceGeometry = new RoundedBoxGeometry(1.08, 0.34, 0.2, lowPower ? 2 : 3, 0.05);
  geometries.push(endPieceGeometry);

  const lugSet = new Group();
  [0.575, -0.735].forEach((x) => {
    const lug = new Mesh(lugGeometry, polished);
    lug.position.x = x;
    lugSet.add(lug);
  });
  const endPiece = new Mesh(endPieceGeometry, brushed);
  endPiece.position.set(0, 0.93, -0.066);
  endPiece.rotation.x = -0.16;
  lugSet.add(endPiece);
  group.add(lugSet);
  const lugSetBottom = lugSet.clone();
  lugSetBottom.rotation.z = Math.PI;
  group.add(lugSetBottom);

  // ── Three-link bracelet following a wrist-shaped loop ───────────────────
  const half: [number, number][] = [
    [0.98, -0.078],
    [1.3, -0.2],
    [1.57, -0.6],
    [1.66, -1.2],
    [1.45, -1.84],
    [0.88, -2.28],
  ];
  const loopPoints = [
    ...half.map(([y, z]) => new Vector3(0, y, z)),
    new Vector3(0, 0, -2.44),
    ...half
      .slice()
      .reverse()
      .map(([y, z]) => new Vector3(0, -y, z)),
  ];
  const loop = new CatmullRomCurve3(loopPoints, false, 'catmullrom', 0.5);
  const loopLength = loop.getLength();
  const linkCount = Math.round(loopLength / 0.27);
  const pitch = loopLength / linkCount;

  // The bracelet links are about 95% of the watch's triangles. On phones each link is only a
  // dozen pixels tall, so one rounding step is enough and the scene draws far fewer triangles.
  const linkRounding = lowPower ? 1 : 3;
  const centerGeometry = new RoundedBoxGeometry(0.44, pitch * 0.97, 0.125, linkRounding, 0.04);
  const outerGeometry = new RoundedBoxGeometry(0.3, pitch * 0.97, 0.112, linkRounding, 0.036);
  geometries.push(centerGeometry, outerGeometry);
  const centerLinks = new InstancedMesh(centerGeometry, ceramic, linkCount);
  const outerLinks = new InstancedMesh(outerGeometry, brushed, (linkCount + 1) * 2);

  const xAxis = new Vector3(1, 0, 0);
  const normal = new Vector3();
  const matrix = new Matrix4();
  const placeLink = (target: InstancedMesh, index: number, u: number, x: number) => {
    const point = loop.getPointAt(u);
    const tangent = loop.getTangentAt(u).normalize();
    normal.crossVectors(xAxis, tangent).normalize();
    matrix.makeBasis(xAxis, tangent, normal);
    matrix.setPosition(x, point.y, point.z);
    target.setMatrixAt(index, matrix);
  };
  for (let i = 0; i < linkCount; i += 1) placeLink(centerLinks, i, (i + 0.5) / linkCount, 0);
  for (let i = 0; i <= linkCount; i += 1) {
    placeLink(outerLinks, i * 2, i / linkCount, 0.385);
    placeLink(outerLinks, i * 2 + 1, i / linkCount, -0.385);
  }
  centerLinks.instanceMatrix.needsUpdate = true;
  outerLinks.instanceMatrix.needsUpdate = true;
  group.add(centerLinks, outerLinks);

  const clasp = mesh(new RoundedBoxGeometry(1.09, 0.6, 0.14, lowPower ? 2 : 4, 0.06), brushed);
  clasp.position.set(0, 0, -2.452);

  return {
    group,
    hands: { hour, minute, second },
    dialReady,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      dialTexture.dispose();
      backTexture.dispose();
      flutes.dispose();
      centerLinks.dispose();
      outerLinks.dispose();
    },
  };
}

// ── Dial artwork ────────────────────────────────────────────────────────────

const DIAL_FONT = '600 40px "Cinzel Variable"';

function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

function loadDialFont(): Promise<unknown> {
  if (!document.fonts?.load) return Promise.resolve();
  const timeout = new Promise((resolve) => window.setTimeout(resolve, 2500));
  return Promise.race([document.fonts.load(DIAL_FONT, 'WEAR THE GAME').catch(() => undefined), timeout]);
}

function paintDial(canvas: HTMLCanvasElement, emblem?: HTMLImageElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const c = size / 2;
  const R = size / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#040404';
  ctx.fillRect(0, 0, size, size);

  // Sunburst: hundreds of faint wedges, seeded so every visit looks the same.
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.save();
  ctx.translate(c, c);
  for (let i = 0; i < 760; i += 1) {
    const start = random() * Math.PI * 2;
    const width = 0.003 + random() * 0.022;
    ctx.fillStyle = `rgba(255, 244, 220, ${(0.005 + random() * 0.02).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, start, start + width);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(c, c, R * 0.1, c, c, R);
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  // Minute track.
  ctx.save();
  ctx.translate(c, c);
  ctx.fillStyle = GOLD_PRINT;
  ctx.strokeStyle = GOLD_PRINT;
  for (let i = 0; i < 60; i += 1) {
    const major = i % 5 === 0;
    const w = R * (major ? 0.012 : 0.006);
    ctx.fillRect(-w / 2, -R * 0.965, w, R * (major ? 0.06 : 0.04));
    ctx.rotate(Math.PI / 30);
  }
  ctx.lineWidth = R * 0.004;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.895, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Official emblem under 12 o'clock.
  if (emblem) {
    const w = R * 0.5;
    const h = (w * emblem.naturalHeight) / emblem.naturalWidth;
    ctx.drawImage(emblem, c - w / 2, c - R * 0.33 - h / 2, w, h);
  }

  // Tagline above 6 o'clock, letter-spaced by hand for broad browser support.
  const text = 'WEAR THE GAME';
  const fontSize = R * 0.052;
  ctx.font = `600 ${fontSize}px "Cinzel Variable", "Times New Roman", serif`;
  ctx.fillStyle = GOLD_PRINT;
  ctx.textBaseline = 'middle';
  const spacing = fontSize * 0.34;
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  let x = c - (widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1)) / 2;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, c + R * 0.36);
    x += widths[i] + spacing;
  });
}

// ── Case back artwork ───────────────────────────────────────────────────────

function paintCaseBack(canvas: HTMLCanvasElement, emblem?: HTMLImageElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const c = size / 2;
  const R = size / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#e0a848';
  ctx.fillRect(0, 0, size, size);

  // Circular brushing.
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.lineWidth = 1;
  for (let i = 0; i < 150; i += 1) {
    const r = R * (0.5 + random() * 0.5);
    const start = random() * Math.PI * 2;
    ctx.strokeStyle = random() > 0.5 ? 'rgba(255, 240, 200, 0.10)' : 'rgba(70, 45, 5, 0.10)';
    ctx.beginPath();
    ctx.arc(c, c, r, start, start + 0.6 + random() * 2.4);
    ctx.stroke();
  }

  // Engraved rings.
  ctx.strokeStyle = 'rgba(60, 38, 4, 0.72)';
  ctx.lineWidth = R * 0.008;
  [0.965, 0.69].forEach((r) => {
    ctx.beginPath();
    ctx.arc(c, c, R * r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Lettering around the rim.
  const text = 'WRISTGAME  \u2022  WEAR THE GAME  \u2022  WATCHES  \u2022  STYLE  \u2022  LIFESTYLE  \u2022  ';
  const fontSize = R * 0.105;
  ctx.font = `600 ${fontSize}px "Cinzel Variable", "Times New Roman", serif`;
  ctx.fillStyle = 'rgba(52, 32, 3, 0.86)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = [...text];
  ctx.save();
  ctx.translate(c, c);
  chars.forEach((ch, i) => {
    ctx.save();
    ctx.rotate((i / chars.length) * Math.PI * 2);
    ctx.fillText(ch, 0, -R * 0.828);
    ctx.restore();
  });
  ctx.restore();

  // Black medallion with the official emblem, drawn exactly as supplied.
  const medallion = ctx.createRadialGradient(c, c - R * 0.1, R * 0.05, c, c, R * 0.62);
  medallion.addColorStop(0, '#16130d');
  medallion.addColorStop(1, '#070706');
  ctx.fillStyle = medallion;
  ctx.beginPath();
  ctx.arc(c, c, R * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240, 196, 96, 0.9)';
  ctx.lineWidth = R * 0.012;
  ctx.beginPath();
  ctx.arc(c, c, R * 0.56, 0, Math.PI * 2);
  ctx.stroke();

  if (emblem) {
    const w = R * 0.74;
    const h = (w * emblem.naturalHeight) / emblem.naturalWidth;
    ctx.drawImage(emblem, c - w / 2, c - h / 2, w, h);
  }
}
