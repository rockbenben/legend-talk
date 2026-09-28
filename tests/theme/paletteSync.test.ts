import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The design contract says: --lt-* in index.css is the source of truth and the
 * antd seeds in ThemeProvider mirror it. That rule was unverifiable while a
 * palette key (`elevated`) existed only in TypeScript. This test walks the
 * PROCEEDINGS object and requires every hex to appear as a CSS variable value.
 */

// `?raw` returns an empty string for .css under Vite (the CSS plugin claims the
// id first), so the contract files are read from disk.
const css = readFileSync('src/index.css', 'utf8');
const themeSrc = readFileSync('src/components/ThemeProvider.tsx', 'utf8');

function cssVars(block: 'root' | 'dark'): Record<string, string> {
  const re = block === 'root' ? /:root\s*\{([^}]+)\}/ : /^\.dark\s*\{([^}]+)\}/m;
  const body = css.match(re)?.[1];
  if (!body) throw new Error(`.${block} block not found in index.css`);
  const out: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--lt-[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim().toUpperCase();
  }
  return out;
}

function palette(mode: 'light' | 'dark'): Record<string, string> {
  const block = themeSrc.match(new RegExp(`${mode}:\\s*\\{([^}]+)\\}`))?.[1];
  if (!block) throw new Error(`${mode} palette not found in ThemeProvider.tsx`);
  const out: Record<string, string> = {};
  for (const [, key, value] of block.matchAll(/(\w+)\s*:\s*'(#[0-9A-Fa-f]{6})'/g)) {
    out[key] = value.toUpperCase();
  }
  return out;
}

// Palette key → CSS variable. The names diverge (inkSoft vs --lt-ink-soft,
// elevated vs --lt-paper-elevated), so the mapping is spelled out rather than
// derived — a renamed variable then fails the test instead of silently
// checking nothing.
const VAR_BY_KEY: Record<string, string> = {
  paper: '--lt-paper',
  paperDeep: '--lt-paper-deep',
  elevated: '--lt-paper-elevated',
  ink: '--lt-ink',
  inkSoft: '--lt-ink-soft',
  inkFaint: '--lt-ink-faint',
  madder: '--lt-madder',
  rule: '--lt-rule',
  ruleFaint: '--lt-rule-faint',
};

describe('palette sync invariant', () => {
  it('every PROCEEDINGS color has a --lt-* twin with the same value', () => {
    for (const mode of ['light', 'dark'] as const) {
      const vars = cssVars(mode === 'light' ? 'root' : 'dark');
      const colors = palette(mode);
      expect(Object.keys(colors).length).toBe(Object.keys(VAR_BY_KEY).length);
      for (const [key, hex] of Object.entries(colors)) {
        const name = VAR_BY_KEY[key];
        expect(name, `${mode}: unknown palette key ${key}`).toBeTruthy();
        expect(vars[name], `${mode}: ${key} → ${name}`).toBe(hex);
      }
    }
  });

  it('semantic seeds outside the paper/ink palette stay declared in the theme file', () => {
    // success/warning/error are deliberately NOT --lt-* vars (they are print-ink
    // semantics, not surfaces); pin them here so a silent drift is still caught.
    const seeds = [...themeSrc.matchAll(/color(Success|Warning|Error):\s*'(#[0-9A-Fa-f]{6})'/g)]
      .map(([, k, v]) => `${k}=${v.toUpperCase()}`);
    expect(seeds).toEqual([
      'Success=#5F7355',
      'Warning=#9A6B2F',
      'Error=#A1392F',
    ]);
  });
});
