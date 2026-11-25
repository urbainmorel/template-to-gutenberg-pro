#!/usr/bin/env node
/**
 * Deep AST-Based Design Token, CSS Variable, Stylesheet, Tailwind & Section Extractor
 * for Pixel-Perfect Template-to-Gutenberg-Pro Conversion.
 *
 * Usage:
 *   node extract-template-spec.js --file template.html [--json]
 */

'use strict';

const fs = require('fs');
const {
  parseHtmlTree,
  parseStylesheet,
  mergeStylesForNode,
  getInnerText,
} = require('./lib-parser');

function collectTokensAndSections(root, sheet) {
  const colors = new Set();
  const gradients = new Set();
  const fonts = new Set();
  const sections = [];
  const headings = [];
  const ctas = [];
  const forms = [];

  // From stylesheet vars & rules
  for (const val of Object.values(sheet.vars)) {
    const cm = val.match(/#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g);
    if (cm) cm.forEach((c) => colors.add(c));
    const gm = val.match(/(?:linear|radial|conic)-gradient\([^;{}]+\)/g);
    if (gm) gm.forEach((g) => gradients.add(g));
  }

  for (const ruleMap of [sheet.rules, sheet.hoverRules, sheet.mediaRules.tablet, sheet.mediaRules.mobile]) {
    for (const decls of Object.values(ruleMap)) {
      for (const v of Object.values(decls)) {
        if (typeof v !== 'string') continue;
        const cm = v.match(/#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g);
        if (cm) cm.forEach((c) => colors.add(c));
        const gm = v.match(/(?:linear|radial|conic)-gradient\([^;{}]+\)/g);
        if (gm) gm.forEach((g) => gradients.add(g));
      }
    }
  }

  function walk(node, depth = 0) {
    if (!node || node.type !== 'element') return;
    const gpb = mergeStylesForNode(node, sheet);

    for (const part of ['desktop', 'tablet', 'mobile', 'hover', 'glass']) {
      if (!gpb[part]) continue;
      for (const v of Object.values(gpb[part])) {
        if (typeof v !== 'string') continue;
        const cm = v.match(/#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g);
        if (cm) cm.forEach((c) => colors.add(c));
        const gm = v.match(/(?:linear|radial|conic)-gradient\([^;{}]+\)/g);
        if (gm) gm.forEach((g) => gradients.add(g));
      }
    }

    if (/^h[1-6]$/.test(node.tag)) {
      const txt = getInnerText(node);
      if (txt) headings.push({ level: parseInt(node.tag[1], 10), text: txt, gpb });
    }

    if (node.tag === 'a' || node.tag === 'button') {
      const txt = getInnerText(node);
      if (txt) ctas.push({ tag: node.tag, text: txt, href: node.attrs.href || '#', gpb });
    }

    if (node.tag === 'form') {
      const inputs = [];
      const walkForm = (n) => {
        if (!n || n.type !== 'element') return;
        if (['input', 'select', 'textarea'].includes(n.tag) && n.attrs.type !== 'submit') {
          inputs.push({
            tag: n.tag,
            type: n.attrs.type || n.tag,
            name: n.attrs.name || `field_${inputs.length + 1}`,
            required: 'required' in n.attrs,
            placeholder: n.attrs.placeholder || '',
          });
        }
        (n.children || []).forEach(walkForm);
      };
      walkForm(node);
      forms.push({ id: node.attrs.id || null, inputs, gpb });
    }

    if (['header', 'nav', 'section', 'main', 'article', 'footer'].includes(node.tag)) {
      sections.push({
        index: sections.length + 1,
        tag: node.tag,
        id: node.attrs.id || null,
        targetPlugin: 'gutenberg-pro-blocks',
        gutenbergBlock: `wp:group (tagName:"${node.tag}")`,
        gpb,
        childCount: node.children.filter((c) => c.type === 'element').length,
      });
    }

    (node.children || []).forEach((c) => walk(c, depth + 1));
  }

  root.children.forEach((c) => walk(c, 0));

  return {
    colors: Array.from(colors),
    gradients: Array.from(gradients),
    fonts: Array.from(fonts),
    sections,
    headings,
    ctas,
    forms,
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
const { root, styleBlocks, googleFonts } = parseHtmlTree(html);
const sheet = parseStylesheet(styleBlocks.join('\n'));
const extracted = collectTokensAndSections(root, sheet);

const report = {
  tokens: {
    cssVariables: sheet.vars,
    googleFonts,
    colors: extracted.colors,
    gradients: extracted.gradients,
    keyframes: sheet.keyframes,
  },
  sections: extracted.sections,
  headings: extracted.headings,
  ctas: extracted.ctas,
  forms: extracted.forms,
};

if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('=== Deep Template Design Spec Extraction (v2.0) ===');
  console.log(`CSS Variables (:root): ${Object.keys(sheet.vars).length}`);
  console.log(`Google Fonts: ${googleFonts.length}`);
  console.log(`Colors (${extracted.colors.length}): ${extracted.colors.slice(0, 12).join(', ')}`);
  console.log(`Gradients (${extracted.gradients.length}): ${extracted.gradients.slice(0, 4).join(' | ')}`);
  console.log(`Keyframes: ${sheet.keyframes.join(', ') || 'none'}`);
  console.log(`Sections: ${extracted.sections.length} | Headings: ${extracted.headings.length} | CTAs: ${extracted.ctas.length} | Forms: ${extracted.forms.length}\n`);
  for (const s of extracted.sections) {
    console.log(`  #${s.index} <${s.tag}>${s.id ? '#' + s.id : ''} -> ${s.gutenbergBlock}`);
    if (Object.keys(s.gpb).length) console.log(`     GPB: ${JSON.stringify(s.gpb)}`);
  }
}
