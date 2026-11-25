#!/usr/bin/env node
/**
 * Compiles Gutenberg Pro Blocks (`<!-- wp:... {"gpb":{...}} -->`) into a
 * standalone browser-ready HTML preview (`preview.html`) for visual pixel-perfect QA.
 *
 * Usage:
 *   node render-gpb-preview.js --input page.html --output preview.html
 */

const fs = require('fs');
const crypto = require('crypto');

const PROP_MAP = {
  display: 'display',
  flexDirection: 'flex-direction',
  justifyContent: 'justify-content',
  alignItems: 'align-items',
  flexWrap: 'flex-wrap',
  gap: 'gap',
  rowGap: 'row-gap',
  columnGap: 'column-gap',
  gridTemplateColumns: 'grid-template-columns',
  gridTemplateRows: 'grid-template-rows',
  gridColumn: 'grid-column',
  gridRow: 'grid-row',
  padding: 'padding',
  margin: 'margin',
  width: 'width',
  minWidth: 'min-width',
  maxWidth: 'max-width',
  height: 'height',
  minHeight: 'min-height',
  maxHeight: 'max-height',
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  zIndex: 'z-index',
  overflow: 'overflow',
  aspectRatio: 'aspect-ratio',
  fontSize: 'font-size',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textAlign: 'text-align',
  borderRadius: 'border-radius',
  border: 'border',
  borderColor: 'border-color',
  outline: 'outline',
  outlineOffset: 'outline-offset',
  boxShadow: 'box-shadow',
  background: 'background',
  color: 'color',
  opacity: 'opacity',
  transform: 'transform',
  perspective: 'perspective',
  transformStyle: 'transform-style',
  backfaceVisibility: 'backface-visibility',
  transformOrigin: 'transform-origin',
  filter: 'filter',
  backdropFilter: 'backdrop-filter',
  mixBlendMode: 'mix-blend-mode',
  clipPath: 'clip-path',
  transition: 'transition',
  cursor: 'cursor',
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

function renderPreview(gutenbergMarkup) {
  const styles = [];
  // Inject .gpb-{hash} on every opening block tag immediately following <!-- wp:... {...} -->
  const openCommentRe = /<!--\s+wp:([a-z0-9/-]+)\s+(\{[\s\S]*?\})\s+-->\s*(<[a-zA-Z][a-zA-Z0-9-]*\b[^>]*>)/g;

  let bodyHtml = gutenbergMarkup.replace(openCommentRe, (full, _blockName, jsonStr, openTag) => {
    let attrs = {};
    try {
      attrs = JSON.parse(jsonStr);
    } catch (_e) {
      return full;
    }
    if (!attrs.gpb || typeof attrs.gpb !== 'object') return openTag;

    const hash = 'gpb-' + crypto.createHash('md5').update(JSON.stringify(attrs.gpb)).digest('hex').slice(0, 8);
    styles.push(compileGpbCss(`.${hash}`, attrs.gpb));

    let tag = openTag;
    if (/class="([^"]*)"/.test(tag)) {
      tag = tag.replace(/class="([^"]*)"/, `class="$1 ${hash}"`);
    } else {
      tag = tag.replace(/>$/, ` class="${hash}">`);
    }

    if (attrs.gpb.animation) {
      tag = tag.replace(/>$/, ` data-gpb-anim='${JSON.stringify(attrs.gpb.animation)}'>`);
    }
    if (attrs.gpb.interactive) {
      tag = tag.replace(/>$/, ` data-gpb-interactive="${attrs.gpb.interactive.type || ''}" data-gpb-config='${JSON.stringify(attrs.gpb.interactive)}'>`);
    }
    return tag;
  });

  // Strip remaining Gutenberg comments for clean browser preview
  bodyHtml = bodyHtml.replace(/<!--\s+\/?wp:[\s\S]*?-->/g, '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPB Pixel-Perfect Preview</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
    .alignwide { max-width: 1200px; margin-left: auto; margin-right: auto; }
    .alignfull { width: 100%; }
    ${styles.join('')}
  </style>
</head>
<body>
${bodyHtml}
<script>
document.querySelectorAll('[data-gpb-anim]').forEach((el) => {
  const cfg = JSON.parse(el.getAttribute('data-gpb-anim') || '{}');
  if (cfg.type === 'fade-up') {
    el.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}], {duration:cfg.duration||650,easing:'cubic-bezier(0.16,1,0.3,1)',fill:'forwards'});
  }
});
</script>
</body>
</html>`;
}

const args = process.argv.slice(2);
const inIdx = args.indexOf('--input');
const outIdx = args.indexOf('--output');
if (inIdx === -1 || !args[inIdx + 1]) {
  console.log('Usage: node render-gpb-preview.js --input <gutenberg.html> [--output preview.html]');
  process.exit(0);
}

const inputPath = args[inIdx + 1];
const outputPath = outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : 'preview.html';

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const markup = fs.readFileSync(inputPath, 'utf8');
const htmlOut = renderPreview(markup);
fs.writeFileSync(outputPath, htmlOut, 'utf8');
console.log(`Preview rendered successfully -> ${outputPath}`);
