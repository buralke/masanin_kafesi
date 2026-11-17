export const menu = ['Kahve', 'Çay', 'Sıcak çikolata', 'Pasta'] as const;
import { defaultLayout, layoutError, type TablePosition } from './layout';
export type Answer = 'yes' | 'thinking' | null;
export interface Save {
  version: 1;
  coins: number;
  served: number;
  activeSeconds: number;
  answer: Answer;
  decorations: string[];
  kissNeed: number;
  kisses: number;
  tablePositions: TablePosition[];
  introSeen: boolean;
}
export const SAVE_KEY = 'suseme_hediye:masanin_kafesi:v1';
export function fresh(): Save {
  return { version: 1, coins: 0, served: 0, activeSeconds: 0, answer: null, decorations: [], kissNeed: 100, kisses: 0, tablePositions: defaultLayout(), introSeen: false };
}
export function parseSave(raw: string): Save {
  const s = JSON.parse(raw) as Save;
  // Keep existing version-1 saves compatible with the new affection mechanic.
  if (s && s.kissNeed === undefined) s.kissNeed = 100;
  if (s && s.kisses === undefined) s.kisses = 0;
  if (s && s.tablePositions === undefined) s.tablePositions = defaultLayout();
  if (s && s.introSeen === undefined) s.introSeen = false;
  if (!s || s.version !== 1 || !Number.isSafeInteger(s.coins) || s.coins < 0 ||
      !Number.isSafeInteger(s.served) || s.served < 0 || !Number.isFinite(s.activeSeconds) ||
      s.activeSeconds < 0 || ![null, 'yes', 'thinking'].includes(s.answer) ||
      !Array.isArray(s.decorations) || s.decorations.some(x => !['flowers', 'lights', 'table'].includes(x)) ||
      !Number.isFinite(s.kissNeed) || s.kissNeed < 0 || s.kissNeed > 100 ||
      !Number.isSafeInteger(s.kisses) || s.kisses < 0 || layoutError(s.tablePositions) || typeof s.introSeen !== 'boolean') {
    throw new Error('Geçersiz kayıt dosyası');
  }
  return s;
}
export function proposalReady(s: Save): boolean {
  return s.activeSeconds >= 300 && s.served >= 5;
}
export function drainKissNeed(s: Save, seconds: number): boolean {
  const before = s.kissNeed;
  s.kissNeed = Math.max(0, before - Math.max(0, seconds) * (100 / 180));
  return before > 30 && s.kissNeed <= 30;
}
export function receiveKiss(s: Save) {
  s.kissNeed = 100;
  s.kisses++;
}
