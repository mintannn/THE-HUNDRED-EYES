// A procedural, shaded eye surface on a billboard in a real perspective scene.
// The almond silhouette, iris fibres, limbal ring and tear film are all GPU drawn.
export const eyeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 surface=position;
  surface.z+=.22*sqrt(max(0.0,1.0-position.x*position.x-position.y*position.y*1.8));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surface, 1.0);
}
`;

export const eyeFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uSeed;
uniform float uOpen;
uniform float uActive;
uniform float uOpacity;
uniform float uSelected;
uniform float uWitness;
uniform float uImprint;
uniform float uArrival;
uniform float uMemory;
uniform sampler2D uMemoryText;
uniform vec3 uColor;
uniform vec2 uGaze;

float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
  vec2 p=(vUv-.5)*2.0;
  float eyeX=p.x / .91;
  float curve=pow(max(0.0,1.0-eyeX*eyeX),.78);
  float height=.45 * uOpen * (1.0 + .13*sin(uSeed*19.0));
  float slant=eyeX * (.06*sin(uSeed*31.0));
  float y=p.y-slant;
  float edge=curve*height-abs(y);
  float mask=smoothstep(-.012,.012,edge)*(1.0-smoothstep(.98,1.03,abs(eyeX)));
  float lid=exp(-abs(edge)*100.0) * step(abs(eyeX),1.0);
  float shadow=exp(-abs(edge+.042)*38.0)*.2;
  if(mask+lid+shadow<.009) discard;

  float globe=sqrt(max(.0,1.0-eyeX*eyeX-y*y*2.0));
  vec3 sclera=mix(vec3(.11,.13,.135),vec3(.65,.68,.63),globe);
  sclera*=.52+.48*smoothstep(.0,.22,edge);
  sclera*=.77+.23*smoothstep(-.4,.35,y);
  float veins=noise(vec2(abs(eyeX)*18.0,y*27.0+uSeed*110.0));
  sclera-=vec3(.05,.075,.07)*smoothstep(.69,.77,veins)*abs(eyeX);

  vec2 ip=vec2(p.x-uGaze.x,y-uGaze.y);
  float radius=.30+.045*sin(uSeed*13.0);
  float r=length(ip)/radius;
  float a=atan(ip.y,ip.x);
  vec3 base=mix(vec3(.23,.30,.28),vec3(.42,.37,.24),uSeed);
  base=mix(base,uColor,.22+uActive*.64);
  float fibre=noise(vec2(a*37.0+uSeed*200.0,r*9.0));
  fibre+=.48*noise(vec2(a*91.0,r*15.0));
  float spokes=.5+.5*sin(a*109.0+sin(r*21.0+uSeed*13.0)*1.8);
  vec3 iris=base*(.32+fibre*.9+spokes*.17);
  iris+=base*.24*exp(-pow((r-.53)*9.0,2.0));
  iris*=smoothstep(.21,.37,r)*(1.0-.77*smoothstep(.78,1.0,r));
  float pupil=.30+.025*sin(uSeed*48.0);
  iris=mix(vec3(.002,.004,.005),iris,smoothstep(pupil-.018,pupil+.023,r));
  vec3 col=mix(sclera,iris,1.0-smoothstep(.94,1.015,r));
  // Reflected softbox and a very fine lower tear line.
  float spec=exp(-length((ip-vec2(-.088,.107))*vec2(24.,40.))*2.0);
  float spec2=exp(-length((ip-vec2(.083,-.071))*vec2(65.,80.))*2.0);
  col+=vec3(.78,.86,.84)*spec*(.8+uWitness) + spec2*.35;
  col+=vec3(.22,.17,.10)*uWitness*mask;
  // The light of a small rectangular screen, curved by the cornea.
  // Its return in one eye is an afterimage, never a floating UI badge.
  vec2 reflected = ip - vec2(-.045, .028);
  reflected.x += reflected.y * .28 + r * r * .012;
  float screen = (1.0-smoothstep(.066,.083,abs(reflected.x)))
    * (1.0-smoothstep(.037,.052,abs(reflected.y)));
  float lines = .25 + .4*smoothstep(.28,.78,sin(reflected.y*240.0)*.5+.5);
  col += vec3(.64,.72,.70)*screen*lines*uImprint*(1.0-smoothstep(.75,1.0,r));
  vec2 memoryUv=ip*vec2(1.9,3.2)+vec2(.5);
  float memoryBounds=step(0.0,memoryUv.x)*step(memoryUv.x,1.0)*step(0.0,memoryUv.y)*step(memoryUv.y,1.0);
  col+=texture2D(uMemoryText,memoryUv).rgb*uMemory*memoryBounds*(1.0-smoothstep(.72,1.0,r))*.8;
  col+=vec3(.26,.32,.31)*lid*(1.0-smoothstep(-.1,.0,y))*.5;
  col=mix(col,col+uColor*.24,uActive*.25);
  vec3 rim=mix(vec3(.14,.17,.16),uColor,uActive*.7);
  col=col*mask+rim*(lid*.35+shadow*.16);
  col+=uColor*uSelected*lid*.6;
  // The wave lives on the eye's wet surface; no circular overlay is drawn.
  col += vec3(.30,.37,.36) * uArrival * (mask*.36 + spec*1.3 + lid*.65);
  float alpha=clamp(mask+lid*.5+shadow*.2,0.0,1.0)*uOpacity;
  gl_FragColor=vec4(col,alpha);
}
`;
