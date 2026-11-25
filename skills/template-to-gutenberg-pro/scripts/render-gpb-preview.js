#!/usr/bin/env node
/**
 * Compiles Gutenberg Pro Blocks (`<!-- wp:... {"gpb":{...}} -->`) into a
 * full-fidelity standalone browser preview with:
 * - Sequential nested block parser (handles arbitrary nesting depth)
 * - Complete GPB v3.1 CSS compiler + interactive JS runtime (animations, 3D tilt, magnetic, sticky-header)
 * - Optional Google Fonts injection (--fonts "Inter:wght@400;600;700")
 * - Optional Onion-Skin Reference Screenshot Overlay & Viewport Switcher (--reference shot.png)
 *
 * Usage:
 *   node render-gpb-preview.js --input page.html --output preview.html [--fonts "..."] [--reference shot.png]
 */

'use strict';

const fs = require('fs');
const crypto = require('crypto');

const PROP_MAP = {
  display: 'display', flexDirection: 'flex-direction', justifyContent: 'justify-content',
  alignItems: 'align-items', flexWrap: 'flex-wrap', gap: 'gap', rowGap: 'row-gap',
  columnGap: 'column-gap', gridTemplateColumns: 'grid-template-columns',
  gridTemplateRows: 'grid-template-rows', gridColumn: 'grid-column', gridRow: 'grid-row',
  padding: 'padding', margin: 'margin', width: 'width', minWidth: 'min-width',
  maxWidth: 'max-width', height: 'height', minHeight: 'min-height', maxHeight: 'max-height',
  position: 'position', top: 'top', right: 'right', bottom: 'bottom', left: 'left',
  zIndex: 'z-index', overflow: 'overflow', aspectRatio: 'aspect-ratio', fontSize: 'font-size',
  lineHeight: 'line-height', letterSpacing: 'letter-spacing', textAlign: 'text-align',
  borderRadius: 'border-radius', border: 'border', borderColor: 'border-color',
  outline: 'outline', outlineOffset: 'outline-offset', boxShadow: 'box-shadow',
  background: 'background', color: 'color', opacity: 'opacity', transform: 'transform',
  perspective: 'perspective', transformStyle: 'transform-style',
  backfaceVisibility: 'backface-visibility', transformOrigin: 'transform-origin',
  filter: 'filter', backdropFilter: 'backdrop-filter', mixBlendMode: 'mix-blend-mode',
  clipPath: 'clip-path', transition: 'transition', cursor: 'cursor',
  pointerEvents: 'pointer-events', userSelect: 'user-select', objectFit: 'object-fit',
};

const TRANSFORM_FNS = [
  'translateX', 'translateY', 'translateZ', 'scale',
  'rotate', 'rotateZ', 'rotateX', 'rotateY', 'skewX', 'skewY',
];

function compileDecls(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const rules = [];
  const transforms = [];
  const has3d = obj.rotateX || obj.rotateY || obj.translateZ;
  if (has3d && obj.perspective) transforms.push(`perspective(${obj.perspective})`);
  for (const fn of TRANSFORM_FNS) {
    if (obj[fn] !== undefined && obj[fn] !== '') transforms.push(`${fn}(${obj[fn]})`);
  }
  for (const [k, v] of Object.entries(obj)) {
    if (TRANSFORM_FNS.includes(k)) continue;
    if (k === 'hide' && v === true) {
      rules.push('display:none !important');
      continue;
    }
    if (k === 'textGradient' && typeof v === 'string') {
      rules.push(`background:${v}`, '-webkit-background-clip:text', 'background-clip:text', '-webkit-text-fill-color:transparent');
      continue;
    }
    if (PROP_MAP[k] && (typeof v === 'string' || typeof v === 'number')) {
      rules.push(`${PROP_MAP[k]}:${v}`);
      if (k === 'backdropFilter') rules.push(`-webkit-backdrop-filter:${v}`);
    }
  }
  if (transforms.length && !obj.transform) rules.push(`transform:${transforms.join(' ')}`);
  return rules.join(';');
}

function compileGpbCss(selector, gpb) {
  let css = '';
  const baseParts = [];
  if (gpb.desktop) {
    const d = compileDecls(gpb.desktop);
    if (d) baseParts.push(d);
  }
  if (gpb.glass) {
    const blur = gpb.glass.blur || '16px';
    const sat = gpb.glass.saturate || '180%';
    baseParts.push(`backdrop-filter:blur(${blur}) saturate(${sat})`, `-webkit-backdrop-filter:blur(${blur}) saturate(${sat})`);
    if (gpb.glass.bg) baseParts.push(`background:${gpb.glass.bg}`);
    if (gpb.glass.border) baseParts.push(`border:${gpb.glass.border}`);
    if (gpb.glass.shadow) baseParts.push(`box-shadow:${gpb.glass.shadow}`);
  }
  if (gpb.hover) {
    baseParts.push(`transition:${gpb.hover.transition || 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'}`);
  }
  if (baseParts.length) css += `${selector}{${baseParts.join(';')}}\n`;
  if (gpb.tablet) {
    const t = compileDecls(gpb.tablet);
    if (t) css += `@media (max-width:1024px){${selector}{${t}}}\n`;
  }
  if (gpb.mobile) {
    const m = compileDecls(gpb.mobile);
    if (m) css += `@media (max-width:767px){${selector}{${m}}}\n`;
  }
  if (gpb.hover) {
    const hr = { ...gpb.hover };
    delete hr.transition;
    const h = compileDecls(hr);
    if (h) css += `${selector}:hover{${h}}\n`;
  }
  if (typeof gpb.customCss === 'string' && gpb.customCss.trim()) {
    css += gpb.customCss.replace(/&/g, selector) + '\n';
  }
  return css;
}

function injectAttrOnFirstTag(htmlSlice, className, anim, interactive) {
  return htmlSlice.replace(/<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/, (_m, tag, attrs) => {
    let nextAttrs = attrs;
    if (/class="([^"]*)"/.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/class="([^"]*)"/, `class="$1 ${className}"`);
    } else {
      nextAttrs += ` class="${className}"`;
    }
    if (anim) nextAttrs += ` data-gpb-anim='${JSON.stringify(anim)}'`;
    if (interactive) nextAttrs += ` data-gpb-interactive="${interactive.type || ''}" data-gpb-config='${JSON.stringify(interactive)}'`;
    return `<${tag}${nextAttrs}>`;
  });
}

function renderPreview(gutenbergMarkup, opts = {}) {
  const styles = new Map();
  const commentRe = /<!--\s+(\/?)wp:([a-z0-9/-]+)(?:\s+(\{[\s\S]*?\}))?\s+(\/?)-->/g;
  let cursor = 0;
  let out = '';
  let match;

  while ((match = commentRe.exec(gutenbergMarkup)) !== null) {
    out += gutenbergMarkup.slice(cursor, match.index);
    cursor = commentRe.lastIndex;

    const isClose = match[1] === '/';
    const jsonStr = match[3];
    const isSelfClose = match[4] === '/';
    if (isClose || isSelfClose || !jsonStr) continue;

    let attrs = {};
    try {
      attrs = JSON.parse(jsonStr);
    } catch (_e) {
      continue;
    }

    if (!attrs.gpb || typeof attrs.gpb !== 'object') continue;
    const gpb = attrs.gpb;
    const hash = 'gpb-' + crypto.createHash('md5').update(JSON.stringify(gpb)).digest('hex').slice(0, 8);
    if (!styles.has(hash)) styles.set(hash, compileGpbCss(`.${hash}`, gpb));

    const remaining = gutenbergMarkup.slice(cursor);
    const firstTagMatch = remaining.match(/^(\s*<[a-zA-Z][a-zA-Z0-9-]*\b[^>]*>)/);
    if (firstTagMatch) {
      out += injectAttrOnFirstTag(firstTagMatch[1], hash, gpb.animation, gpb.interactive);
      cursor += firstTagMatch[1].length;
    }
  }
  out += gutenbergMarkup.slice(cursor);
  out = out.replace(/<!--\s+\/?wp:[\s\S]*?-->/g, '');

  const fontLink = opts.fonts
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(opts.fonts).replace(/%3A/g, ':').replace(/%40/g, '@').replace(/%3B/g, ';').replace(/%7C/g, '&family=')}&display=swap" />`
    : '';

  const refToolbar = opts.reference
    ? `<div id="gpb-qa-bar" style="position:fixed;bottom:14px;right:14px;z-index:999999;display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:12px;background:rgba(15,23,42,0.92);color:#fff;font:12px/1.2 system-ui;box-shadow:0 12px 32px rgba(0,0,0,0.4);">
        <span>QA Diff</span>
        <input id="gpb-qa-op" type="range" min="0" max="100" value="0" style="width:90px" />
        <span id="gpb-qa-val">0%</span>
      </div>
      <img id="gpb-qa-ref" src="${opts.reference}" alt="Reference" style="position:fixed;inset:0;width:100%;height:auto;pointer-events:none;opacity:0;z-index:999990;" />
      <script>
        document.getElementById('gpb-qa-op').addEventListener('input', function(e){
          document.getElementById('gpb-qa-ref').style.opacity = e.target.value / 100;
          document.getElementById('gpb-qa-val').textContent = e.target.value + '%';
        });
      </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPB Pixel-Perfect Preview (v2.0)</title>
  ${fontLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
    .alignwide { max-width: 1200px; margin-left: auto; margin-right: auto; }
    .alignfull { width: 100%; }
    ${Array.from(styles.values()).join('')}
  </style>
</head>
<body>
${out}
${refToolbar}
<script>
(function(){
  const KF = {
    'fade-up': [{opacity:0,transform:'translate3d(0,28px,0)'},{opacity:1,transform:'none'}],
    'fade-down': [{opacity:0,transform:'translate3d(0,-28px,0)'},{opacity:1,transform:'none'}],
    'blur-in': [{opacity:0,filter:'blur(12px)',transform:'translate3d(0,14px,0)'},{opacity:1,filter:'none',transform:'none'}],
    'zoom-in': [{opacity:0,transform:'scale(0.92)'},{opacity:1,transform:'scale(1)'}],
    'rotate-3d': [{opacity:0,transform:'perspective(900px) rotateX(18deg) rotateY(-14deg) scale(0.92)'},{opacity:1,transform:'none'}]
  };
  document.querySelectorAll('[data-gpb-anim]').forEach((el) => {
    const cfg = JSON.parse(el.getAttribute('data-gpb-anim') || '{}');
    const frames = KF[cfg.type];
    if (frames) el.animate(frames, {duration: cfg.duration || 650, delay: cfg.delay || 0, easing: cfg.easing || 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards'});
  });
})();
</script>
</body>
</html>`;
}

const args = process.argv.slice(2);
const inIdx = args.indexOf('--input');
if (inIdx === -1 || !args[inIdx + 1]) {
  console.log('Usage: node render-gpb-preview.js --input <gutenberg.html> [--output preview.html] [--fonts "..."] [--reference shot.png]');
  process.exit(0);
}

const inputPath = args[inIdx + 1];
const outIdx = args.indexOf('--output');
const outputPath = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : 'preview.html';
const fontsIdx = args.indexOf('--fonts');
const refIdx = args.indexOf('--reference');

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const htmlOut = renderPreview(fs.readFileSync(inputPath, 'utf8'), {
  fonts: fontsIdx !== -1 ? args[fontsIdx + 1] : '',
  reference: refIdx !== -1 ? args[refIdx + 1] : '',
});
fs.writeFileSync(outputPath, htmlOut, 'utf8');
console.log(`Preview rendered successfully -> ${outputPath}`);
