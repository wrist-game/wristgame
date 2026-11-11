import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { Canvas, invalidate, useFrame, useThree } from '@react-three/fiber';
// Deep imports keep the bundle to the six Drei helpers this scene uses.
import { ContactShadows } from '@react-three/drei/core/ContactShadows';
import { Environment } from '@react-three/drei/core/Environment';
import { Float } from '@react-three/drei/core/Float';
import { Lightformer } from '@react-three/drei/core/Lightformer';
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor';
import { Sparkles } from '@react-three/drei/core/Sparkles';
import { AdditiveBlending, CanvasTexture, MathUtils, SRGBColorSpace, type Group, type PerspectiveCamera, type PointLight } from 'three';
import { OVERLAY_EVENT, isOverlayOpen } from '../../hooks/useOverlay';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { createWatchModel } from './watchModel';

/**
 * The hero's real-time watch film: React Three Fiber scene, Drei studio lighting.
 * Loaded lazily so three.js never blocks the first paint.
 */

const EMBLEM_URL = '/images/brand/logo-emblem-320.webp';
const FOV = 27;
const TWO_PI = Math.PI * 2;
const TURN_SECONDS = 28; // one full revolution of the turntable
const HALF_HEIGHT = 1.9; // watch + bracelet, with room for the float
const HALF_WIDTH = 1.84; // widest silhouette while turning (bracelet side-on)
const FLOOR_Y = -2.14;

/** Everything the pointer feeds into the scene. Mutated in place — never triggers a React render. */
interface WatchInput {
  pointerX: number; // −1 … 1 across the window (mouse only)
  pointerY: number;
  dragOffset: number; // radians added by dragging
  dragVelocity: number;
  dragging: boolean;
  lastX: number;
}

interface WatchExperienceProps {
  onReady?: () => void;
  /** The browser took the graphics context away; the scene can no longer draw. */
  onContextLost?: () => void;
}

function isLowPower() {
  return window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;
}

export default function WatchExperience({ onReady, onContextLost }: WatchExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const lowPower = useMemo(isLowPower, []);
  const maxDpr = useMemo(() => Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 1.75), [lowPower]);
  // 2 = full quality, 1 = standard resolution, 0 = also drops the live floor shadow and thins the gold dust.
  const [quality, setQuality] = useState(2);
  const lowestQuality = useRef(2);
  const stepQuality = (change: number) =>
    setQuality((current) => {
      const next = MathUtils.clamp(current + change, 0, 2);
      lowestQuality.current = Math.min(lowestQuality.current, next);
      return next;
    });
  const contextLost = useRef(onContextLost);
  contextLost.current = onContextLost;
  // Leaving the page also releases the context on purpose; that must not count as a loss.
  useEffect(
    () => () => {
      contextLost.current = undefined;
    },
    [],
  );
  const [onScreen, setOnScreen] = useState(true);
  // The menu and search cover the whole screen. Drawing stops while one is open, so a slower
  // phone can spend its effort on opening the menu smoothly instead of on a watch nobody can see.
  const [covered, setCovered] = useState(isOverlayOpen);
  useEffect(() => {
    const onOverlay = (event: Event) => setCovered((event as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener(OVERLAY_EVENT, onOverlay);
    return () => window.removeEventListener(OVERLAY_EVENT, onOverlay);
  }, []);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  const input = useRef<WatchInput>({ pointerX: 0, pointerY: 0, dragOffset: 0, dragVelocity: 0, dragging: false, lastX: 0 });

  // Render only while the hero is on screen (hidden tabs pause on their own).
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.02 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The watch leans towards the cursor wherever it is on the page (mouse only).
  useEffect(() => {
    if (reducedMotion) {
      input.current.pointerX = 0;
      input.current.pointerY = 0;
      return;
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      input.current.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      input.current.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reducedMotion]);

  // Drag sideways to turn the watch. Horizontal only, so vertical touch scrolling still works.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const state = input.current;
    state.dragging = true;
    state.dragVelocity = 0;
    state.lastX = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = input.current;
    if (!state.dragging) return;
    const delta = (event.clientX - state.lastX) * 0.0085;
    state.lastX = event.clientX;
    state.dragOffset += delta;
    state.dragVelocity = delta * 40;
    if (reducedMotion) invalidate();
  };
  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = input.current;
    if (!state.dragging) return;
    state.dragging = false;
    if (reducedMotion) state.dragVelocity = 0;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragging(false);
  };

  const handleFirstFrame = () => {
    setReady(true);
    onReady?.();
  };

  return (
    <div
      ref={containerRef}
      className={`watch-canvas${ready ? ' is-ready' : ''}${dragging ? ' is-dragging' : ''}`}
      role="img"
      aria-label="A gold and black wristwatch, shown in 3D. Drag sideways to turn it."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <Canvas
        aria-hidden="true"
        dpr={quality === 2 ? maxDpr : 1}
        frameloop={reducedMotion ? 'demand' : onScreen && !covered ? 'always' : 'never'}
        shadows={!lowPower}
        camera={{ fov: FOV, near: 0.5, far: 80, position: [0, 1.2, 17] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        resize={{ scroll: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMappingExposure = 0.98;
          gl.domElement.addEventListener(
            'webglcontextlost',
            () => {
              gl.forceContextLoss = () => {}; // already gone; stops a pointless console warning on clean-up
              contextLost.current?.();
            },
            { once: true },
          );
        }}
      >
        {/* Watches the frame rate and trades resolution and extras for smoothness on slower devices. */}
        {!reducedMotion && (
          <PerformanceMonitor onDecline={() => stepQuality(-1)} onIncline={() => stepQuality(1)} onFallback={() => setQuality(lowestQuality.current)} flipflops={3} />
        )}
        <Studio />
        <WatchRig input={input} containerRef={containerRef} reducedMotion={reducedMotion} lowPower={lowPower} onFirstFrame={handleFirstFrame} />
        <StageFloor liveShadow={!lowPower && quality > 0} reducedMotion={reducedMotion} />
        {!reducedMotion && (
          <Sparkles count={lowPower || quality === 0 ? 28 : 80} scale={[12, 6.4, 5]} position={[0, 0.2, -0.6]} size={lowPower ? 2 : 2.6} speed={0.24} opacity={0.6} color="#f2c765" noise={[1.3, 0.9, 1.3]} />
        )}
      </Canvas>
    </div>
  );
}

/**
 * A dark photo studio, rendered once into the environment map. Soft boxes and
 * warm strip lights are what make the gold read as metal and the ceramic as gloss black.
 */
function Studio() {
  const origin: [number, number, number] = [0, 0, 0];
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#030303']} />
      {/* overhead soft box */}
      <Lightformer form="rect" color="#fff4e0" intensity={5.5} position={[0, 10, 2]} scale={[9, 6, 1]} target={origin} />
      {/* key strip, camera left */}
      <Lightformer form="rect" color="#fff0d2" intensity={11} position={[-9, 2.5, 5]} scale={[2.2, 12, 1]} target={origin} />
      {/* warm rim, camera right */}
      <Lightformer form="rect" color="#ffc56e" intensity={11} position={[9.5, 1, 2]} scale={[2, 11, 1]} target={origin} />
      {/* long front strip: the soft streak across the crystal */}
      <Lightformer form="rect" color="#ffe2ad" intensity={1.7} position={[1.5, 3.6, 11]} scale={[8, 1.8, 1]} target={origin} />
      {/* warm bounce off the floor */}
      <Lightformer form="rect" color="#ffb24a" intensity={1.6} position={[0, -9, 3]} scale={[10, 6, 1]} target={origin} />
      {/* back kickers for the bracelet */}
      <Lightformer form="rect" color="#ffffff" intensity={18} position={[5, 6, -7]} scale={[2, 2, 1]} target={origin} />
      <Lightformer form="rect" color="#ffe0a0" intensity={12} position={[-6, -2, -8]} scale={[2, 8, 1]} target={origin} />
      <Lightformer form="rect" color="#ffd58c" intensity={4} position={[-4, -4, 9]} scale={[2.5, 2.5, 1]} target={origin} />
    </Environment>
  );
}

interface WatchRigProps {
  input: MutableRefObject<WatchInput>;
  containerRef: RefObject<HTMLDivElement>;
  reducedMotion: boolean;
  lowPower: boolean;
  onFirstFrame: () => void;
}

/** rig (scroll + entrance + cursor) → tilt (presentation angle) → Float → spin (turntable) → watch */
function WatchRig({ input, containerRef, reducedMotion, lowPower, onFirstFrame }: WatchRigProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const requestFrame = useThree((state) => state.invalidate);

  const rig = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const cursorLight = useRef<PointLight>(null);
  const motion = useRef({ clock: 0, phase: -1, entrance: 0, pointerX: 0, pointerY: 0, scroll: 0, distance: 17, announced: false });

  const model = useMemo(
    () => createWatchModel({ emblemUrl: EMBLEM_URL, maxAnisotropy: gl.capabilities.getMaxAnisotropy(), lowPower }),
    [gl, lowPower],
  );

  useEffect(() => {
    let alive = true;
    model.dialReady.then(() => {
      if (alive) requestFrame();
    });
    return () => {
      alive = false;
      model.dispose();
    };
  }, [model, requestFrame]);

  // Reduced motion: one calm, well-lit pose — no turntable, no entrance, no scroll or cursor movement.
  useEffect(() => {
    const state = motion.current;
    if (reducedMotion) {
      state.phase = 0;
      state.entrance = 1;
      state.pointerX = 0;
      state.pointerY = 0;
      state.scroll = 0;
      input.current.dragOffset = -0.4;
      input.current.dragVelocity = 0;
    }
    requestFrame();
  }, [reducedMotion, input, requestFrame]);

  // Frame the watch. The stage's CSS decides how big it is and where its centre sits,
  // so the layout and the 3D scene can never drift apart.
  useLayoutEffect(() => {
    const element = containerRef.current;
    const styles = element ? getComputedStyle(element) : undefined;
    const read = (name: string, fallback: number) => {
      const value = parseFloat(styles?.getPropertyValue(name) ?? '');
      return Number.isFinite(value) ? value : fallback;
    };
    const fill = read('--watch-fill', 0.94); // share of the stage height the watch may take
    const span = read('--watch-span', 0.98); // share of the stage width it may take
    const shift = read('--watch-shift', 0); // moves the watch up by this share of the stage height

    const tanHalf = Math.tan(MathUtils.degToRad(FOV) / 2);
    const aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(HALF_HEIGHT / (tanHalf * fill), HALF_WIDTH / (tanHalf * aspect * span));
    motion.current.distance = distance;

    camera.position.set(0, distance * 0.07, distance);
    camera.lookAt(0, 0, 0);
    if (shift) camera.setViewOffset(size.width, size.height, 0, size.height * shift, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    requestFrame();
  }, [camera, containerRef, requestFrame, size]);

  useFrame((_, delta) => {
    const state = motion.current;
    const pointer = input.current;
    const dt = Math.min(delta, 0.05);

    if (!reducedMotion) {
      state.clock += dt;
      state.entrance = Math.min(1, state.entrance + dt / 2.4);
      if (!pointer.dragging) {
        state.phase += (dt * TWO_PI) / TURN_SECONDS;
        pointer.dragOffset += pointer.dragVelocity * dt;
        pointer.dragVelocity *= Math.exp(-2.6 * dt);
      }
      state.pointerX = MathUtils.damp(state.pointerX, pointer.pointerX, 3.4, dt);
      state.pointerY = MathUtils.damp(state.pointerY, pointer.pointerY, 3.4, dt);
      const scrollTarget = MathUtils.clamp(window.scrollY / Math.max(window.innerHeight * 0.9, 1), 0, 1);
      state.scroll = MathUtils.damp(state.scroll, scrollTarget, 6, dt);
    }

    const ease = 1 - Math.pow(1 - state.entrance, 3);
    const { pointerX: px, pointerY: py, scroll } = state;

    if (spin.current && tilt.current && rig.current) {
      // Ease-in-out turntable: always turning, lingering on the dial and moving briskly past the clasp.
      spin.current.rotation.y = state.phase - 0.6 * Math.sin(state.phase) + pointer.dragOffset - (1 - ease) * 1.15 + scroll * 1.2;
      // Lean towards the cursor; lay back as the page scrolls away.
      tilt.current.rotation.set(-0.2 + py * 0.15 - scroll * 0.42, px * 0.32, -0.1 + px * 0.035);
      rig.current.position.set(px * 0.16, -py * 0.07 - scroll * 1.05 - (1 - ease) * 0.45, 0);
      rig.current.scale.setScalar((0.84 + 0.16 * ease) * (1 - scroll * 0.12));
    }

    // The studio drifts around the watch, so highlights keep gliding over the metal — and follow the cursor.
    scene.environmentRotation.y = px * 0.5 + Math.sin(state.clock * 0.21) * 0.2;

    if (cursorLight.current) {
      cursorLight.current.position.set(px * 3.6, 0.7 - py * 2.6, 4.6);
      cursorLight.current.intensity = 9 * ease;
    }

    camera.position.set(px * 0.45, state.distance * 0.07 - py * 0.28, state.distance);
    camera.lookAt(0, 0, 0);

    if (reducedMotion) {
      setHands(model, 10, 8, 37);
    } else {
      const now = new Date();
      setHands(model, now.getHours(), now.getMinutes(), now.getSeconds() + now.getMilliseconds() / 1000);
    }

    if (!state.announced) {
      state.announced = true;
      onFirstFrame();
    }
  });

  return (
    <>
      <ambientLight color="#ffe7c2" intensity={0.12} />
      <directionalLight
        color="#fff1da"
        intensity={1.5}
        position={[-3.2, 5.5, 6.5]}
        castShadow={!lowPower}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.012}
        shadow-radius={3}
        shadow-camera-left={-2.6}
        shadow-camera-right={2.6}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-2.6}
        shadow-camera-near={2}
        shadow-camera-far={18}
      />
      <pointLight ref={cursorLight} color="#ffd9a0" intensity={0} distance={16} decay={2} />

      <group ref={rig}>
        <group ref={tilt} rotation={[-0.2, 0, -0.1]}>
          <Float enabled={!reducedMotion} speed={3.2} rotationIntensity={0.22} floatIntensity={1} floatingRange={[-0.09, 0.09]}>
            <group ref={spin}>
              {/* Turn around the middle of the bracelet loop, like a display stand. */}
              <primitive object={model.group} position={[0, 0, 0.78]} />
            </group>
          </Float>
        </group>
      </group>
    </>
  );
}

function setHands(model: ReturnType<typeof createWatchModel>, hours: number, minutes: number, seconds: number) {
  model.hands.hour.rotation.z = -(((hours % 12) + minutes / 60) / 12) * TWO_PI;
  model.hands.minute.rotation.z = -((minutes + seconds / 60) / 60) * TWO_PI;
  model.hands.second.rotation.z = -(seconds / 60) * TWO_PI;
}

/** A faint pool of gold light on the studio floor, with the watch's soft shadow falling into it. */
function StageFloor({ liveShadow, reducedMotion }: { liveShadow: boolean; reducedMotion: boolean }) {
  const pool = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(255, 214, 130, 0.9)');
      gradient.addColorStop(0.25, 'rgba(222, 176, 64, 0.42)');
      gradient.addColorStop(0.6, 'rgba(160, 110, 30, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);

  useEffect(() => () => pool.dispose(), [pool]);

  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh rotation-x={-Math.PI / 2} renderOrder={-2}>
        <circleGeometry args={[4.6, 48]} />
        <meshBasicMaterial map={pool} transparent opacity={0.5} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
      {liveShadow && (
        <ContactShadows position={[0, 0.012, 0]} scale={8} far={3.6} blur={2.4} opacity={0.82} resolution={512} color="#000000" frames={reducedMotion ? 3 : Infinity} />
      )}
    </group>
  );
}
