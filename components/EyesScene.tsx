"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { PERSONAS } from "@/lib/personas";
import { EMOTIONS, randomFrom, thoughtFor, type ExperiencePhase, type Observation, type Revision } from "@/lib/experience";
import { eyeFragment, eyeVertex } from "@/lib/eye-shaders";
import { eyePortraitAtlas } from "@/lib/eye-portraits";
import { arrivalDelays, foregroundReadings, sneeringReadings } from "@/lib/attention";
import type { Ending } from "@/lib/use-stillness";

type Props = {
  observation: Observation | null;
  original: Observation | null;
  revision: Revision | null;
  sequence: number;
  phase: ExperiencePhase;
  selected: string | null;
  paused: boolean;
  still: boolean;
  ending: Ending;
  nearThreshold: boolean;
  onSelect: (id: string) => void;
};

const colors = Object.fromEntries(EMOTIONS.map((e) => [e.id, new THREE.Color(e.color)]));
const praiseColor = new THREE.Color("#e3cd95");
const quietReactions = ["love", "useful", "meh"] as const;

function quietWitnesses(observation: Observation | null) {
  return quietReactions.map((reaction) => observation?.readings.find((r) => r.reaction === reaction && (r.delivery === "soft" || r.delivery === "silent"))?.id);
}

const fallbackDelays = arrivalDelays(PERSONAS.map((_, i) => ({ x: 8 + (i % 10) * 9.3, y: 13 + Math.floor(i / 10) * 7.4 })), { x: 50, y: 48 });

export default function EyesScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const targets = useRef<(HTMLButtonElement | null)[]>([]);
  const latest = useRef(props);
  const [unavailable, setUnavailable] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const widening = props.phase === "revealing" || props.phase === "reality" || props.phase === "revising";
  const witnesses = quietWitnesses(props.observation);
  const frontIds = foregroundReadings(props.observation).map((r) => r.id);
  const sideIds = sneeringReadings(props.observation).map((r) => r.id);
  const changes = new Set(props.revision?.changes.map((change) => change.id));
  const visibleIndices = PERSONAS.flatMap((_, i) => {
    return !props.observation || widening || frontIds.includes(PERSONAS[i].id) || sideIds.includes(PERSONAS[i].id) ? [i] : [];
  });
  const tabIndex = visibleIndices.includes(focusedIndex) ? focusedIndex : visibleIndices[0];

  useEffect(() => { latest.current = props; }, [props]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      // A renderer initialization failure is external state, discovered only at mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnavailable(true);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    root.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.z = 15;
    const space = new THREE.Group();
    scene.add(space);
    const rand = randomFrom(84931);
    const plane = new THREE.PlaneGeometry(2, 1.3, 16, 8);
    const labels = targets.current;
    const whisperSizes = new Map<Element, { width: number; height: number }>();
    let whispers: (HTMLElement | null)[] = [];
    const whisperObserver = new ResizeObserver((entries) => {
      for (const entry of entries) whisperSizes.set(entry.target, { width: entry.contentRect.width, height: entry.contentRect.height });
    });
    const baseColor = new THREE.Color("#91a39c");
    const memoryCanvas = document.createElement("canvas");
    memoryCanvas.width = 1024;
    memoryCanvas.height = 256;
    const memoryTexture = new THREE.CanvasTexture(memoryCanvas);
    let memoryText = "";
    let width = 1, height = 1;
    const eyes = PERSONAS.map((persona, i) => {
      const seed = rand();
      const ring = i < 14 ? 0 : i < 36 ? 1 : i < 64 ? 2 : 3;
      const count = [14, 22, 28, 36][ring];
      const index = i - [0, 14, 36, 64][ring];
      const angle = index / count * Math.PI * 2 + ring * .39 + (rand() - .5) * .21;
      const z = 2.3 - ring * 4.6 + (rand() - .5) * 3.0;
      const material = new THREE.ShaderMaterial({
        vertexShader: eyeVertex, fragmentShader: eyeFragment,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 }, uSeed: { value: seed }, uOpen: { value: 1 },
          uActive: { value: 0 }, uOpacity: { value: 1 }, uSelected: { value: 0 },
          uWitness: { value: 0 },
          uImprint: { value: 0 },
          uArrival: { value: 0 },
          uMemory: { value: 0 }, uMemoryText: { value: memoryTexture },
          uColor: { value: baseColor.clone() }, uGaze: { value: new THREE.Vector2() },
        },
      });
      const mesh = new THREE.Mesh(plane, material);
      // Nearby eyes have a larger angular size; far eyes form the silent background.
      const scale = .48 + rand() * .4;
      mesh.scale.set(scale, scale * (1.02 + rand() * .24), 1);
      space.add(mesh);
      return { mesh, material, seed, ring, angle, z, scale, baseScale: scale, home: new THREE.Vector3(), waveHome: new THREE.Vector3(), receivedAt: 0, id: persona.id, nextBlink: seed * 9 + 2, blinkAt: -10,
        interest: 0, affection: 0, discomfort: 0 };
    });
    const portraitSeeds = eyes.map((eye) => eye.seed);
    const updatePortraits = (observation: Observation | null) => {
      const atlas = eyePortraitAtlas(renderer, portraitSeeds, observation?.readings);
      root.parentElement?.style.setProperty("--eye-portraits", `url("${atlas}")`);
      root.parentElement?.setAttribute("data-eye-portraits", "ready");
    };
    updatePortraits(null);

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      dustPositions[i * 3] = (rand() - .5) * 70;
      dustPositions[i * 3 + 1] = (rand() - .5) * 46;
      dustPositions[i * 3 + 2] = -rand() * 44;
    }
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({ color: "#92a9a2", size: .022, transparent: true, opacity: .5, depthWrite: false, sizeAttenuation: true });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    const orbitMaterials: THREE.LineBasicMaterial[] = [];
    const orbitGeometries: THREE.BufferGeometry[] = [];
    const orbits = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const points = Array.from({ length: 180 }, (_, k) => {
        const angle = k / 179 * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * (7.0 + i * 1.1), Math.sin(angle) * (7.0 + i * 1.1), 0);
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: "#718980", transparent: true, opacity: .085, depthWrite: false });
      const line = new THREE.Line(geometry, material);
      line.rotation.set(.9 + i * .22, -.3 + i * .3, -.28 + i * .3);
      line.position.z = -4 - i * 3;
      orbits.add(line);
      orbitMaterials.push(material);
      orbitGeometries.push(geometry);
    }
    scene.add(orbits);

    const emberGeometry = new THREE.BufferGeometry();
    const emberCount = 72;
    const emberPositions = new Float32Array(emberCount * 3);
    const emberSeeds = Array.from({ length: emberCount }, () => [rand(), rand(), rand()]);
    emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
    const emberMaterial = new THREE.PointsMaterial({
      color: "#f4a17c", size: .04, transparent: true, opacity: .8,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const embers = new THREE.Points(emberGeometry, emberMaterial);
    embers.visible = false;
    space.add(embers);

    // Fine arcs connect only the few amplified voices, even when they fill the room.
    const threadSteps = 24, threadCount = 4;
    const threadPositions = new Float32Array(threadCount * threadSteps * 6);
    const threadGeometry = new THREE.BufferGeometry();
    threadGeometry.setAttribute("position", new THREE.BufferAttribute(threadPositions, 3));
    const threadMaterial = new THREE.LineBasicMaterial({
      color: praiseColor, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const threads = new THREE.LineSegments(threadGeometry, threadMaterial);
    threads.frustumCulled = false;
    space.add(threads);

    const pointer = new THREE.Vector2();
    const offset = new THREE.Vector2();
    const drag = new THREE.Vector2();
    const cameraTarget = new THREE.Vector2();
    const projected = new THREE.Vector3();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMotion.matches;
    const onMotion = () => { reduced = reduceMotion.matches; };
    reduceMotion.addEventListener("change", onMotion);
    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      for (const eye of eyes) {
        const halfH = Math.tan(23 * Math.PI / 180) * (15 - eye.z);
        const halfW = halfH * camera.aspect;
        const narrow = width < 700;
        const rx = narrow ? [.68, .84, .97, 1.06][eye.ring] : [.48, .66, .81, .98][eye.ring];
        const ry = [.60, .70, .80, .91][eye.ring];
        let nx = Math.cos(eye.angle) * rx * (.95 + eye.seed * .1);
        let ny = Math.sin(eye.angle) * ry * (.91 + eye.seed * .15);
        // Leave a quiet clearing around the writing and title. Mobile keeps eyes
        // behind the translucent card, since the card occupies most of its width.
        if (!narrow) {
          const clearing = Math.sqrt((nx / .43) ** 2 + ((ny - .045) / .68) ** 2);
          if (clearing < 1) {
            nx /= clearing;
            ny = .045 + (ny - .045) / clearing;
          }
        }
        eye.home.set(nx * halfW, ny * halfH, eye.z);
        eye.mesh.position.copy(eye.home);
        // Avoid oversized close eyes crowding the mobile composer.
        eye.baseScale = eye.scale * (narrow ? .63 : 1);
        eye.mesh.scale.setScalar(eye.baseScale);
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();
    let dragging = false;
    let moved = 0;
    let lastX = 0, lastY = 0;
    const onDown = (e: PointerEvent) => {
      if (latest.current.paused || reduced) return;
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointer = (e: PointerEvent) => {
      pointer.set((e.clientX / width - .5) * 2, -(e.clientY / height - .5) * 2);
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        drag.x = THREE.MathUtils.clamp(drag.x + dx / width * 3.5, -.85, .85);
        drag.y = THREE.MathUtils.clamp(drag.y - dy / height * 3.5, -.6, .6);
        moved += Math.abs(dx) + Math.abs(dy);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onUp = () => { dragging = false; };
    const onClick = (event: MouseEvent) => {
      if (moved > 8) { event.preventDefault(); event.stopPropagation(); }
      moved = 0;
    };
    const clearPointer = () => { pointer.set(0, 0); dragging = false; };
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("click", onClick, true);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", clearPointer);

    let frame = 0, previous = 0, elapsed = 0, sequence = 0, postedAt = -100;
    let pressure = 0, revealAmount = 0;
    let revealingBefore = false, revealStartedAt = -100;
    let stillBefore = false, stillStartedAt = -100, stillness = 0;
    let dissolution = 0;
    let thresholdAttention = 0;
    let readings = new Map<string, Observation["readings"][number]>();
    let foregroundIds: string[] = [], sneerIds: string[] = [], witnessIds: (string | undefined)[] = [];
    let foregroundEyes: typeof eyes = [];
    const irisTint = new THREE.Color();
    const gazeTarget = new THREE.Vector2();
    let priorObservation: Observation | null = null;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - previous) / 1000, .06);
      previous = now;
      if (document.hidden) return;
      const current = latest.current;
      const moving = !current.paused && !reduced;
      if (moving) elapsed += dt;
      const newPost = current.sequence !== sequence;
      if (newPost) {
        sequence = current.sequence;
        postedAt = moving ? elapsed : elapsed - 10;
        const bounds = root.getBoundingClientRect();
        const input = root.parentElement?.querySelector("textarea")?.getBoundingClientRect();
        const origin = input
          ? { x: input.x + input.width / 2 - bounds.x, y: input.y + input.height / 2 - bounds.y }
          : { x: width / 2, y: height * .48 };
        const positions = eyes.map((eye) => {
          eye.waveHome.copy(eye.mesh.position);
          eye.mesh.getWorldPosition(projected);
          projected.project(camera);
          return { x: (projected.x * .5 + .5) * width, y: (-projected.y * .5 + .5) * height };
        });
        const delays = arrivalDelays(positions, origin);
        eyes.forEach((eye, i) => {
          eye.receivedAt = delays[i];
          labels[i]?.style.setProperty("--arrival-at", `${delays[i]}s`);
        });
        root.dataset.waveCycle = String(sequence);
      }
      if (current.observation !== priorObservation) {
        priorObservation = current.observation;
        readings = new Map(current.observation?.readings.map((r) => [r.id, r]) ?? []);
        foregroundIds = foregroundReadings(current.observation).map((r) => r.id);
        foregroundEyes = eyes.filter((eye) => foregroundIds.includes(eye.id));
        sneerIds = sneeringReadings(current.observation).map((r) => r.id);
        witnessIds = quietWitnesses(current.observation);
        updatePortraits(current.observation);
        whisperObserver.disconnect();
        whisperSizes.clear();
        whispers = labels.map((label) => label?.querySelector<HTMLElement>(".eye-whisper") ?? null);
        whispers.forEach((whisper) => { if (whisper) whisperObserver.observe(whisper); });
      }
      if (current.original && current.original.text !== memoryText) {
        memoryText = current.original.text;
        const context = memoryCanvas.getContext("2d")!;
        context.clearRect(0, 0, 1024, 256);
        context.font = '32px "Yuji Boku", serif';
        context.textAlign = "center";
        context.fillStyle = "#d1d9ca";
        const characters = Array.from(memoryText);
        const lines = Math.ceil(characters.length / 28);
        for (let line = 0; line < lines; line++) {
          context.fillText(characters.slice(line * 28, (line + 1) * 28).join(""), 512, 128 - lines * 21 + line * 42 + 30);
        }
        memoryTexture.needsUpdate = true;
      }
      const age = reduced ? 10 : elapsed - postedAt;
      const reality = current.phase === "revealing" || current.phase === "reality" || current.phase === "revising";
      const praise = current.observation?.spotlight === "praise";
      const surrounded = !!current.observation && !reality;
      if (reality && !revealingBefore) revealStartedAt = elapsed;
      revealingBefore = reality;
      const releaseAge = reality ? reduced || current.paused ? 6 : elapsed - revealStartedAt : 0;
      const quietArrival = reality ? THREE.MathUtils.smoothstep(releaseAge, 2.4, 5.2) : 0;
      const resting = current.still && reality && moving;
      const ending = current.ending !== "none";
      dissolution = THREE.MathUtils.lerp(dissolution, ending ? 1 : 0,
        reduced || current.paused ? 1 : 1 - Math.exp(-dt * (ending ? .8 : 3)));
      if (resting && !stillBefore) stillStartedAt = elapsed;
      stillBefore = resting;
      const stillAge = resting ? elapsed - stillStartedAt : 0;
      stillness = THREE.MathUtils.lerp(stillness, resting ? 1 : 0, 1 - Math.exp(-dt * (resting ? .4 : 2.4)));
      // Most eyes resume their own lives. One looks back after a pause, then also leaves.
      const lastLook = resting
        ? THREE.MathUtils.smoothstep(stillAge, 3, 5) * (1 - THREE.MathUtils.smoothstep(stillAge, 8, 11))
        : 0;
      const memoryId = current.revision?.memory?.id;
      const memoryPulse = memoryId && current.phase === "reality"
        ? reduced ? .65 : THREE.MathUtils.smoothstep(releaseAge, 3.2, 5) * (1 - THREE.MathUtils.smoothstep(releaseAge, 9, 13)) : 0;
      const transition = reduced || current.paused ? 1 : 1 - Math.exp(-dt * 1.15);
      thresholdAttention = THREE.MathUtils.lerp(thresholdAttention, current.nearThreshold ? 1 : 0, transition);
      const distance = current.observation ? current.phase === "revising" ? 1 : THREE.MathUtils.smoothstep(age, 1.9, 7) : 0;
      const voiceArrival = reduced || current.paused ? 1 : THREE.MathUtils.smoothstep(age, 1.85, 3.8);
      pressure = THREE.MathUtils.lerp(pressure, surrounded ? voiceArrival * (1 - distance * .12 - thresholdAttention * .08) : 0, transition);
      revealAmount = THREE.MathUtils.lerp(revealAmount, reality ? 1 : 0, transition);
      const intensity = current.observation?.intensity ?? 0;
      const surge = current.observation && moving ? intensity * pressure * (.35 + .18 * Math.sin(elapsed * .45) ** 2) * (1 - thresholdAttention * .75) : 0;
      if (!dragging && moving) drag.multiplyScalar(.993);
      // The room has depth, but a post never summons people to a new position.
      cameraTarget.set(moving ? pointer.x * .16 + drag.x : 0, moving ? pointer.y * .10 + drag.y : 0);
      if (moving) offset.lerp(cameraTarget, .035);
      camera.position.x = offset.x * 1.45;
      camera.position.y = offset.y * .8;
      camera.position.z = 15;
      camera.lookAt(0, 0, -4);
      space.rotation.y = offset.x * .022;
      space.rotation.x = -offset.y * .012;
      dust.rotation.z = elapsed * .0015;
      dustMaterial.color.lerp(pressure > .2 ? praise ? praiseColor : colors.annoying : baseColor, .018);
      dustMaterial.opacity = (.32 + revealAmount * .22) * (1 - stillness * .75) * (1 - dissolution * .92);
      orbitMaterials.forEach((material) => { material.opacity = .065 * (1 - pressure * .85) * (1 - stillness); });
      orbits.rotation.z = Math.sin(elapsed * .025) * .07;

      eyes.forEach((eye, i) => {
        const { mesh, material, seed } = eye;
        const reading = readings.get(eye.id);
        const foreground = foregroundIds.includes(eye.id);
        const sneering = reading?.delivery === "sneer";
        const witness = witnessIds.indexOf(eye.id);
        const remembers = memoryId === eye.id;
        const returns = current.revision ? remembers : witness === 0;
        const returningLook = remembers ? memoryPulse : returns ? lastLook : 0;
        const receivedAt = eye.receivedAt;
        const active = !!reading && (reality || age > receivedAt);
        const receiptAge = age - receivedAt;
        const receiving = current.phase === "reacting";
        const receipt = receiving && moving && receiptAge > 0 && receiptAge < .72 ? Math.sin(receiptAge / .72 * Math.PI) : 0;
        const indifferent = reading?.reaction === "meh";
        if (moving && elapsed > eye.nextBlink) {
          eye.blinkAt = elapsed;
          eye.nextBlink = elapsed + 3.5 + seed * 8;
        }
        const blinkAge = elapsed - eye.blinkAt;
        let openness = moving && blinkAge < .24 ? Math.max(.06, Math.abs(blinkAge / .12 - 1)) : 1;
        if (receiving && moving && age < 1.95) {
          // A sharp close, a held seam, then a slower opening: one domino per eye.
          openness = receiptAge < 0 || receiptAge > .38 ? 1
            : receiptAge < .1 ? 1 - receiptAge / .1 * .975
            : receiptAge < .15 ? .025 : .025 + THREE.MathUtils.smoothstep(receiptAge, .15, .38) * .975;
        }
        const smoothing = moving ? 1 - Math.exp(-dt * 1.7) : 1;
        eye.interest = THREE.MathUtils.lerp(eye.interest, reading?.feelings.interest ?? 0, smoothing);
        eye.affection = THREE.MathUtils.lerp(eye.affection, reading?.feelings.affection ?? 0, smoothing);
        eye.discomfort = THREE.MathUtils.lerp(eye.discomfort, reading?.feelings.discomfort ?? 0, smoothing);
        const bored = active ? .43 + eye.interest * .55 - eye.discomfort * .08 : .82 + seed * .25;
        material.uniforms.uOpen.value = openness * bored * (returns ? 1 - stillness * .22 + returningLook * .22 : 1);
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uActive.value = THREE.MathUtils.lerp(material.uniforms.uActive.value, active ? 1 : 0, .065);
        const passing = surrounded && moving ? 1 - THREE.MathUtils.smoothstep(age, 1.85, 2.9) : 0;
        const faint = .16 + seed * .04;
        const veiled = foreground ? .78 + passing * .22 : sneerIds.includes(eye.id) ? .55 + passing * .3 : faint + (1 - faint) * passing;
        // All eyes remain in the dark. Opening analytics changes their light
        // continuously, rather than making the population appear in one frame.
        const presence = !reading ? 1 : THREE.MathUtils.lerp(veiled, foreground ? .76 : .9,
          THREE.MathUtils.smoothstep(revealAmount, 0, 1));
        const fading = current.selected === eye.id ? 1 : 1 - stillness * (returns ? .28 - returningLook * .25 : .64);
        material.uniforms.uOpacity.value = (1 - eye.ring * (.14 - revealAmount * .065)) * presence * fading * (1 - dissolution * .985);
        material.uniforms.uSelected.value = current.selected === eye.id ? 1 : 0;
        material.uniforms.uWitness.value = (witness === 0 ? quietArrival * eye.affection * .26 : 0) + returningLook * .42;
        material.uniforms.uImprint.value = THREE.MathUtils.lerp(material.uniforms.uImprint.value, receipt * 1.6 + returningLook * .7, .18);
        material.uniforms.uArrival.value = receipt;
        material.uniforms.uMemory.value = remembers ? memoryPulse : 0;
        irisTint.copy(active && reading ? colors[reading.reaction] : baseColor);
        material.uniforms.uColor.value.lerp(irisTint, .05);
        gazeTarget.set(active && reality ? (.18 * (1 - eye.interest) + eye.discomfort * .05) * Math.sin(seed * 80)
          : active && sneering ? .14 * Math.sin(seed * 80) : -Math.cos(eye.angle) * .075 + offset.x * .035, -Math.sin(eye.angle) * .045 + offset.y * .025);
        if (returns) {
          gazeTarget.multiplyScalar(1 - returningLook * .9);
          gazeTarget.x += stillness * .145 * (1 - returningLook);
          gazeTarget.y -= stillness * .035 * (1 - returningLook);
        }
        material.uniforms.uGaze.value.lerp(gazeTarget, .06);
        const driftScale = active ? indifferent ? .1 : .22 : .5;
        mesh.position.x = eye.home.x + Math.sin(elapsed * .14 + seed * 19) * .045 * driftScale;
        mesh.position.y = eye.home.y + Math.cos(elapsed * .12 + seed * 31) * .045 * driftScale;
        mesh.position.z = eye.home.z;
        mesh.scale.setScalar(eye.baseScale * (active && foreground ? 1 + pressure * .12 : 1));
        mesh.rotation.z = Math.sin(seed * 93) * .21;
        mesh.rotation.y = -Math.cos(eye.angle) * .24;
        if (surrounded && moving && age < 3.4) {
          mesh.position.lerpVectors(eye.waveHome, mesh.position, THREE.MathUtils.smoothstep(age, 1.75, 3.4));
        }
        mesh.updateWorldMatrix(true, false);
        mesh.getWorldPosition(projected);
        projected.project(camera);
        const target = labels[i];
        if (target) {
          const x = (projected.x * .5 + .5) * width;
          const y = (-projected.y * .5 + .5) * height;
          const size = Math.max(32, height * mesh.scale.x / ((camera.position.z - mesh.position.z) * Math.tan(23 * Math.PI / 180)));
          target.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
          target.style.width = `${size}px`;
          target.style.height = `${Math.max(32, size * .55)}px`;
          target.style.setProperty("--eye-color", active && reading ? EMOTIONS.find((e) => e.id === reading.reaction)!.color : "#7d9088");
          target.style.setProperty("--eye-opacity", String(1 - eye.ring * .17));
          target.style.setProperty("--presence", String(ending ? 1 : presence * fading));
          target.style.setProperty("--memory", String(remembers ? memoryPulse : 0));
          const whisper = whispers[i];
          const whisperSize = whisper ? whisperSizes.get(whisper) : undefined;
          const halfWhisper = (whisperSize?.width ?? 0) / 2;
          // Edge captions stay legible without relocating their eyes.
          target.style.setProperty("--whisper-x", `${THREE.MathUtils.clamp(x, halfWhisper + 12, width - halfWhisper - 12) - x}px`);
          // Keep the amplified captions below the header and above the footer.
          // Only the caption shifts; the eye remains at its existing coordinates.
          const whisperGap = reading?.delivery === "sneer" ? 8 : reading?.delivery === "praise" ? 6 : 2;
          const whisperTop = y - Math.max(32, size * .55) / 2 - whisperGap - (whisperSize?.height ?? 0);
          target.style.setProperty("--whisper-y", foreground
            ? `${THREE.MathUtils.clamp(whisperTop, width < 700 ? 84 : 100, height - 70 - (whisperSize?.height ?? 0)) - whisperTop}px`
            : "0px");
          if (remembers) {
            const memoryWidth = width < 760 ? Math.min(220, width * .44) : Math.min(220, width * .48);
            const memoryX = THREE.MathUtils.clamp(x, memoryWidth / 2 + 14, width - memoryWidth / 2 - 14) - x;
            target.style.setProperty("--memory-x", `${memoryX}px`);
            target.toggleAttribute("data-memory-above", y > height * .62);
          }
        }
      });
      embers.visible = moving && surge > .03 && foregroundEyes.length > 0;
      if (embers.visible) {
        for (let i = 0; i < emberCount; i++) {
          const origin = foregroundEyes[i % foregroundEyes.length].mesh.position;
          const [a, b, c] = emberSeeds[i];
          const life = (age * (praise ? .13 : .3) + a) % 1;
          emberPositions[i * 3] = origin.x + (b - .5) * (praise ? 1.8 : .65) + Math.sin(life * 7 + c * 10) * life * .55;
          emberPositions[i * 3 + 1] = origin.y + life * (praise ? 1.4 + b : 2 + b * 2);
          emberPositions[i * 3 + 2] = origin.z + (c - .5) * .8;
        }
        emberGeometry.attributes.position.needsUpdate = true;
        emberMaterial.opacity = .4 * surge;
        emberMaterial.color.copy(praise ? praiseColor : colors.annoying);
        emberMaterial.size = praise ? .027 : .04;
      }
      threads.visible = moving && pressure > .015 && foregroundEyes.length > 1;
      if (threads.visible) {
        for (let strand = 0; strand < threadCount; strand++) {
          const start = foregroundEyes[strand % foregroundEyes.length].mesh.position;
          const end = foregroundEyes[(strand + 1) % foregroundEyes.length].mesh.position;
          const bend = .5 + (strand % 3) * .35 + revealAmount * 3;
          for (let step = 0; step < threadSteps; step++) {
            for (let side = 0; side < 2; side++) {
              const t = (step + side) / threadSteps;
              const arc = Math.sin(t * Math.PI);
              const at = ((strand * threadSteps + step) * 2 + side) * 3;
              threadPositions[at] = THREE.MathUtils.lerp(start.x, end.x, t) + arc * Math.sin(strand * 2.4) * bend;
              threadPositions[at + 1] = THREE.MathUtils.lerp(start.y, end.y, t) + arc * bend;
              threadPositions[at + 2] = THREE.MathUtils.lerp(start.z, end.z, t) + arc * (.8 + strand * .08);
            }
          }
        }
        threadGeometry.attributes.position.needsUpdate = true;
        threadMaterial.color.copy(praise ? praiseColor : colors.annoying);
        threadMaterial.opacity = (praise ? .045 : .032) * pressure * (1 - revealAmount) * (1 - thresholdAttention * .7);
      }
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      renderer.domElement.hidden = true;
      root.parentElement?.removeAttribute("data-eye-portraits");
      root.parentElement?.style.removeProperty("--eye-portraits");
      for (const target of labels) {
        target?.style.removeProperty("transform");
        target?.style.removeProperty("width");
        target?.style.removeProperty("height");
      }
      setUnavailable(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      whisperObserver.disconnect();
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("click", onClick, true);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", clearPointer);
      reduceMotion.removeEventListener("change", onMotion);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      eyes.forEach((eye) => eye.material.dispose());
      plane.dispose();
      memoryTexture.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      orbitMaterials.forEach((m) => m.dispose());
      orbitGeometries.forEach((g) => g.dispose());
      emberGeometry.dispose();
      emberMaterial.dispose();
      threadGeometry.dispose();
      threadMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      root.parentElement?.removeAttribute("data-eye-portraits");
      root.parentElement?.style.removeProperty("--eye-portraits");
    };
  }, []);

  return (
    <div className={`eyes-scene ${unavailable ? "scene-fallback" : ""}`} ref={host} aria-label="100人の目が浮かぶ観測空間">
      <div className="eye-targets">
        {PERSONAS.map((p, i) => {
          const reading = props.observation?.readings[i];
          const emotion = reading && EMOTIONS.find((e) => e.id === reading.reaction);
          const witness = witnesses.indexOf(p.id);
          const foreground = frontIds.includes(p.id);
          const speaking = reading && (foreground || sideIds.includes(p.id) || witness !== -1);
          const available = visibleIndices.includes(i);
          return (
            <button
              key={p.id}
              data-eye-id={p.id}
              data-reaction={reading?.reaction}
              data-witness={witness !== -1 ? quietReactions[witness] : undefined}
              data-foreground={foreground || undefined}
              data-sneer={sideIds.includes(p.id) || undefined}
              data-changed={changes.has(p.id) || undefined}
              data-feelings={reading ? JSON.stringify(reading.feelings) : undefined}
              data-remembers={props.revision?.memory?.id === p.id || undefined}
              ref={(el) => { targets.current[i] = el; }}
              className={`eye-target delivery-${reading?.delivery ?? "waiting"} ${reading && Array.from(thoughtFor(reading, i)).length > 8 ? "has-long-voice" : ""} ${props.selected === p.id ? "is-selected" : ""} ${speaking ? "is-speaking" : ""}`}
              aria-label={`観測者 ${String(i + 1).padStart(3, "0")}${emotion ? `、${reading?.delivery === "praise" ? "称賛" : reading?.delivery === "sneer" ? "冷笑" : emotion.label}` : ""}の内面を見る`}
              aria-haspopup="dialog"
              aria-expanded={props.selected === p.id}
              aria-hidden={!available}
              tabIndex={tabIndex === i ? 0 : -1}
              onKeyDown={(e) => {
                const direction = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                if (!direction) return;
                e.preventDefault();
                const next = visibleIndices[(visibleIndices.indexOf(i) + direction + visibleIndices.length) % visibleIndices.length];
                setFocusedIndex(next);
                targets.current[next]?.focus();
              }}
              onClick={() => props.onSelect(p.id)}
              style={unavailable ? { left: `${8 + (i % 10) * 9.3}%`, top: `${13 + Math.floor(i / 10) * 7.4}%`, "--arrival-at": `${fallbackDelays[i]}s` } as CSSProperties : undefined}
            >
              {unavailable && <span key={props.sequence} className="fallback-eye" />}
              <span className="eye-glimmer" aria-hidden="true" />
              <span className={`eye-number ${i % 9 === 0 ? "show-number" : ""}`}>{String(i + 1).padStart(3, "0")}</span>
              {reading && speaking && <span className="eye-whisper" aria-hidden="true">
                {reading.delivery === "loud" || reading.delivery === "praise" || reading.delivery === "sneer"
                  ? <><span className="voice-main">{thoughtFor(reading, i)}</span><span className="voice-echo">{thoughtFor(reading, i)}</span></>
                  : <span className="quiet-thought">{thoughtFor(reading, i)}</span>}
              </span>}
              {props.revision?.memory?.id === p.id && props.phase === "reality" &&
                <span className="eye-memory" aria-hidden="true">{props.revision.memory.text}</span>}
            </button>
          );
        })}
      </div>
      {unavailable && <p className="fallback-note">この端末では、軽量表示で体験できます</p>}
    </div>
  );
}
