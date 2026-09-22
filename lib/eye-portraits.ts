import * as THREE from "three";
import { EMOTIONS, type Reading } from "./experience";
import { eyeFragment, eyeVertex } from "./eye-shaders";

// One still atlas, drawn by the room's renderer, serves the whole archive.
// The seed, shader, iris colour and eyelid opening belong to the same person.
// Opening 100 disclosures never creates another WebGL context or animation loop.
export function eyePortraitAtlas(renderer: THREE.WebGLRenderer, seeds: number[], readings?: Reading[]) {
  const cellWidth = 128, cellHeight = 84, columns = 10;
  const width = cellWidth * columns, height = cellHeight * Math.ceil(seeds.length / columns);
  const target = new THREE.WebGLRenderTarget(width, height);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.12, 1.12, .735, -.735, .1, 10);
  camera.position.z = 3;
  const geometry = new THREE.PlaneGeometry(2, 1.3, 16, 8);
  const blank = new THREE.Texture();
  const material = new THREE.ShaderMaterial({
    vertexShader: eyeVertex, fragmentShader: eyeFragment,
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uSeed: { value: 0 }, uOpen: { value: 1 },
      uActive: { value: 0 }, uOpacity: { value: 1 }, uSelected: { value: 0 },
      uWitness: { value: 0 }, uImprint: { value: 0 }, uArrival: { value: 0 },
      uMemory: { value: 0 }, uMemoryText: { value: blank },
      uColor: { value: new THREE.Color("#91a39c") }, uGaze: { value: new THREE.Vector2() },
    },
  });
  const eye = new THREE.Mesh(geometry, material);
  scene.add(eye);
  const oldTarget = renderer.getRenderTarget();
  const oldAutoClear = renderer.autoClear;
  try {
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.autoClear = false;
    seeds.forEach((seed, index) => {
      const reading = readings?.[index];
      material.uniforms.uSeed.value = seed;
      material.uniforms.uActive.value = reading ? 1 : 0;
      material.uniforms.uOpen.value = reading
        ? .43 + reading.feelings.interest * .55 - reading.feelings.discomfort * .08 : .82 + seed * .25;
      material.uniforms.uColor.value.set(EMOTIONS.find((emotion) => emotion.id === reading?.reaction)?.color ?? "#91a39c");
      eye.rotation.z = Math.sin(seed * 93) * .21;
      target.viewport.set(index % columns * cellWidth, height - (Math.floor(index / columns) + 1) * cellHeight, cellWidth, cellHeight);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    });
    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d")!;
    const image = context.createImageData(width, height);
    for (let row = 0; row < height; row++) {
      const start = (height - row - 1) * width * 4;
      image.data.set(pixels.subarray(start, start + width * 4), row * width * 4);
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    renderer.autoClear = oldAutoClear;
    renderer.setRenderTarget(oldTarget);
    target.dispose();
    geometry.dispose();
    material.dispose();
    blank.dispose();
  }
}
