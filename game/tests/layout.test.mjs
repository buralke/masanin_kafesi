import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';

const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const url = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const layoutUrl = url(compile('../src/layout.ts'));
const {defaultLayout,layoutError,snapPosition} = await import(layoutUrl);
const {fresh,parseSave,drainKissNeed,receiveKiss} = await import(url(compile('../src/state.ts').replace("'./layout'", JSON.stringify(layoutUrl))));
const threeUrl = new URL('../node_modules/three/build/three.module.js',import.meta.url).href;
const {Opening,introChapter,INTRO_DURATION} = await import(url(compile('../src/cinematic.ts').replace("'three'",JSON.stringify(threeUrl))));

test('initial layout is valid and returns independent copies', () => {
  assert.equal(layoutError(defaultLayout()),null);
  const a = defaultLayout(); a[0][0] = 0;
  assert.equal(defaultLayout()[0][0],-3);
});
test('table may move within its side while retaining service space', () => {
  const layout = defaultLayout(); layout[0] = [-4,-.5];
  assert.equal(layoutError(layout),null);
  assert.deepEqual(snapPosition(-3.2,2.4),[-3,2.5]);
});
test('reject overlaps, blocked aisle, counter area and outside floor', () => {
  for (const position of [[-3,2.5],[0,-1],[-3,-4],[-5.5,-1],[3,8],[NaN,0]]) {
    const layout = defaultLayout(); layout[0] = position;
    assert.ok(layoutError(layout));
  }
  assert.ok(layoutError([]));
});
test('legacy save migrates without losing money or affection', () => {
  const old = fresh(); old.coins = 60; old.kissNeed = 25; delete old.tablePositions;
  const migrated = parseSave(JSON.stringify(old));
  assert.equal(migrated.coins,60); assert.equal(migrated.kissNeed,25);
  assert.deepEqual(migrated.tablePositions,defaultLayout());
});
test('custom layout survives reload and exported save round trip', () => {
  const s = fresh(); s.tablePositions[0] = [-4,-.5];
  assert.deepEqual(parseSave(JSON.stringify(s)),s);
  s.tablePositions[0] = [0,0];
  assert.throws(() => parseSave(JSON.stringify(s)));
});
test('affection still drains, warns and refills after layout save changes', () => {
  const s = fresh(); assert.equal(drainKissNeed(s,127),true);
  drainKissNeed(s,1000); assert.equal(s.kissNeed,0);
  receiveKiss(s); assert.equal(s.kissNeed,100); assert.equal(s.kisses,1);
  assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
function openingFixture() {
  const tables = defaultLayout(); tables[0] = [-4,-.5];
  const props = {camera:new THREE.PerspectiveCamera(43,.8,.1,90),masha:new THREE.Group(),bear:new THREE.Group(),guests:tables.map(() => new THREE.Group()),tables:() => tables,door:new THREE.Group(),sign:new THREE.Group(),hands:new THREE.Group(),hearts:new THREE.Group(),feet:[],gameCamera:new THREE.Vector3(3,20,23),gameFov:() => 43};
  return {props,opening:new Opening(props)};
}
test('opening follows handholding, door, kiss and guest arrivals in order', () => {
  const {props:p,opening:o} = openingFixture(); o.start();
  o.update(4); assert.equal(p.hands.visible,true); assert.ok(p.guests.every(g => !g.visible));
  o.update(6); assert.ok(p.door.rotation.y<0);
  o.update(4); assert.equal(p.hearts.visible,true); assert.equal(introChapter(o.time),'Önce küçük bir öpücük');
  o.update(5); assert.ok(p.guests.some(g => g.visible));
  assert.equal(o.update(8),true); assert.equal(o.time,INTRO_DURATION);
});
test('skipping and replaying restore game pose and custom table seating', () => {
  const {props:p,opening:o} = openingFixture(); o.start(); o.update(14); o.finish();
  assert.equal(o.active,false); assert.equal(p.hearts.visible,false); assert.equal(p.hands.visible,false);
  assert.deepEqual(p.masha.position.toArray(),[0,0,-.8]); assert.equal(p.masha.rotation.z,0);
  assert.deepEqual(p.guests[0].position.toArray(),[-4,.2,.5]);
  assert.deepEqual(p.camera.position.toArray(),[3,20,23]);
  o.start(); assert.equal(o.time,0); assert.ok(p.guests.every(g => !g.visible));
});
test('older saves gain unseen intro flag; seen flag survives reload', () => {
  const s=fresh(); delete s.introSeen; assert.equal(parseSave(JSON.stringify(s)).introSeen,false);
  s.introSeen=true; assert.equal(parseSave(JSON.stringify(s)).introSeen,true);
});
