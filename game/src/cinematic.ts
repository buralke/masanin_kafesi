import * as THREE from 'three';

export const INTRO_DURATION = 27;
export function introChapter(time: number) {
  if (time < 8) return 'Birlikte başlayan bir gün';
  if (time < 13) return 'Maşanın Kafesi açılıyor';
  if (time < 17) return 'Önce küçük bir öpücük';
  if (time < 24) return 'İlk misafirlerimiz geliyor';
  return 'Bu küçük dünya artık senin';
}
const ease = (t: number) => { t = THREE.MathUtils.clamp(t,0,1); return t*t*(3-2*t); };
function between(a: number[], b: number[], t: number) { return new THREE.Vector3(...a as [number,number,number]).lerp(new THREE.Vector3(...b as [number,number,number]),ease(t)); }
type Props = {
  camera: THREE.PerspectiveCamera;
  masha: THREE.Group;
  bear: THREE.Group;
  guests: THREE.Group[];
  tables: () => [number,number][];
  door: THREE.Group;
  sign: THREE.Group;
  hands: THREE.Group;
  hearts: THREE.Group;
  feet: THREE.Mesh[];
  gameCamera: THREE.Vector3;
  gameFov: () => number;
};
export class Opening {
  time = 0;
  active = false;
  constructor(private p: Props) {}
  start() { this.time = 0; this.active = true; this.p.guests.forEach(g => g.visible = false); }
  finish() {
    this.active = false;
    const p = this.p;
    p.masha.position.set(0,0,-.8); p.masha.rotation.set(0,0,0);
    p.bear.position.set(4.2,0,-3.4); p.bear.rotation.set(0,0,0);
    p.guests.forEach((g,i) => { const [x,z] = p.tables()[i]; g.visible = true; g.position.set(x,.2,z+1); g.rotation.set(0,0,0); });
    p.door.rotation.y = -Math.PI*.65; p.sign.rotation.y = Math.PI;
    p.hands.visible = false; p.hearts.visible = false;
    p.camera.position.copy(p.gameCamera); p.camera.lookAt(0,0,1); p.camera.fov = p.gameFov(); p.camera.updateProjectionMatrix();
    p.feet.forEach(f => f.position.z = .1);
  }
  update(delta: number) {
    if (!this.active) return false;
    this.time = Math.min(INTRO_DURATION,this.time+delta);
    const t = this.time, p = this.p;
    const walk = ease(t/8);
    p.masha.position.set(-.65,Math.sin(t*9)*.035,13.5-walk*4.2);
    p.bear.position.set(.65,Math.sin(t*9)*.025,13.5-walk*4.2);
    p.masha.rotation.y = Math.PI; p.bear.rotation.y = Math.PI;
    p.hands.visible = t < 10;
    p.hands.position.set(0,1,13.5-walk*4.2);
    p.feet.forEach((f,i) => f.position.z = t < 8 ? Math.sin(t*9+i*Math.PI)*.22 : .1);
    p.door.rotation.y = -Math.PI*.65*ease((t-8.5)/2);
    p.sign.rotation.y = Math.PI*ease((t-10)/1.2);
    p.hearts.visible = t >= 13 && t < 17;
    if (t >= 10) {
      const enter = ease((t-10)/3);
      p.masha.position.set(-.6,0,9.3-enter*2.1);
      p.bear.position.set(.6,0,9.3-enter*2.1);
    }
    if (t >= 13 && t < 17) {
      p.masha.rotation.y = Math.PI/2; p.bear.rotation.y = -Math.PI/2;
      const lean = Math.sin(ease((t-13)/4)*Math.PI);
      p.masha.position.x = -.6+lean*.17; p.bear.position.x = .6-lean*.12;
      p.masha.rotation.z = -lean*.13; p.bear.rotation.z = lean*.09;
      p.hearts.position.set(0,2.1,7.3); p.hearts.rotation.y = t*.4;
      p.hearts.children.forEach((h,i) => { h.position.y = Math.sin(t*2+i)*.16 + i*.18; });
    } else { p.masha.rotation.z = 0; p.bear.rotation.z = 0; }
    if (t >= 17) {
      const settle = (t-17)/5;
      p.masha.position.copy(between([-.6,0,7.2],[0,0,-.8],settle));
      p.bear.position.copy(between([.6,0,7.2],[4.2,0,-3.4],settle));
      p.guests.forEach((g,i) => {
        const local = THREE.MathUtils.clamp((t-17-i*.65)/4.2,0,1);
        g.visible = t >= 17+i*.65;
        const [x,z] = p.tables()[i];
        if (local < .68) g.position.copy(between([0,0,11.5],[0,0,z+1],local/.68));
        else g.position.copy(between([0,0,z+1],[x,.2,z+1],(local-.68)/.32));
        g.position.y += local < 1 ? Math.sin(t*9+i)*.025 : 0;
        g.rotation.y = local < .68 ? Math.PI : x < 0 ? -Math.PI/2 : Math.PI/2;
      });
    }
    let position: THREE.Vector3, target: THREE.Vector3;
    const portrait = Math.min(1,p.camera.aspect);
    if (t < 8) {
      position = between([7,5.5,20],[5,4.5,16.2],t/8); target = between([0,1,12],[0,1.4,9.4],t/8);
    } else if (t < 13) {
      position = between([5,4.5,16.2],[5,4.2,12.5],(t-8)/5); target = new THREE.Vector3(0,1.5,8.3);
    } else if (t < 17) {
      position = between([5,4.2,12.5],[2.7,3.2,11.4],(t-13)/4); target = new THREE.Vector3(0,1.4,7.2);
    } else {
      position = between([2.7,3.2,11.4],p.gameCamera.toArray(),(t-17)/10); target = between([0,1.4,7.2],[0,0,1],(t-17)/10);
    }
    p.camera.position.copy(position); p.camera.lookAt(target);
    const filmFov = 45+Math.max(0,.8-portrait)*30;
    p.camera.fov = THREE.MathUtils.lerp(filmFov,p.gameFov(),ease((t-20)/7)); p.camera.updateProjectionMatrix();
    return t >= INTRO_DURATION;
  }
}
