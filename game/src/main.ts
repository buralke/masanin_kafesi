import * as THREE from 'three';
import { fresh, menu, parseSave, proposalReady, SAVE_KEY, drainKissNeed, receiveKiss } from './state';
import './style.css';
import { defaultLayout, layoutError, snapPosition, type TablePosition } from './layout';
import { Opening, introChapter, INTRO_DURATION } from './cinematic';

let save = fresh();
let storageError = false;
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) save = parseSave(raw); } catch { storageError = true; }
if (new URLSearchParams(location.search).get('newgame') === '1') {
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) localStorage.setItem(`${SAVE_KEY}:previous`,previous);
    save = fresh();
    localStorage.setItem(SAVE_KEY,JSON.stringify(save));
    const clean = new URL(location.href); clean.searchParams.delete('newgame');
    history.replaceState(null,'',clean);
  } catch { storageError = true; }
}
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<header><small>ORMANIN İÇİNDE, İKİMİZE BİR YER</small><h1>Maşanın Kafesi</h1><div id="stats"></div></header><main id="world" aria-label="Üç boyutlu orman kafesi"><div id="markers"></div><div id="reward" aria-hidden="true"></div></main><section class="panel"><p id="message" role="status">Hoş geldin Maşa. Sipariş almak için bir misafirine dokun.</p><div id="orders" aria-label="Alınan siparişler"></div><div id="prep" hidden><div class="prep-heading"><span id="recipe"></span><button id="cancel-prep" aria-label="Hazırlama alanını kapat">×</button></div><div id="worktop"><div id="cup"><div id="liquid"></div><span id="food-icon">☕</span></div><div id="pour-zone">iyi kıvam</div><div id="stream"></div><div id="icing"></div></div><p id="prep-hint"></p><button id="pour">Basılı tut · doldur</button></div><div id="tray" hidden><span id="tray-title"></span><button id="serve-token" aria-label="Hazır ürünü masaya sürükle"></button><small>Ürünü tut, siparişin olduğu masaya sürükle</small></div></section><details class="shop"><summary>Kafeye küçük dokunuşlar ✿</summary><div id="actions"></div></details><footer><button id="export">Kaydı indir</button><label class="file">Kaydı yükle<input id="import" type="file" accept="application/json"></label><span id="saved"></span></footer><dialog id="proposal"><small>KOCA AYIDAN MAŞAYA</small><h2>Sana bir yer ayırdım</h2><p>maşa bu küçük kafede sana bir masa ayırdım hayatımda da sana bir yer açmak istiyorum benimle çıkar mısın</p><button id="yes">Evet ♡</button><button id="thinking">Biraz düşünmek istiyorum</button><button id="close">Kafeye dön</button><p id="reply"></p></dialog><div id="drag-ghost" hidden aria-hidden="true"></div>`;
const $ = (id: string) => document.getElementById(id)!;
$('stats').insertAdjacentHTML('afterend', `<button id="kiss-visit" class="kiss-card"><span class="kiss-caption"><span>💋 Öpücük ihtiyacı</span><span id="kiss-value"></span></span><span id="kiss-meter" role="progressbar" aria-label="Öpücük ihtiyacı" aria-valuemin="0" aria-valuemax="100"><span id="kiss-fill"></span></span><span id="kiss-hint">Koca Ayı seni bekliyor</span></button>`);
$('world').insertAdjacentHTML('beforeend', '<div id="kiss-hearts" hidden aria-hidden="true"><span>♡</span><span>💋</span><span>♡</span></div>');
$('orders').insertAdjacentHTML('afterend', '<button id="special-evening" hidden>♡ Koca Ayının özel masası</button>');
$('world').insertAdjacentHTML('beforebegin', '<div class="layout-toolbar"><button id="edit-layout">✥ Masaları yerleştir</button><div id="layout-controls" hidden><button id="layout-done">Yerleşimi kaydet</button><button id="layout-cancel">Vazgeç</button><button id="layout-reset">İlk düzene dön</button></div></div>');
$('world').insertAdjacentHTML('beforeend', '<div id="film-overlay" hidden><div class="film-top"><span>MAŞA & KOCA AYI</span><button id="skip-intro">Atla ›</button></div><div class="film-bottom"><small>BİR KÜÇÜK KAFE HİKÂYESİ</small><h2 id="film-title"></h2><p id="film-caption"></p><div class="film-progress"><i id="film-progress"></i></div></div></div>');
$('export').insertAdjacentHTML('beforebegin','<button id="replay-intro">▷ Açılışı tekrar izle</button>');
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); storageError = false; } catch { storageError = true; } $('saved').textContent = storageError ? 'Kayıt saklanamadı; kaydı indir.' : 'İlerleme kaydedildi'; }
function message(text: string) { $('message').textContent = text; }

const scene = new THREE.Scene();
scene.background = new THREE.Color('#293e35');
scene.fog = new THREE.Fog('#293e35', 30, 55);
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 90);
camera.position.set(3, 20, 23); camera.lookAt(0, 0, 1);
scene.add(new THREE.HemisphereLight(0xffefda, 0x4e6450, 2.5));
const sun = new THREE.DirectionalLight(0xffcf98, 3); sun.position.set(3, 9, 5); scene.add(sun);
function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  mesh.position.set(x, y, z); scene.add(mesh); return mesh;
}
box(12, .3, 15, '#bb916b', 0, -.15, 1);
for (let i = 0; i < 15; i++) box(11.9, .015, .025, '#9c7559', 0, .015, i - 6);
box(12, 2.3, .25, '#d7b991', 0, 1, -6.5);
box(.25, 2.3, 15, '#d7b991', -6, 1, 1);
box(6.5, 1.3, 1, '#637f70', -.5, .65, -4.8);
box(6.8, .15, 1.3, '#efd4ab', -.5, 1.35, -4.8);
box(.9, .85, .7, '#393e3a', -1.7, 1.8, -4.8);
// Forest path and a real hinged entrance, visible in both cinematic and play.
box(36,.2,40,'#45624b',0,-.5,3);
for (let i = 0; i < 8; i++) box(2.3,.08,.65,i%2 ? '#c8b795' : '#bba988',0,-.24,9+i*.85);
box(.2,3,.2,'#775740',-1.35,1.5,8.35); box(.2,3,.2,'#775740',1.35,1.5,8.35);
box(2.9,.2,.25,'#775740',0,3,8.35);
const entranceDoor = new THREE.Group(); entranceDoor.position.set(-1.3,0,8.35); scene.add(entranceDoor);
const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.6,2.7,.12),new THREE.MeshStandardMaterial({color:'#91b5a2',transparent:true,opacity:.48}));
doorPanel.position.set(1.3,1.4,0); entranceDoor.add(doorPanel);
const knob = new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),new THREE.MeshStandardMaterial({color:'#dbb76b',metalness:.6,roughness:.4})); knob.position.set(2.35,1.25,.12); entranceDoor.add(knob);
function textBoard(text: string, color: string) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f5e5cb'; ctx.fillRect(0,0,512,192);
  ctx.fillStyle = color; ctx.font = 'bold 58px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text,256,96);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide});
}
const openSign = new THREE.Group(); openSign.position.set(0,2.3,8.5); scene.add(openSign);
const closedBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.3,.48),textBoard('KAPALI','#9b6269')); openSign.add(closedBoard);
const openedBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.3,.48),textBoard('AÇIK ♡','#456950')); openedBoard.rotation.y = Math.PI; openedBoard.position.z = -.01; openSign.add(openedBoard);
const cafeTitle = new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.25),textBoard('Maşanın Kafesi','#456950')); cafeTitle.position.set(0,3.8,8.4); scene.add(cafeTitle);
// Three rows, two sides, with an uninterrupted central aisle.
let tablePositions: TablePosition[] = save.tablePositions.map(p => [...p]);
const tableMeshes = tablePositions.map(([x,z]) => [
  box(1.7, .16, 1.2, '#edc596', x, 1, z),
  box(.2, 1, .2, '#725443', x, .5, z),
  box(.75, .5, .7, '#a56c65', x, .25, z + 1),
]);
const layoutGuide = new THREE.Group(); scene.add(layoutGuide); layoutGuide.visible = false;
for (const x of [-3.25,3.25]) {
  const area = new THREE.Mesh(new THREE.PlaneGeometry(2.5,7.5), new THREE.MeshBasicMaterial({color:'#a9ddaa',transparent:true,opacity:.25,depthWrite:false}));
  area.rotation.x = -Math.PI/2; area.position.set(x,.04,2.75); layoutGuide.add(area);
}
const grid = new THREE.GridHelper(12,24,'#e9d5a8','#e9d5a8'); grid.position.set(0,.06,2.5); layoutGuide.add(grid);
function sphere(parent: THREE.Group, radius: number, color: string, x: number, y: number, z: number, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(x, y, z); mesh.scale.set(...scale as [number, number, number]); parent.add(mesh);
}
const bear = new THREE.Group(); bear.position.set(4.2, 0, -3.4); scene.add(bear);
sphere(bear, .65, '#815b43', 0, .8, 0, [1, 1.25, .8]); sphere(bear, .5, '#966a4a', 0, 1.7, 0);
for (const x of [-.34, .34]) sphere(bear, .2, '#815b43', x, 2.08, 0);
sphere(bear, .27, '#d6b78b', 0, 1.55, .38, [1, .7, .5]);
for (const x of [-.17, .17]) sphere(bear, .045, '#242925', x, 1.8, .45);
// Articulated limbs give the characters an actual walking silhouette.
const bearFeet: THREE.Mesh[] = [];
for (const side of [-1,1]) {
  const foot = new THREE.Mesh(new THREE.SphereGeometry(.23,12,8),new THREE.MeshStandardMaterial({color:'#684b37'}));
  foot.position.set(side*.32,.18,.12); bear.add(foot); bearFeet.push(foot);
  sphere(bear,.19,'#815b43',side*.68,1.1,0,[.8,1.9,.8]);
}
const masha = new THREE.Group(); masha.position.set(0, 0, -.8); scene.add(masha);
sphere(masha, .37, '#bb657b', 0, .65, 0, [1, 1.6, 1]); sphere(masha, .34, '#f0ceaa', 0, 1.35, 0);
sphere(masha, .38, '#b55e77', 0, 1.48, -.12);
for (const x of [-.12, .12]) sphere(masha, .035, '#343b32', x, 1.4, .31);
for (const side of [-1,1]) { sphere(masha,.12,'#bb657b',side*.34,.9,0,[.8,1.8,.8]); sphere(masha,.09,'#f0ceaa',side*.36,.68,0); }
const feet: THREE.Mesh[] = [];
for (const x of [-.18, .18]) {
  const foot = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), new THREE.MeshStandardMaterial({ color: '#4d3c37' }));
  foot.position.set(x, .16, .1); masha.add(foot); feet.push(foot);
}
const customers = tablePositions.map(([x,z], i) => {
  const guest = new THREE.Group(); guest.position.set(x, .2, z + 1); scene.add(guest);
  sphere(guest, .3, ['#7c9da5', '#d3a269', '#ad91b4'][i % 3], 0, .55, 0, [1, 1.3, 1]);
  sphere(guest, .26, '#ebcba8', 0, 1.12, 0);
  for (const eye of [-.09,.09]) sphere(guest,.025,'#343b32',eye,1.15,.24);
  return guest;
});
const linkedHands = new THREE.Group(); scene.add(linkedHands); linkedHands.visible = false;
for (const [from,to,color] of [
  [new THREE.Vector3(-.34,.05,0),new THREE.Vector3(0,0,0),'#f0ceaa'],
  [new THREE.Vector3(.25,.35,0),new THREE.Vector3(0,0,0),'#815b43'],
] as const) {
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,from.distanceTo(to),10),new THREE.MeshStandardMaterial({color}));
  limb.position.copy(from).add(to).multiplyScalar(.5); limb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize()); linkedHands.add(limb);
}
sphere(linkedHands,.13,'#edbd9a',0,0,0);
const cinematicHearts = new THREE.Group(); scene.add(cinematicHearts); cinematicHearts.visible = false;
const heartShape = new THREE.Shape(); heartShape.moveTo(0,-.28); heartShape.bezierCurveTo(-.65,.1,-.45,.65,0,.3); heartShape.bezierCurveTo(.45,.65,.65,.1,0,-.28);
for (let i=0;i<5;i++) {
  const heart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape),new THREE.MeshBasicMaterial({color:i%2 ? '#f5c4cf' : '#dc8aa4',side:THREE.DoubleSide}));
  heart.position.set((i-2)*.28,i*.15,0); heart.scale.setScalar(.45+i*.04); cinematicHearts.add(heart);
}
for (let i = 0; i < 18; i++) {
  const angle = i / 18 * Math.PI * 2; const x = Math.cos(angle) * 10; const z = Math.sin(angle) * 12 + 1;
  box(.35, 2, .35, '#624d3d', x, .7, z);
  const tree = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.8, 7), new THREE.MeshStandardMaterial({ color: i % 2 ? '#456854' : '#52735b' })); tree.position.set(x, 3, z); scene.add(tree);
}
const decor = new THREE.Group(); scene.add(decor);
function updateDecor() {
  while (decor.children.length) { const child = decor.children[0] as THREE.Mesh; child.geometry.dispose(); (child.material as THREE.Material).dispose(); decor.remove(child); }
  if (save.decorations.includes('flowers')) for (const [x,z] of tablePositions) sphere(decor, .18, '#e5a4b4', x, 1.25, z);
  if (save.decorations.includes('lights')) for (let i = 0; i < 11; i++) sphere(decor, .09, '#ffe3a2', i - 5, 2.5, -6.2);
  if (save.decorations.includes('table')) for (const [x,z] of tablePositions) sphere(decor, .35, '#e4b8bc', x, 1.12, z, [2, .08, 1.5]);
}
let renderer: THREE.WebGLRenderer | null = null;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); $('world').append(renderer.domElement);
} catch { $('world').textContent = '3B görünüm başlatılamadı. Sayfayı Safari’de yeniden açmayı deneyebilirsin.'; }
function gameFov() { return Math.max(43, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(36) / 2) / camera.aspect))); }
function resize() {
  const w = $('world').clientWidth, h = $('world').clientHeight;
  camera.aspect = w / h;
  // Preserve enough horizontal field of view on narrow phones without clipping the cafe.
  camera.fov = gameFov();
  camera.updateProjectionMatrix(); renderer?.setSize(w, h);
}
window.addEventListener('resize', resize); resize();
type Order = { item: number; status: 'waiting' | 'ordered' | 'served'; rest: number };
const icons = ['☕', '🍵', '🍫', '🍰'];
let orders: Order[] = tablePositions.map((_, i) => ({ item: (save.served + i) % menu.length, status: 'waiting', rest: 0 }));
let selected: number | null = null;
let ready: number | null = null;
let prepFor: number | null = null;
let fill = 0, holding = false, icingDistance = 0;
let moveDone: (() => void) | null = null;
const waypoints: THREE.Vector3[] = [];
const goal = new THREE.Vector3();
let moving = false;
let kissAnimation = 0;
let editingLayout = false;
const opening = new Opening({camera,masha,bear,guests:customers,tables:() => tablePositions,door:entranceDoor,sign:openSign,hands:linkedHands,hearts:cinematicHearts,feet,gameCamera:new THREE.Vector3(3,20,23),gameFov});
function startOpening() {
  if (editingLayout || moving || waypoints.length || prepFor !== null || ready !== null || kissAnimation > 0 || dialog.open) return message('Önce elindeki işi bitir; sonra açılışı birlikte izleyelim.');
  opening.start(); app.classList.add('is-cinematic'); $('film-overlay').hidden = false;
  Array.from(app.children).forEach(el => { if (el.id !== 'world') (el as HTMLElement).inert = true; });
  $('markers').inert = true;
  resize();
}
function finishOpening() {
  opening.finish(); app.classList.remove('is-cinematic'); $('film-overlay').hidden = true;
  Array.from(app.children).forEach(el => (el as HTMLElement).inert = false); $('markers').inert = false;
  save.introSeen = true; persist(); resize(); renderUI();
  message('Günaydın Maşa! Kafemiz açıldı. Sipariş almak için bir misafirine dokun.');
}
$('skip-intro').onclick = finishOpening;
$('replay-intro').onclick = startOpening;
function walkTo(x: number, z: number, done: () => void = () => {}) {
  if (opening.active) return;
  // All working positions join the central aisle so Maşa goes around tables.
  waypoints.length = 0;
  if (Math.abs(masha.position.x) > .2) waypoints.push(new THREE.Vector3(0, 0, masha.position.z));
  waypoints.push(new THREE.Vector3(0, 0, z), new THREE.Vector3(x, 0, z));
  moveDone = done;
}
function customerPosition(i: number): [number, number] {
  const [x,z] = tablePositions[i]; return [x - Math.sign(x)*1.5,z];
}
function chooseTable(i: number) {
  if (editingLayout) return;
  if (ready !== null) {
    message('Hazır ürünü tepsiden tutup doğru masaya sürükle.'); return;
  }
  if (prepFor !== null || moving || waypoints.length || kissAnimation > 0) return;
  const order = orders[i];
  if (order.status === 'served') return message('Misafirimiz ikramının tadını çıkarıyor. Başka bir masaya bakabilirsin.');
  selected = i;
  const [x,z] = customerPosition(i);
  message(`Maşa ${i + 1}. masaya gidiyor…`);
  walkTo(x,z, () => {
    order.status = 'ordered';
    message(`${i + 1}. masa: Bir ${menu[order.item].toLocaleLowerCase('tr')} lütfen. Şimdi ${order.item === 3 ? 'pasta tezgâhına' : 'içecek tezgâhına'} dokun.`);
    renderUI();
  });
  renderUI();
}
type Marker = { element: HTMLButtonElement; point: THREE.Vector3 };
const markers: Marker[] = [];
function marker(label: string, x: number, y: number, z: number, action: () => void, className: string) {
  const el = document.createElement('button'); el.className = `marker ${className}`; el.textContent = label;
  el.onclick = action; $('markers').append(el);
  markers.push({ element: el, point: new THREE.Vector3(x,y,z) }); return el;
}
const tableMarkers = tablePositions.map(([x,z],i) => marker('',x,1.8,z,() => chooseTable(i),'table-marker'));
marker('☕',-1.7,2.3,-4.8,() => startPrep(false),'station').setAttribute('aria-label','İçecek tezgâhı');
marker('🍰',1.2,2.3,-4.8,() => startPrep(true),'station').setAttribute('aria-label','Pasta tezgâhı');
const bearMarker = marker('💋',4.2,2.9,-3.4,visitBear,'bear-marker');
bearMarker.setAttribute('aria-label','Koca Ayıya git ve öpücük al');
function applyLayout(layout: TablePosition[]) {
  layout.forEach(([x,z],i) => {
    const [oldX,oldZ] = tablePositions[i];
    tableMeshes[i].forEach(mesh => { mesh.position.x += x-oldX; mesh.position.z += z-oldZ; });
    customers[i].position.set(x,.2,z+1);
    markers.find(m => m.element === tableMarkers[i])!.point.set(x,1.8,z);
  });
  tablePositions = layout.map(p => [...p]); updateDecor();
}
function setLayoutMode(active: boolean) {
  editingLayout = active; layoutGuide.visible = active;
  $('world').classList.toggle('editing-layout',active);
  $('edit-layout').hidden = active; $('layout-controls').hidden = !active;
  $('orders').hidden = active; $('special-evening').hidden = active || !(proposalReady(save) || save.answer);
  tableMarkers.forEach((el,i) => { el.textContent = active ? `✥ ${i+1}` : el.textContent; });
  if (!active) renderUI();
}
$('edit-layout').onclick = () => {
  if (opening.active) return;
  if (moving || waypoints.length || prepFor !== null || ready !== null || kissAnimation > 0) return message('Önce elindeki işi bitir; sonra kafeyi birlikte düzenleyelim.');
  setLayoutMode(true); message('Masaların ✥ işaretini tutup yeşil alanlara sürükle. Bitince yerleşimi kaydet. Oyun bu sırada bekler.');
};
$('layout-done').onclick = () => {
  if (layoutDrag !== null) return;
  const error = layoutError(tablePositions); if (error) return message(error);
  save.tablePositions = tablePositions.map(p => [...p]); persist();
  masha.position.set(0,0,-.8); setLayoutMode(false); message('Yeni yerleşimin kaydedildi! Siparişlere kaldığımız yerden devam edelim.');
};
$('layout-cancel').onclick = () => {
  if (layoutDrag !== null) return;
  applyLayout(save.tablePositions); setLayoutMode(false); message('Önceki yerleşim korundu.');
};
$('layout-reset').onclick = () => {
  if (layoutDrag !== null) return;
  applyLayout(defaultLayout()); message('İlk düzen hazır. Kalıcı olması için yerleşimi kaydet.');
};
const layoutRay = new THREE.Raycaster();
const layoutPlane = new THREE.Plane(new THREE.Vector3(0,1,0),-1.8);
let layoutDrag: {id:number;pointer:number;original:TablePosition;offset:THREE.Vector3} | null = null;
function layoutPoint(e: PointerEvent): THREE.Vector3 | null {
  const rect = $('world').getBoundingClientRect();
  layoutRay.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
  return layoutRay.ray.intersectPlane(layoutPlane,new THREE.Vector3());
}
function finishLayoutDrag(cancel: boolean) {
  if (!layoutDrag) return;
  const {id,original} = layoutDrag;
  const error = cancel ? null : layoutError(tablePositions);
  if (cancel || error) {
    const restored = tablePositions.map(p => [...p] as TablePosition); restored[id] = original; applyLayout(restored);
    message(error ?? 'Taşıma iptal edildi.');
  } else message(`${id+1}. masa yerleşti. Diğer masaları da taşıyabilir veya yerleşimi kaydedebilirsin.`);
  tableMarkers[id].classList.remove('layout-invalid','layout-dragging'); layoutDrag = null;
}
tableMarkers.forEach((el,i) => {
  el.onpointerdown = e => {
    if (!editingLayout || layoutDrag) return;
    const point = layoutPoint(e); if (!point) return;
    e.preventDefault();
    layoutDrag = {id:i,pointer:e.pointerId,original:[...tablePositions[i]],offset:point.sub(new THREE.Vector3(tablePositions[i][0],1.8,tablePositions[i][1]))};
    el.setPointerCapture(e.pointerId); el.classList.add('layout-dragging');
  };
  el.onpointermove = e => {
    if (!layoutDrag || layoutDrag.id !== i || layoutDrag.pointer !== e.pointerId) return;
    const point = layoutPoint(e); if (!point) return;
    point.sub(layoutDrag.offset);
    const layout = tablePositions.map(p => [...p] as TablePosition);
    layout[i] = snapPosition(point.x,point.z); applyLayout(layout);
    el.classList.toggle('layout-invalid',!!layoutError(layout));
  };
  el.onpointerup = e => { if (layoutDrag?.pointer === e.pointerId) finishLayoutDrag(false); };
  el.onpointercancel = el.onlostpointercapture = () => finishLayoutDrag(true);
  el.onkeydown = e => {
    if (!editingLayout || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    e.preventDefault(); const layout = tablePositions.map(p => [...p] as TablePosition);
    layout[i][0] += e.key === 'ArrowLeft' ? -.5 : e.key === 'ArrowRight' ? .5 : 0;
    layout[i][1] += e.key === 'ArrowUp' ? -.5 : e.key === 'ArrowDown' ? .5 : 0;
    const error = layoutError(layout); if (error) return message(error);
    applyLayout(layout);
  };
});
function updateKissUI() {
  const value = Math.ceil(save.kissNeed);
  $('kiss-value').textContent = `%${value}`;
  $('kiss-fill').style.width = `${save.kissNeed}%`;
  $('kiss-meter').setAttribute('aria-valuenow',String(value));
  $('kiss-visit').classList.toggle('low', save.kissNeed <= 30);
  bearMarker.classList.toggle('kiss-needed', save.kissNeed <= 30);
  $('kiss-hint').textContent = save.kissNeed <= 30 ? 'Bir öpücük molası? Koca Ayıya dokun ♡' : 'Minik bir mola için Koca Ayıya git';
}
function visitBear() {
  if (editingLayout) return message('Önce masa yerleşimini kaydet veya vazgeç.');
  if (moving || waypoints.length || kissAnimation > 0) return;
  if (prepFor !== null) return message('Hazırlamayı bitir veya × ile tezgâhtan ayrıl; sonra öpücük molasına gidebiliriz.');
  message('Maşa Koca Ayının yanına gidiyor… Siparişler seni bekler ♡');
  walkTo(3.4,-3.4, () => {
    masha.rotation.y = Math.PI / 2;
    bear.rotation.y = -Math.PI / 2;
    kissAnimation = 2;
    $('kiss-hearts').hidden = false;
    receiveKiss(save); persist(); updateKissUI();
    message('Mucuk! Koca Ayıdan kocaman bir öpücük. Şimdi çok daha iyi ♡');
  });
}
$('kiss-visit').onclick = visitBear;
$('special-evening').onclick = () => {
  if (editingLayout) return;
  if (moving || waypoints.length || kissAnimation > 0 || prepFor !== null || ready !== null) return message('Önce elindeki işi bitirelim Maşa.');
  if (proposalReady(save) || save.answer) walkTo(3.4,-3.4,openProposal);
};
function startPrep(cake: boolean) {
  if (editingLayout) return;
  if (prepFor !== null || ready !== null || moving || waypoints.length || kissAnimation > 0) return;
  if (selected === null || orders[selected].status !== 'ordered') return message('Önce bir misafirine dokunup siparişini al.');
  const i = selected;
  if ((orders[i].item === 3) !== cake) return message(`Bu sipariş için ${cake ? 'içecek' : 'pasta'} tezgâhını kullanmalısın.`);
  message('Maşa tezgâha gidiyor…');
  walkTo(cake ? 1.2 : -1.7,-3.8, () => {
    prepFor = i; fill = 0; icingDistance = 0;
    $('prep').hidden = false; $('tray').hidden = true;
    $('recipe').textContent = `${icons[orders[i].item]} ${menu[orders[i].item]} · Masa ${i + 1}`;
    $('prep-hint').textContent = cake ? 'Parmağını pastanın üzerinde gezdirerek kremasını çiz.' : 'Doldurmayı basılı tut. Sıvı yeşil aralığa geldiğinde bırak.';
    $('worktop').classList.toggle('cake',cake);
    $('pour').hidden = cake;
    $('icing').replaceChildren();
    $('liquid').style.height = '0%';
    $('food-icon').textContent = cake ? '🍰' : icons[orders[i].item];
    renderUI();
  });
}
function finishPrep() {
  if (prepFor === null) return;
  ready = prepFor; prepFor = null; holding = false;
  $('prep').hidden = true; $('tray').hidden = false;
  $('serve-token').textContent = icons[orders[ready].item];
  $('tray-title').textContent = `Hazır · ${ready + 1}. masa`;
  message('Ellerine sağlık! Şimdi ürünü tutup doğru masanın üzerine bırak.');
  renderUI();
}
$('cancel-prep').onclick = () => { prepFor = null; holding = false; $('prep').hidden = true; message('Siparişin duruyor; hazır olduğunda tezgâha dön.'); };
$('pour').onpointerdown = e => {
  if (prepFor === null || orders[prepFor].item === 3) return;
  e.preventDefault(); $('pour').setPointerCapture(e.pointerId); holding = true;
};
function releasePour() {
  if (!holding) return;
  holding = false;
  if (fill >= .60 && fill <= .86) finishPrep();
  else { fill = 0; $('liquid').style.height = '0%'; $('prep-hint').textContent = 'Bir daha deneyelim; yeşil aralıkta bırak. Malzemen hiç azalmıyor.'; }
}
$('pour').onpointerup = releasePour;
$('pour').onpointercancel = () => { holding = false; };
$('pour').onlostpointercapture = releasePour;
let lastIcing: {x:number;y:number} | null = null;
$('worktop').onpointerdown = e => {
  if (prepFor === null || orders[prepFor].item !== 3) return;
  e.preventDefault(); $('worktop').setPointerCapture(e.pointerId); lastIcing = {x:e.clientX,y:e.clientY};
};
$('worktop').onpointermove = e => {
  if (!lastIcing || prepFor === null) return;
  const rect = $('worktop').getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
  const distance = Math.hypot(e.clientX-lastIcing.x,e.clientY-lastIcing.y);
  if (distance < 5) return;
  icingDistance += Math.min(distance,20); lastIcing = {x:e.clientX,y:e.clientY};
  const dot = document.createElement('i'); dot.style.left = `${e.clientX-rect.left}px`; dot.style.top = `${e.clientY-rect.top}px`; $('icing').append(dot);
  $('prep-hint').textContent = `Kreması güzelleşiyor… %${Math.min(100,Math.floor(icingDistance / 3.5))}`;
  if (icingDistance >= 350) { lastIcing = null; finishPrep(); }
};
$('worktop').onpointerup = $('worktop').onpointercancel = () => { lastIcing = null; };
let dragPointer: number | null = null;
function moveDrag(e: PointerEvent) {
  $('drag-ghost').style.left = `${e.clientX}px`; $('drag-ghost').style.top = `${e.clientY}px`;
  tableMarkers.forEach((el,i) => {
    const r = el.getBoundingClientRect();
    const over = e.clientX >= r.left-12 && e.clientX <= r.right+12 && e.clientY >= r.top-20 && e.clientY <= r.bottom+35;
    el.classList.toggle('drop-hover',over && i === ready);
  });
}
$('serve-token').onpointerdown = e => {
  if (ready === null || moving || waypoints.length || kissAnimation > 0) return;
  e.preventDefault(); dragPointer = e.pointerId; $('serve-token').setPointerCapture(e.pointerId);
  $('drag-ghost').textContent = icons[orders[ready].item]; $('drag-ghost').hidden = false; moveDrag(e);
};
$('serve-token').onpointermove = e => { if (dragPointer === e.pointerId) moveDrag(e); };
$('serve-token').onpointerup = e => {
  if (dragPointer !== e.pointerId || ready === null) return;
  dragPointer = null; $('drag-ghost').hidden = true;
  const i = ready, r = tableMarkers[i].getBoundingClientRect();
  const hit = e.clientX >= r.left-12 && e.clientX <= r.right+12 && e.clientY >= r.top-20 && e.clientY <= r.bottom+35;
  tableMarkers.forEach(el => el.classList.remove('drop-hover'));
  if (!hit) return message('Bu sipariş başka bir masaya ait. Tepside duruyor; tekrar sürükleyebilirsin.');
  $('tray').hidden = true;
  message('Maşa siparişi masaya götürüyor…');
  const [x,z] = customerPosition(i);
  walkTo(x,z, () => {
    orders[i].status = 'served'; orders[i].rest = 9;
    ready = null; selected = null; save.served++; save.coins += 10; persist();
    $('reward').textContent = '+10 yaprak ♡'; $('reward').classList.remove('pop'); void $('reward').offsetWidth; $('reward').classList.add('pop');
    message('Misafirin çok mutlu! Diğer masalara bakabilir veya kafeyi süsleyebilirsin.'); renderUI();
  });
};
$('serve-token').onpointercancel = () => {
  dragPointer = null; $('drag-ghost').hidden = true; tableMarkers.forEach(el => el.classList.remove('drop-hover'));
};
function renderUI() {
  $('stats').textContent = `${save.coins} yaprak · ${save.served} sipariş`;
  tableMarkers.forEach((el,i) => {
    const order = orders[i];
    el.textContent = editingLayout ? `✥ ${i+1}` : order.status === 'waiting' ? `💬 ${i + 1}` : order.status === 'served' ? '♡ Afiyet olsun' : `${icons[order.item]} ${i + 1}`;
    el.setAttribute('aria-label',`Masa ${i+1}: ${order.status === 'waiting' ? 'sipariş al' : order.status === 'served' ? 'servis edildi' : menu[order.item]}`);
    el.classList.toggle('selected',i === selected); el.classList.toggle('drop-target',i === ready);
  });
  $('orders').replaceChildren();
  orders.forEach((order,i) => {
    if (order.status !== 'ordered') return;
    const ticket = document.createElement('button'); ticket.className = `ticket ${selected === i ? 'selected' : ''}`;
    ticket.textContent = `${icons[order.item]} Masa ${i+1} · ${menu[order.item]}`;
    ticket.onclick = () => chooseTable(i); $('orders').append(ticket);
  });
  $('special-evening').hidden = editingLayout || !(proposalReady(save) || save.answer);
  $('special-evening').textContent = save.answer ? '♡ O akşamı hatırla' : '♡ Koca Ayının özel masası';
  updateKissUI();
  $('actions').replaceChildren();
  const add = (label: string, action: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = action; $('actions').append(b); };
  for (const [id, name] of [['flowers', 'Çiçekler'], ['lights', 'Işıklar'], ['table', 'Masa örtüsü']]) {
    if (!save.decorations.includes(id)) add(`${name} · 20 yaprak`, () => {
      if (save.coins < 20) return message('Bunun için biraz daha sipariş hazırlayalım.');
      save.coins -= 20; save.decorations.push(id); persist(); updateDecor(); renderUI();
    });
  }
  if (save.decorations.length === 3) $('actions').textContent = 'Kafenin her köşesi senin dokunuşunla güzelleşti ♡';
}
const dialog = $('proposal') as HTMLDialogElement;
const eveningTable = new THREE.Group(); scene.add(eveningTable); eveningTable.visible = false;
function eveningBox(w:number,h:number,d:number,color:string,x:number,y:number,z:number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color})); mesh.position.set(x,y,z); eveningTable.add(mesh); return mesh;
}
eveningBox(2.6,.14,1.5,'#e4b8bc',0,1,-1.5); eveningBox(.2,1,.2,'#796047',0,.5,-1.5);
for (const x of [-.75,.75]) { eveningBox(.5,.04,.5,'#fff1db',x,1.1,-1.5); eveningBox(.13,.22,.13,'#d7d5b4',x,1.23,-1.8); }
for (const x of [-.3,.3]) {
  eveningBox(.08,.35,.08,'#f4dfb1',x,1.25,-1.5);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshBasicMaterial({color:'#ffcf6b'})); flame.scale.y=1.8; flame.position.set(x,1.5,-1.5); eveningTable.add(flame);
}
const candleLight = new THREE.PointLight('#ffbf79',0,12); candleLight.position.set(0,2,-1.5); scene.add(candleLight);
const rainPositions = new Float32Array(240*6);
for (let i=0;i<240;i++) { const x=(Math.random()-.5)*23,z=(Math.random()-.5)*28,y=Math.random()*12; rainPositions.set([x,y,z,x-.08,y-.4,z],i*6); }
const rainGeometry = new THREE.BufferGeometry(); rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain = new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:'#b6cbdc',transparent:true,opacity:.28})); rain.visible=false; scene.add(rain);
let eveningTime: number | null = null;
let eveningAnswered = false;
function openProposal() {
  eveningTime=0; eveningAnswered=false; eveningTable.visible=true; rain.visible=true;
  scene.background = new THREE.Color('#253247'); scene.fog!.color.set('#253247'); sun.intensity=1.2; candleLight.intensity=5;
  customers.forEach(g => g.visible=false); $('markers').inert=true; app.classList.add('is-evening');
  $('reply').textContent=''; $('yes').hidden=false; $('thinking').hidden=false;
  message('Işıklar yavaşça kısılıyor… Şimdi yalnızca ikinize ait küçük bir an.');
}
function finishEvening() {
  dialog.close(); eveningTime=null; eveningTable.visible=false; rain.visible=false; candleLight.intensity=0; sun.intensity=3;
  cinematicHearts.visible=false; scene.background=new THREE.Color('#293e35'); scene.fog!.color.set('#293e35');
  customers.forEach(g => g.visible=true); masha.position.set(0,0,-.8); masha.rotation.set(0,0,0); bear.position.set(4.2,0,-3.4); bear.rotation.set(0,0,0);
  camera.position.set(3,20,23); camera.lookAt(0,0,1); camera.fov=gameFov(); camera.updateProjectionMatrix();
  $('markers').inert=false; app.classList.remove('is-evening'); renderUI(); message('Kafemiz seni bekliyor Maşa ♡');
}
for (const [id, answer] of [['yes', 'yes'], ['thinking', 'thinking']] as const) $(id).onclick = () => {
  save.answer = answer; persist();
  eveningAnswered=true; $('yes').hidden=true; $('thinking').hidden=true;
  if (answer === 'yes') { cinematicHearts.visible=true; cinematicHearts.position.set(0,2.3,-.4); }
  $('reply').textContent = answer === 'yes' ? 'İyi ki geldin Maşa. Birlikte daha nice güzel günlere ♡' : 'Acele etmene gerek yok Maşa. İstediğin zaman konuşabiliriz.';
};
$('close').onclick = finishEvening;
dialog.addEventListener('cancel',e => { e.preventDefault(); finishEvening(); });
$('export').onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(save)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'masanin-kafesi-kayit.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
$('import').onchange = async e => {
  const input = e.target as HTMLInputElement;
  if (editingLayout || moving || waypoints.length || prepFor !== null || ready !== null || kissAnimation > 0) { input.value = ''; return message('Kayıt yüklemeden önce elindeki işi bitir ve düzenleme modundan çık.'); }
  try { if (input.files?.[0]) { save = parseSave(await input.files[0].text()); applyLayout(save.tablePositions); orders = tablePositions.map((_,i) => ({item:(save.served+i)%menu.length,status:'waiting',rest:0})); selected = null; masha.position.set(0,0,-.8); persist(); renderUI(); message('Kaydın yüklendi Maşa.'); } } catch { message('Bu kayıt dosyası okunamadı. Mevcut ilerlemen korunuyor.'); }
  input.value = '';
};
let last = performance.now(), elapsed = 0;
function tick(now: number) {
  const delta = Math.min((now - last) / 1000, .1); last = now;
  if (!document.hidden && opening.active) {
    const done = opening.update(delta);
    $('film-title').textContent = introChapter(opening.time);
    $('film-caption').textContent = opening.time < 8 ? 'El ele, küçük bir hayalin kapısına…' : opening.time < 13 ? 'Koca Ayı: Hazır mısın Maşa? Bugün bizim günümüz.' : opening.time < 17 ? 'Koca Ayı: Günün ilk öpücüğü benden ♡' : opening.time < 24 ? 'Kapımız açık, kahvelerimiz sıcak.' : 'Hoş geldin Maşa. Kafemiz artık sana emanet.';
    $('film-progress').style.width=`${opening.time/INTRO_DURATION*100}%`;
    bearFeet.forEach((f,i) => f.position.z = opening.time < 8 || (opening.time > 17 && opening.time < 22) ? Math.sin(now/100+i*Math.PI)*.18 : .12);
    if (done) finishOpening();
  }
  if (!document.hidden && eveningTime !== null) {
    eveningTime += delta;
    const progress = THREE.MathUtils.smoothstep(eveningTime,0,4);
    camera.position.lerpVectors(new THREE.Vector3(3,20,23),new THREE.Vector3(4,4.5,5.5),progress);
    camera.lookAt(0,1,-1); camera.fov=gameFov()*.85; camera.updateProjectionMatrix();
    masha.position.lerpVectors(new THREE.Vector3(0,0,-.8),new THREE.Vector3(-.8,0,-.1),progress);
    bear.position.lerpVectors(new THREE.Vector3(4.2,0,-3.4),new THREE.Vector3(.8,0,-.1),progress);
    masha.rotation.y=Math.PI/2; bear.rotation.y=-Math.PI/2;
    if (eveningTime >= 4 && !dialog.open) dialog.showModal();
    for (let i=0;i<240;i++) {
      const offset=i*6; rainPositions[offset+1]-=delta*7; rainPositions[offset+4]-=delta*7;
      if (rainPositions[offset+1]<0) {rainPositions[offset+1]=12;rainPositions[offset+4]=11.6;}
    }
    rainGeometry.attributes.position.needsUpdate=true;
    candleLight.intensity=5+Math.sin(now/160)*.3;
    if (eveningAnswered && save.answer==='yes') {
      cinematicHearts.rotation.y=now/1000;
      cinematicHearts.children.forEach((h,i) => h.position.y=Math.sin(now/600+i)*.3+i*.2);
    }
  }
  if (!document.hidden && !opening.active && eveningTime === null && !dialog.open && !editingLayout) {
    if (kissAnimation > 0) {
      kissAnimation = Math.max(0, kissAnimation - delta);
      masha.position.y = Math.sin((2-kissAnimation)*Math.PI*2)*.06;
      cinematicHearts.visible=true; cinematicHearts.position.set(3.8,2.3,-3.4); cinematicHearts.rotation.y=now/700;
      if (kissAnimation === 0) { $('kiss-hearts').hidden = true; masha.position.y = 0; cinematicHearts.visible=false; }
    } else {
      const needsKiss = drainKissNeed(save,delta);
      if (needsKiss) message('Maşa, öpücük barın azaldı. Koca Ayı seni bekliyor ♡');
    }
    updateKissUI();
    const wasReady = proposalReady(save); save.activeSeconds += delta; elapsed += delta;
    if (!wasReady && proposalReady(save)) { message('Maşa, Koca Ayı seni özel bir masaya bekliyor.'); renderUI(); }
    if (elapsed >= 5) { persist(); elapsed = 0; }
    if (holding && prepFor !== null) {
      fill = Math.min(1, fill + delta * .28);
      $('liquid').style.height = `${fill*100}%`;
      if (fill >= 1) releasePour();
    }
    $('worktop').classList.toggle('pouring',holding);
    if (!moving && waypoints.length) { goal.copy(waypoints.shift()!); moving = true; }
    if (moving) {
      const direction = goal.clone().sub(masha.position); direction.y = 0;
      if (direction.length() < delta*3.5) {
        masha.position.copy(goal); moving = false;
        if (!waypoints.length) { const done = moveDone; moveDone = null; done?.(); }
      } else {
        masha.position.addScaledVector(direction.normalize(),delta*3.5);
        masha.rotation.y = Math.atan2(direction.x,direction.z);
      }
      feet[0].position.z = Math.sin(now/90)*.15; feet[1].position.z = -Math.sin(now/90)*.15;
    } else { feet.forEach(foot => foot.position.z = .1); }
    orders.forEach((order,i) => {
      if (order.status !== 'served') return;
      order.rest -= delta;
      if (order.rest <= 0) { order.status = 'waiting'; order.item = (order.item + 1) % menu.length; renderUI(); }
      customers[i].rotation.y = Math.sin(now/800)*.06;
    });
  }
  if (kissAnimation <= 0 && !opening.active && eveningTime === null) bear.rotation.y = Math.sin(now / 1500) * .08;
  renderer?.render(scene, camera);
  const w = $('world').clientWidth, h = $('world').clientHeight;
  markers.forEach(({element,point}) => {
    const p = point.clone().project(camera);
    element.style.left = `${(p.x*.5+.5)*w}px`; element.style.top = `${(-p.y*.5+.5)*h}px`;
  });
  const kissPoint = new THREE.Vector3(3.8,2.5,-3.4).project(camera);
  $('kiss-hearts').style.left = `${(kissPoint.x*.5+.5)*w}px`;
  $('kiss-hearts').style.top = `${(-kissPoint.y*.5+.5)*h}px`;
  requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { holding = false; lastIcing = null; finishLayoutDrag(true); persist(); } });
window.addEventListener('pagehide', persist);
updateDecor(); renderUI(); if (storageError) $('saved').textContent = 'Kayıt okunamadı; kaydı indirerek yedekleyebilirsin.';
if (!save.introSeen || new URLSearchParams(location.search).has('intro')) startOpening();
else opening.finish();
requestAnimationFrame(tick);
