/**
 * Small scatter-plot thumbnails for the dataset cards in the Data step.
 *
 * Points are generated from a fixed seed so a card always looks the same;
 * they illustrate the shape of each dataset, not the exact samples loaded.
 */
import { MULTI_CLASS_COLOURS } from '../core/domain';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 100;
const HEIGHT = 64;

type PreviewPoint = [x: number, y: number, label: number];

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function gauss(rand: () => number): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rand();
  return (sum - 3) / 3;
}

const GENERATORS: Record<string, (rand: () => number) => PreviewPoint[]> = {
  circle: (rand) =>
    Array.from({ length: 56 }, (_, i) => {
      const label = i % 2;
      const angle = rand() * 2 * Math.PI;
      const r = label ? 0.62 + rand() * 0.25 : rand() * 0.32;
      return [r * Math.cos(angle), r * Math.sin(angle), label];
    }),
  xor: (rand) =>
    Array.from({ length: 56 }, () => {
      const x = rand() * 1.8 - 0.9;
      const y = rand() * 1.8 - 0.9;
      return [x, y, (x > 0) === (y > 0) ? 0 : 1];
    }),
  spiral: () =>
    Array.from({ length: 56 }, (_, i) => {
      const label = i % 2;
      const r = 0.1 + (0.85 * Math.floor(i / 2)) / 28;
      const theta = 3.1 * Math.PI * r + (label ? Math.PI : 0);
      return [r * Math.cos(theta), r * Math.sin(theta), label];
    }),
  gaussian: (rand) =>
    Array.from({ length: 56 }, (_, i) => {
      const label = i % 2;
      return [(label ? 0.4 : -0.4) + gauss(rand) * 0.28, (label ? 0.3 : -0.3) + gauss(rand) * 0.28, label];
    }),
  clusters: (rand) =>
    Array.from({ length: 60 }, (_, i) => {
      const label = i % 4;
      const cx = [-0.5, 0.5, -0.45, 0.5][label] ?? 0;
      const cy = [0.45, 0.5, -0.5, -0.45][label] ?? 0;
      return [cx + gauss(rand) * 0.17, cy + gauss(rand) * 0.17, label];
    }),
  iris: (rand) =>
    Array.from({ length: 57 }, (_, i) => {
      const label = i % 3;
      const cx = [-0.6, 0.1, 0.45][label] ?? 0;
      const cy = [0.5, -0.15, 0.05][label] ?? 0;
      return [cx + gauss(rand) * 0.13, cy + gauss(rand) * (label ? 0.2 : 0.11), label];
    }),
  wine: (rand) =>
    Array.from({ length: 57 }, (_, i) => {
      const label = i % 3;
      const cx = [-0.5, 0, 0.5][label] ?? 0;
      const cy = [-0.2, 0.45, -0.25][label] ?? 0;
      return [cx + gauss(rand) * 0.19, cy + gauss(rand) * 0.19, label];
    }),
  custom: () => [
    [-0.4, 0.3, 0],
    [-0.25, 0.45, 0],
    [0.35, -0.3, 1],
  ],
};

/** Points used to draw the preview for `type` (deterministic). */
export function previewPoints(type: string): PreviewPoint[] {
  const generate = GENERATORS[type];
  if (!generate) return [];
  const clamp = (v: number): number => Math.max(-0.95, Math.min(0.95, v));
  return generate(seeded(7)).map(([x, y, label]) => [clamp(x), clamp(y), label]);
}

/** Draws the preview scatter into an <svg> (replacing its contents). */
export function renderDatasetPreview(svg: SVGSVGElement, type: string): void {
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.replaceChildren();
  for (const [x, y, label] of previewPoints(type)) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', (((x + 1) / 2) * WIDTH).toFixed(1));
    dot.setAttribute('cy', (((1 - y) / 2) * HEIGHT).toFixed(1));
    dot.setAttribute('r', '1.9');
    dot.setAttribute('fill', MULTI_CLASS_COLOURS[label % MULTI_CLASS_COLOURS.length] ?? '#888888');
    svg.appendChild(dot);
  }
}

/** Fills every `<svg data-preview="…">` under root. */
export function renderAllDatasetPreviews(root: ParentNode = document): void {
  root.querySelectorAll<SVGSVGElement>('svg[data-preview]').forEach((svg) => {
    renderDatasetPreview(svg, svg.dataset.preview ?? '');
  });
}
