export type TablePosition = [number, number];
export const defaultLayout = (): TablePosition[] => [[-3,-1],[3,-1],[-3,2.5],[3,2.5],[-3,6],[3,6]];

export function layoutError(layout: unknown): string | null {
  if (!Array.isArray(layout) || layout.length !== 6) return 'Yerleşimde altı masa bulunmalı.';
  for (let i = 0; i < layout.length; i++) {
    const p = layout[i];
    if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)) return 'Masa konumu geçersiz.';
    const [x,z] = p;
    if (Math.abs(x) < 2 || Math.abs(x) > 4.5 || z < -1 || z > 6.5) return 'Masayı işaretli alanlara bırak; orta koridor ve tezgâh önü açık kalmalı.';
    for (let j = 0; j < i; j++) {
      const [ox,oz] = layout[j];
      // Reserve chair and service space for each row on the same side.
      if (Math.sign(x) === Math.sign(ox) && Math.abs(z-oz) < 2.8) return 'Bu masaya fazla yakın. Sandalye ve servis için biraz boşluk bırak.';
    }
  }
  return null;
}
export function snapPosition(x: number, z: number): TablePosition {
  return [Math.round(x*2)/2, Math.round(z*2)/2];
}
