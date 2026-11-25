/**
 * Zero-dependency HTML DOM Tree, CSS Stylesheet, CSS Variable & Tailwind v3/v4 -> GPB Parser.
 * Used by extract-template-spec.js, convert-html-to-gpb.js, and audit-pixel-fidelity.js.
 */

'use strict';

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const TW_COLORS = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
  'slate-800': '#1e293b', 'slate-900': '#0f172a', 'slate-950': '#020617',
  'zinc-50': '#fafafa', 'zinc-100': '#f4f4f5', 'zinc-200': '#e4e4e7', 'zinc-400': '#a1a1aa',
  'zinc-700': '#3f3f46', 'zinc-800': '#27272a', 'zinc-900': '#18181b', 'zinc-950': '#09090b',
  'gray-50': '#f9fafb', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-400': '#9ca3af',
  'gray-600': '#4b5563', 'gray-800': '#1f2937', 'gray-900': '#111827', 'gray-950': '#030712',
  'neutral-900': '#171717', 'neutral-950': '#0a0a0a',
  'sky-400': '#38bdf8', 'sky-500': '#0ea5e9', 'sky-600': '#0284c7',
  'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb',
  'indigo-400': '#818cf8', 'indigo-500': '#6366f1', 'indigo-600': '#4f46e5',
  'violet-400': '#a78bfa', 'violet-500': '#8b5cf6', 'violet-600': '#7c3aed',
  'purple-400': '#c084fc', 'purple-500': '#a855f7', 'purple-600': '#9333ea',
  'emerald-400': '#34d399', 'emerald-500': '#10b981', 'emerald-600': '#059669',
  'teal-400': '#2dd4bf', 'teal-500': '#14b8a6',
  'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
  'rose-400': '#fb7185', 'rose-500': '#f43f5e',
};

const TW_TEXT_SIZES = {
  xs: ['0.75rem', '1rem'],
  sm: ['0.875rem', '1.25rem'],
  base: ['1rem', '1.5rem'],
  lg: ['1.125rem', '1.75rem'],
  xl: ['1.25rem', '1.75rem'],
  '2xl': ['1.5rem', '2rem'],
  '3xl': ['1.875rem', '2.25rem'],
  '4xl': ['2.25rem', '2.5rem'],
  '5xl': ['3rem', '1.1'],
  '6xl': ['3.75rem', '1.05'],
  '7xl': ['4.5rem', '1.02'],
  '8xl': ['6rem', '1'],
};

const TW_MAX_WIDTHS = {
  sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem', '2xl': '42rem',
  '3xl': '48rem', '4xl': '56rem', '5xl': '64rem', '6xl': '72rem', '7xl': '80rem',
  full: '100%',
};

const TW_SHADOWS = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.12), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.16), 0 8px 10px -6px rgba(0,0,0,0.1)',
  '2xl': '0 25px 50px -12px rgba(0,0,0,0.35)',
};

const CSS_TO_GPB = {
  display: 'display',
  'flex-direction': 'flexDirection',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'flex-wrap': 'flexWrap',
  gap: 'gap',
  'row-gap': 'rowGap',
  'column-gap': 'columnGap',
  'grid-template-columns': 'gridTemplateColumns',
  'grid-template-rows': 'gridTemplateRows',
  'grid-column': 'gridColumn',
  'grid-row': 'gridRow',
  padding: 'padding',
  margin: 'margin',
  width: 'width',
  'min-width': 'minWidth',
  'max-width': 'maxWidth',
  height: 'height',
  'min-height': 'minHeight',
  'max-height': 'maxHeight',
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  'z-index': 'zIndex',
  overflow: 'overflow',
  'aspect-ratio': 'aspectRatio',
  'font-size': 'fontSize',
  'line-height': 'lineHeight',
  'letter-spacing': 'letterSpacing',
  'text-align': 'textAlign',
  'border-radius': 'borderRadius',
  border: 'border',
  'border-color': 'borderColor',
  'box-shadow': 'boxShadow',
  background: 'background',
  'background-color': 'background',
  color: 'color',
  opacity: 'opacity',
  transform: 'transform',
  perspective: 'perspective',
  'transform-style': 'transformStyle',
  'backface-visibility': 'backfaceVisibility',
  'transform-origin': 'transformOrigin',
  filter: 'filter',
  'backdrop-filter': 'backdropFilter',
  '-webkit-backdrop-filter': 'backdropFilter',
  'mix-blend-mode': 'mixBlendMode',
  'clip-path': 'clipPath',
  transition: 'transition',
  cursor: 'cursor',
  'pointer-events': 'pointerEvents',
  'object-fit': 'objectFit',
};

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveTwColor(token) {
  if (!token) return null;
  if (token.startsWith('[') && token.endsWith(']')) {
    return token.slice(1, -1).replace(/_/g, ' ');
  }
  const [name, opStr] = token.split('/');
  const base = TW_COLORS[name];
  if (!base) return null;
  if (!opStr || !base.startsWith('#')) return base;
  const alpha = parseInt(opStr, 10) / 100;
  return Number.isNaN(alpha) ? base : hexToRgba(base, alpha);
}

function resolveTwSpace(val) {
  if (!val) return null;
  if (val === 'px') return '1px';
  if (val === 'auto') return 'auto';
  if (val === 'full') return '100%';
  if (val.startsWith('[') && val.endsWith(']')) return val.slice(1, -1).replace(/_/g, ' ');
  const n = parseFloat(val);
  return Number.isNaN(n) ? null : `${n * 4}px`;
}

function parseAttributes(attrStr) {
  const attrs = {};
  const re = /([a-zA-Z0-9_:@.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const key = m[1];
    const val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
    attrs[key] = val;
  }
  return attrs;
}

function parseHtmlTree(html) {
  const root = { type: 'root', tag: 'root', attrs: {}, classes: [], children: [] };
  const stack = [root];
  const styleBlocks = [];
  const googleFonts = [];

  const tokenRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tokenRe.exec(html)) !== null) {
    const full = match[0];
    if (full.startsWith('<!--')) continue;

    if (match[3] !== undefined) {
      const txt = match[3].replace(/\s+/g, ' ');
      if (txt.trim()) {
        stack[stack.length - 1].children.push({ type: 'text', text: txt });
      }
      continue;
    }

    const tag = match[1].toLowerCase();
    const attrStr = match[2] || '';
    const isClose = full.startsWith('</');
    const isSelfClose = full.endsWith('/>') || VOID_TAGS.has(tag);

    if (isClose) {
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    // Capture raw <style>, <script>, or <svg> body cleanly
    if ((tag === 'style' || tag === 'script' || tag === 'svg') && !full.endsWith('/>')) {
      const closeIdx = html.indexOf(`</${tag}`, tokenRe.lastIndex);
      if (closeIdx !== -1) {
        const endClose = html.indexOf('>', closeIdx);
        const innerRaw = html.slice(tokenRe.lastIndex, closeIdx);
        if (tag === 'style') {
          styleBlocks.push(innerRaw);
        } else if (tag === 'svg') {
          const attrs = parseAttributes(attrStr);
          stack[stack.length - 1].children.push({
            type: 'svg',
            tag: 'svg',
            attrs,
            classes: (attrs.class || '').split(/\s+/).filter(Boolean),
            rawHtml: `<svg${attrStr}>${innerRaw}</svg>`,
            children: [],
          });
        }
        tokenRe.lastIndex = endClose !== -1 ? endClose + 1 : closeIdx + tag.length + 3;
        continue;
      }
    }

    const attrs = parseAttributes(attrStr);
    if (tag === 'link' && attrs.href && attrs.href.includes('fonts.googleapis.com')) {
      googleFonts.push(attrs.href);
    }

    const node = {
      type: 'element',
      tag,
      attrs,
      classes: (attrs.class || '').split(/\s+/).filter(Boolean),
      inlineStyle: attrs.style || '',
      children: [],
    };
    stack[stack.length - 1].children.push(node);
    if (!isSelfClose) {
      stack.push(node);
    }
  }

  return { root, styleBlocks, googleFonts };
}

function resolveCssVars(value, vars) {
  if (!value || typeof value !== 'string' || !value.includes('var(')) return value;
  return value.replace(/var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]+))?\)/g, (_m, name, fb) => {
    return vars[name] !== undefined ? vars[name] : (fb ? fb.trim() : _m);
  });
}

function parseCssDeclarations(declText, vars = {}) {
  const out = {};
  const parts = declText.split(';');
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = part.slice(0, colonIdx).trim().toLowerCase();
    let val = part.slice(colonIdx + 1).trim();
    if (!val) continue;
    val = resolveCssVars(val, vars);

    if (prop === '-webkit-background-clip' || prop === 'background-clip') {
      if (val === 'text') out._bgClipText = true;
      continue;
    }
    const gpbKey = CSS_TO_GPB[prop];
    if (gpbKey) {
      out[gpbKey] = prop === 'z-index' && /^-?\d+$/.test(val) ? parseInt(val, 10) : val;
    }
  }
  if (out._bgClipText && out.background) {
    out.textGradient = out.background;
    delete out.background;
  }
  delete out._bgClipText;
  return out;
}

function parseStylesheet(cssText) {
  const vars = {};
  const rules = {};       // selector -> declarations
  const hoverRules = {};  // base selector -> declarations
  const mediaRules = { tablet: {}, mobile: {} };
  const keyframes = [];

  const clean = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract :root variables
  const rootMatch = clean.match(/:root\s*\{([^}]*)\}/);
  if (rootMatch) {
    for (const line of rootMatch[1].split(';')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k.startsWith('--') && v) vars[k] = v;
    }
  }

  // Extract @keyframes names
  const kfRe = /@keyframes\s+([a-zA-Z0-9_-]+)/g;
  let kfm;
  while ((kfm = kfRe.exec(clean)) !== null) {
    keyframes.push(kfm[1]);
  }

  // Extract @media (max-width: ...) blocks
  let restCss = clean.replace(/@media\s*\([^)]*max-width\s*:\s*(\d+)px[^)]*\)\s*\{([\s\S]*?\})\s*\}/gi, (_m, pxStr, body) => {
    const px = parseInt(pxStr, 10);
    const bp = px <= 767 ? 'mobile' : 'tablet';
    const innerRe = /([^{}]+)\{([^}]*)\}/g;
    let im;
    while ((im = innerRe.exec(body)) !== null) {
      const sels = im[1].split(',').map((s) => s.trim()).filter(Boolean);
      const decls = parseCssDeclarations(im[2], vars);
      for (const sel of sels) {
        mediaRules[bp][sel] = Object.assign(mediaRules[bp][sel] || {}, decls);
      }
    }
    return '';
  });

  // Extract top-level rules (skip @ blocks)
  restCss = restCss.replace(/@[a-zA-Z-]+[^{]*\{[\s\S]*?\}\s*\}/g, '');
  const ruleRe = /([^{}@]+)\{([^}]*)\}/g;
  let rm;
  while ((rm = ruleRe.exec(restCss)) !== null) {
    const sels = rm[1].split(',').map((s) => s.trim()).filter(Boolean);
    const decls = parseCssDeclarations(rm[2], vars);
    if (!Object.keys(decls).length) continue;

    for (const sel of sels) {
      if (sel.endsWith(':hover')) {
        const base = sel.slice(0, -6).trim();
        hoverRules[base] = Object.assign(hoverRules[base] || {}, decls);
      } else {
        rules[sel] = Object.assign(rules[sel] || {}, decls);
      }
    }
  }

  return { vars, rules, hoverRules, mediaRules, keyframes };
}

function applyTailwindToken(target, rawCls, glassOut) {
  let cls = rawCls;
  let neg = false;
  if (cls.startsWith('-')) {
    neg = true;
    cls = cls.slice(1);
  }
  const sign = neg ? '-' : '';

  if (cls === 'hidden') { target.hide = true; return; }
  if (cls === 'flex') { target.display = 'flex'; return; }
  if (cls === 'inline-flex') { target.display = 'inline-flex'; return; }
  if (cls === 'grid') { target.display = 'grid'; return; }
  if (cls === 'block') { target.display = 'block'; return; }
  if (cls === 'flex-col') { target.flexDirection = 'column'; return; }
  if (cls === 'flex-row') { target.flexDirection = 'row'; return; }
  if (cls === 'flex-wrap') { target.flexWrap = 'wrap'; return; }
  if (cls === 'items-center') { target.alignItems = 'center'; return; }
  if (cls === 'items-start') { target.alignItems = 'flex-start'; return; }
  if (cls === 'items-end') { target.alignItems = 'flex-end'; return; }
  if (cls === 'justify-between') { target.justifyContent = 'space-between'; return; }
  if (cls === 'justify-center') { target.justifyContent = 'center'; return; }
  if (cls === 'justify-end') { target.justifyContent = 'flex-end'; return; }
  if (cls === 'text-center') { target.textAlign = 'center'; return; }
  if (cls === 'text-left') { target.textAlign = 'left'; return; }
  if (cls === 'text-right') { target.textAlign = 'right'; return; }
  if (cls === 'sticky' || cls === 'relative' || cls === 'absolute' || cls === 'fixed') { target.position = cls; return; }
  if (cls === 'overflow-hidden') { target.overflow = 'hidden'; return; }
  if (cls === 'mx-auto') { target.margin = '0 auto'; return; }
  if (cls === 'w-full') { target.width = '100%'; return; }

  // Grid & Col span
  let m = cls.match(/^grid-cols-(\d+|\[[^\]]+\])$/);
  if (m) {
    target.display = 'grid';
    target.gridTemplateColumns = m[1].startsWith('[')
      ? m[1].slice(1, -1).replace(/_/g, ' ')
      : `repeat(${m[1]}, minmax(0, 1fr))`;
    return;
  }
  m = cls.match(/^col-span-(\d+|full)$/);
  if (m) {
    target.gridColumn = m[1] === 'full' ? '1 / -1' : `span ${m[1]}`;
    return;
  }

  // Gap & Padding
  m = cls.match(/^gap-(\d+(?:\.\d+)?|\[[^\]]+\])$/);
  if (m) { target.gap = resolveTwSpace(m[1]); return; }

  m = cls.match(/^p-(\d+(?:\.\d+)?|\[[^\]]+\])$/);
  if (m) { target.padding = resolveTwSpace(m[1]); return; }
  if (cls.startsWith('px-') || cls.startsWith('py-')) {
    const pxVal = resolveTwSpace(cls.slice(3));
    if (pxVal) {
      target._px = cls.startsWith('px-') ? pxVal : target._px;
      target._py = cls.startsWith('py-') ? pxVal : target._py;
      target.padding = `${target._py || '0px'} ${target._px || '0px'}`;
    }
    return;
  }

  // Position offsets & z-index
  m = cls.match(/^(top|right|bottom|left)-(\d+(?:\.\d+)?|px|\[[^\]]+\])$/);
  if (m) {
    const sp = resolveTwSpace(m[2]);
    if (sp) target[m[1]] = sign + sp;
    return;
  }
  m = cls.match(/^z-(\d+|\[[^\]]+\])$/);
  if (m) {
    target.zIndex = m[1].startsWith('[') ? parseInt(m[1].slice(1, -1), 10) : parseInt(m[1], 10);
    return;
  }

  // Max-width & min-height
  m = cls.match(/^max-w-(.+)$/);
  if (m) {
    target.maxWidth = TW_MAX_WIDTHS[m[1]] || (m[1].startsWith('[') ? m[1].slice(1, -1) : null);
    if (!target.maxWidth) delete target.maxWidth;
    return;
  }
  m = cls.match(/^min-h-\[([^\]]+)\]$/);
  if (m) { target.minHeight = m[1].replace(/_/g, ' '); return; }
  if (cls === 'min-h-screen') { target.minHeight = '100vh'; return; }

  // Radius & Shadows
  if (cls === 'rounded') { target.borderRadius = '4px'; return; }
  if (cls === 'rounded-lg') { target.borderRadius = '8px'; return; }
  if (cls === 'rounded-xl') { target.borderRadius = '12px'; return; }
  if (cls === 'rounded-2xl') { target.borderRadius = '16px'; return; }
  if (cls === 'rounded-3xl') { target.borderRadius = '24px'; return; }
  if (cls === 'rounded-full') { target.borderRadius = '9999px'; return; }
  m = cls.match(/^rounded-\[([^\]]+)\]$/);
  if (m) { target.borderRadius = m[1]; return; }

  if (cls === 'shadow' || cls.startsWith('shadow-')) {
    const key = cls === 'shadow' ? 'DEFAULT' : cls.slice(7);
    if (TW_SHADOWS[key]) { target.boxShadow = TW_SHADOWS[key]; return; }
  }

  // Backdrop blur (Glassmorphism)
  if (cls === 'backdrop-blur-sm') { glassOut.blur = '4px'; return; }
  if (cls === 'backdrop-blur' || cls === 'backdrop-blur-md') { glassOut.blur = '12px'; return; }
  if (cls === 'backdrop-blur-lg') { glassOut.blur = '16px'; return; }
  if (cls === 'backdrop-blur-xl') { glassOut.blur = '24px'; return; }
  if (cls === 'backdrop-blur-2xl') { glassOut.blur = '40px'; return; }

  // Transforms (commonly hover:-translate-y-*, hover:scale-*, rotate-*)
  m = cls.match(/^translate-y-(\d+(?:\.\d+)?|\[[^\]]+\])$/);
  if (m) { target.translateY = sign + resolveTwSpace(m[1]); return; }
  m = cls.match(/^translate-x-(\d+(?:\.\d+)?|\[[^\]]+\])$/);
  if (m) { target.translateX = sign + resolveTwSpace(m[1]); return; }
  m = cls.match(/^scale-(\d+)$/);
  if (m) { target.scale = parseInt(m[1], 10) / 100; return; }
  m = cls.match(/^rotate-(\d+)$/);
  if (m) { target.rotate = `${sign}${m[1]}deg`; return; }

  // Typography
  if (cls.startsWith('text-')) {
    const rest = cls.slice(5);
    if (TW_TEXT_SIZES[rest]) {
      target.fontSize = TW_TEXT_SIZES[rest][0];
      target.lineHeight = TW_TEXT_SIZES[rest][1];
      return;
    }
    if (rest.startsWith('[') && !rest.startsWith('[#') && !rest.startsWith('[rgb')) {
      target.fontSize = rest.slice(1, -1).replace(/_/g, ' ');
      return;
    }
    const c = resolveTwColor(rest);
    if (c) { target.color = c; return; }
  }

  // Backgrounds & Borders
  if (cls.startsWith('bg-')) {
    const c = resolveTwColor(cls.slice(3));
    if (c) { target.background = c; return; }
  }
  if (cls === 'border') { target.border = '1px solid rgba(148,163,184,0.25)'; return; }
  if (cls.startsWith('border-')) {
    const c = resolveTwColor(cls.slice(7));
    if (c) { target.borderColor = c; return; }
  }
}

function mapTailwindClassesToGpb(classes) {
  const gpb = { desktop: {}, tablet: {}, mobile: {}, hover: {} };
  const glass = {};

  for (const fullCls of classes) {
    if (fullCls.startsWith('hover:')) {
      applyTailwindToken(gpb.hover, fullCls.slice(6), glass);
    } else if (fullCls.startsWith('md:')) {
      applyTailwindToken(gpb.tablet, fullCls.slice(3), glass);
    } else if (fullCls.startsWith('sm:')) {
      applyTailwindToken(gpb.mobile, fullCls.slice(3), glass);
    } else if (fullCls.startsWith('lg:') || fullCls.startsWith('xl:')) {
      applyTailwindToken(gpb.desktop, fullCls.slice(3), glass);
    } else {
      applyTailwindToken(gpb.desktop, fullCls, glass);
    }
  }

  // Clean internal helper keys (_px/_py)
  for (const k of ['desktop', 'tablet', 'mobile', 'hover']) {
    delete gpb[k]._px;
    delete gpb[k]._py;
  }

  // Auto-collapse multi-column grids on mobile if mobile wasn't explicitly set
  if (gpb.desktop.gridTemplateColumns && !gpb.mobile.gridTemplateColumns) {
    gpb.mobile.gridTemplateColumns = '1fr';
  }
  if (gpb.desktop.gridColumn && !gpb.mobile.gridColumn) {
    gpb.mobile.gridColumn = 'span 1';
  }

  if (glass.blur) {
    if (gpb.desktop.background) {
      glass.bg = gpb.desktop.background;
      delete gpb.desktop.background;
    }
    if (gpb.desktop.border) {
      glass.border = gpb.desktop.border;
      delete gpb.desktop.border;
    }
    if (gpb.desktop.boxShadow) {
      glass.shadow = gpb.desktop.boxShadow;
      delete gpb.desktop.boxShadow;
    }
    gpb.glass = glass;
  }

  for (const k of ['desktop', 'tablet', 'mobile', 'hover']) {
    if (Object.keys(gpb[k]).length === 0) delete gpb[k];
  }
  return gpb;
}

function mergeStylesForNode(node, sheet) {
  const merged = { desktop: {}, tablet: {}, mobile: {}, hover: {} };

  // 1. Stylesheet rules by tag, id, and classes
  const selectors = [node.tag];
  if (node.attrs.id) selectors.push(`#${node.attrs.id}`);
  for (const c of node.classes) selectors.push(`.${c}`);

  for (const sel of selectors) {
    if (sheet.rules[sel]) Object.assign(merged.desktop, sheet.rules[sel]);
    if (sheet.hoverRules[sel]) Object.assign(merged.hover, sheet.hoverRules[sel]);
    if (sheet.mediaRules.tablet[sel]) Object.assign(merged.tablet, sheet.mediaRules.tablet[sel]);
    if (sheet.mediaRules.mobile[sel]) Object.assign(merged.mobile, sheet.mediaRules.mobile[sel]);
  }

  // 2. Tailwind utility classes
  const twGpb = mapTailwindClassesToGpb(node.classes);
  for (const k of ['desktop', 'tablet', 'mobile', 'hover']) {
    if (twGpb[k]) Object.assign(merged[k], twGpb[k]);
  }
  if (twGpb.glass) merged.glass = twGpb.glass;

  // 3. Inline styles (highest specificity)
  if (node.inlineStyle) {
    Object.assign(merged.desktop, parseCssDeclarations(node.inlineStyle, sheet.vars));
  }

  // Promote desktop.backdropFilter into gpb.glass when glass not yet created
  if (merged.desktop.backdropFilter && !merged.glass) {
    const m = merged.desktop.backdropFilter.match(/blur\(([^)]+)\)/);
    merged.glass = { blur: m ? m[1] : '16px' };
    delete merged.desktop.backdropFilter;
    if (merged.desktop.background) {
      merged.glass.bg = merged.desktop.background;
      delete merged.desktop.background;
    }
    if (merged.desktop.border) {
      merged.glass.border = merged.desktop.border;
      delete merged.desktop.border;
    }
    if (merged.desktop.boxShadow) {
      merged.glass.shadow = merged.desktop.boxShadow;
      delete merged.desktop.boxShadow;
    }
  }

  for (const k of ['desktop', 'tablet', 'mobile', 'hover']) {
    if (Object.keys(merged[k]).length === 0) delete merged[k];
  }
  return merged;
}

function getInnerText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text;
  if (!node.children) return '';
  return node.children.map(getInnerText).join(' ').replace(/\s+/g, ' ').trim();
}

module.exports = {
  parseHtmlTree,
  parseStylesheet,
  parseCssDeclarations,
  mapTailwindClassesToGpb,
  mergeStylesForNode,
  getInnerText,
  resolveCssVars,
};
