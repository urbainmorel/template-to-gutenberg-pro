#!/usr/bin/env node
/**
 * Zero-dependency Design Token, Tailwind & Section Blueprint Extractor
 * for Pixel-Perfect Template-to-Gutenberg-Pro Conversion.
 *
 * Usage:
 *   node extract-template-spec.js --file template.html [--json]
 */

const fs = require('fs');

function extractMatches(text, regex) {
  const set = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) {
    set.add(m[0].trim());
  }
  return Array.from(set);
}

function mapTailwindToGpb(classes) {
  const gpb = { desktop: {}, tablet: {}, mobile: {}, hover: {} };
  const glass = {};

  for (const cls of classes) {
    // Grid columns
    const gridMatch = cls.match(/^(?:(md|lg):)?grid-cols-(\d+)$/);
    if (gridMatch) {
      const bp = gridMatch[1] === 'md' ? 'tablet' : 'desktop';
      gpb[bp].display = 'grid';
      gpb[bp].gridTemplateColumns = `repeat(${gridMatch[2]}, minmax(0, 1fr))`;
      if (bp === 'desktop' && !gpb.mobile.gridTemplateColumns) {
        gpb.mobile.gridTemplateColumns = '1fr';
      }
      continue;
    }

    // Col span
    const spanMatch = cls.match(/^(?:(md|lg):)?col-span-(\d+)$/);
    if (spanMatch) {
      const bp = spanMatch[1] === 'md' ? 'tablet' : 'desktop';
      gpb[bp].gridColumn = `span ${spanMatch[2]}`;
      continue;
    }

    // Gap & Padding (Tailwind 4px scale)
    const gapMatch = cls.match(/^gap-(\d+)$/);
    if (gapMatch) gpb.desktop.gap = `${parseInt(gapMatch[1], 10) * 4}px`;

    const padMatch = cls.match(/^p-(\d+)$/);
    if (padMatch) gpb.desktop.padding = `${parseInt(padMatch[1], 10) * 4}px`;

    // Border radius
    if (cls === 'rounded-xl') gpb.desktop.borderRadius = '12px';
    if (cls === 'rounded-2xl') gpb.desktop.borderRadius = '16px';
    if (cls === 'rounded-3xl') gpb.desktop.borderRadius = '24px';
    if (cls === 'rounded-full') gpb.desktop.borderRadius = '9999px';

    // Glassmorphism
    if (cls === 'backdrop-blur-md') glass.blur = '12px';
    if (cls === 'backdrop-blur-lg') glass.blur = '16px';
    if (cls === 'backdrop-blur-xl') glass.blur = '24px';

    // Positioning
    if (cls === 'sticky') gpb.desktop.position = 'sticky';
    if (cls === 'relative') gpb.desktop.position = 'relative';
    if (cls === 'absolute') gpb.desktop.position = 'absolute';
    if (cls === 'top-0') gpb.desktop.top = '0px';
    const zMatch = cls.match(/^z-(\d+)$/);
    if (zMatch) gpb.desktop.zIndex = parseInt(zMatch[1], 10);

    // Hover states
    if (cls.startsWith('hover:-translate-y-')) {
      const val = parseFloat(cls.replace('hover:-translate-y-', '')) * 4;
      if (!Number.isNaN(val)) gpb.hover.translateY = `-${val}px`;
    }
    if (cls.startsWith('hover:scale-')) {
      const raw = parseInt(cls.replace('hover:scale-', ''), 10);
      if (!Number.isNaN(raw)) gpb.hover.scale = raw / 100;
    }
  }

  if (Object.keys(glass).length) gpb.glass = glass;
  for (const k of ['desktop', 'tablet', 'mobile', 'hover']) {
    if (Object.keys(gpb[k]).length === 0) delete gpb[k];
  }
  return gpb;
}

function analyzeHtml(html) {
  const colors = extractMatches(html, /#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g).slice(0, 40);
  const gradients = extractMatches(html, /(?:linear|radial|conic)-gradient\([^;{}"]+\)/g).slice(0, 20);
  const fonts = extractMatches(html, /font-family\s*:\s*([^;{}"]+)/g).slice(0, 15);
  const blurs = extractMatches(html, /backdrop-filter\s*:\s*([^;{}"]+)/g).slice(0, 15);
  const keyframes = extractMatches(html, /@keyframes\s+([a-zA-Z0-9_-]+)/g);

  // Extract classes used in markup
  const classSet = new Set();
  const classRe = /class="([^"]+)"/g;
  let cm;
  while ((cm = classRe.exec(html)) !== null) {
    cm[1].split(/\s+/).filter(Boolean).forEach((c) => classSet.add(c));
  }

  // Extract structural sections
  const sections = [];
  const secRe = /<(header|nav|section|main|article|form|footer)([^>]*)>/gi;
  let sm;
  let idx = 0;
  while ((sm = secRe.exec(html)) !== null) {
    idx++;
    const tag = sm[1].toLowerCase();
    const attrs = sm[2] || '';
    const clsMatch = attrs.match(/class="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/);
    const tagClasses = clsMatch ? clsMatch[1].split(/\s+/).filter(Boolean) : [];
    const targetPlugin = tag === 'form' ? 'cf7-pro-suite' : 'gutenberg-pro-blocks';
    const gutenbergBlock = tag === 'form' ? 'wp:shortcode ([contact-form-7])' : `wp:group (tagName:"${tag}")`;

    sections.push({
      index: idx,
      tag,
      id: idMatch ? idMatch[1] : null,
      targetPlugin,
      gutenbergBlock,
      suggestedGpb: tag === 'form' ? null : mapTailwindToGpb(tagClasses),
      classes: tagClasses.slice(0, 25),
    });
  }

  return {
    tokens: {
      colors,
      gradients,
      fonts,
      backdropFilters: blurs,
      keyframes,
      tailwindUtilityCount: classSet.size,
    },
    sections,
  };
}

const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
if (fileIdx === -1 || !args[fileIdx + 1]) {
  console.log('Usage: node extract-template-spec.js --file <template.html> [--json]');
  process.exit(0);
}

const filePath = args[fileIdx + 1];
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');
const report = analyzeHtml(html);

if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('=== Template Design Spec Extraction ===');
  console.log(`Colors found (${report.tokens.colors.length}): ${report.tokens.colors.slice(0, 12).join(', ')}`);
  console.log(`Gradients (${report.tokens.gradients.length}): ${report.tokens.gradients.slice(0, 5).join(' | ')}`);
  console.log(`Keyframes (${report.tokens.keyframes.length}): ${report.tokens.keyframes.join(', ') || 'none'}`);
  console.log(`Sections detected: ${report.sections.length}\n`);
  for (const sec of report.sections) {
    console.log(`  #${sec.index} <${sec.tag}>${sec.id ? '#' + sec.id : ''} -> ${sec.gutenbergBlock} [${sec.targetPlugin}]`);
    if (sec.suggestedGpb && Object.keys(sec.suggestedGpb).length > 0) {
      console.log(`     Suggested GPB: ${JSON.stringify(sec.suggestedGpb)}`);
    }
  }
}
