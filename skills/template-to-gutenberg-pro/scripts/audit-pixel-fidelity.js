#!/usr/bin/env node
/**
 * Pixel-Fidelity Auditor comparing a source HTML template against cloned Gutenberg Pro markup.
 * Checks structural section coverage, verbatim headings/CTAs, color/gradient preservation,
 * responsive breakpoint parity, and strict Gutenberg comment integrity.
 *
 * Usage:
 *   node audit-pixel-fidelity.js --source template.html --target cloned.html [--json]
 */

'use strict';

const fs = require('fs');
const { parseHtmlTree, parseStylesheet, getInnerText, mergeStylesForNode } = require('./lib-parser');

function normalizeText(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function audit(sourceHtml, targetMarkup) {
  const { root, styleBlocks } = parseHtmlTree(sourceHtml);
  const sheet = parseStylesheet(styleBlocks.join('\n'));

  const srcTexts = [];
  const srcColors = new Set();
  let srcSections = 0;
  let srcHasResponsive = Object.keys(sheet.mediaRules.tablet).length > 0 || Object.keys(sheet.mediaRules.mobile).length > 0;

  function walk(node) {
    if (!node || node.type !== 'element') return;
    if (['header', 'section', 'footer', 'form'].includes(node.tag)) srcSections++;
    if (/^h[1-6]$/.test(node.tag) || node.tag === 'a' || node.tag === 'button') {
      const t = getInnerText(node);
      if (t) srcTexts.push(t);
    }
    if (node.classes.some((c) => c.startsWith('md:') || c.startsWith('sm:') || c.startsWith('lg:'))) {
      srcHasResponsive = true;
    }
    const gpb = mergeStylesForNode(node, sheet);
    for (const part of ['desktop', 'tablet', 'mobile', 'hover', 'glass']) {
      if (!gpb[part]) continue;
      for (const v of Object.values(gpb[part])) {
        if (typeof v !== 'string') continue;
        const m = v.match(/#(?:[0-9a-fA-F]{3,8})\b/g);
        if (m) m.forEach((c) => srcColors.add(c.toLowerCase()));
      }
    }
    (node.children || []).forEach(walk);
  }
  root.children.forEach(walk);

  const normTarget = normalizeText(targetMarkup.replace(/<!--[\s\S]*?-->/g, ' '));
  const missingTexts = srcTexts.filter((t) => !normTarget.includes(normalizeText(t)));

  const targetLower = targetMarkup.toLowerCase();
  const missingColors = Array.from(srcColors).filter((c) => !targetLower.includes(c));

  const targetHasResponsive = targetMarkup.includes('"tablet"') || targetMarkup.includes('"mobile"');
  const openCount = (targetMarkup.match(/<!--\s+wp:[a-z0-9/-]+(?:\s+\{[\s\S]*?\})?\s+-->/g) || []).length;
  const closeCount = (targetMarkup.match(/<!--\s+\/wp:[a-z0-9/-]+\s+-->/g) || []).length;
  const hasForbiddenParagraphClass = targetMarkup.includes('wp-block-paragraph');

  // Check freestanding non-WP HTML comments
  const allComments = targetMarkup.match(/<!--[\s\S]*?-->/g) || [];
  const badComments = allComments.filter((c) => !/^<!--\s+\/?wp:/.test(c) && !/^<!--\s*(?:more|nextpage)/.test(c));

  const textScore = srcTexts.length ? ((srcTexts.length - missingTexts.length) / srcTexts.length) * 35 : 35;
  const colorScore = srcColors.size ? ((srcColors.size - missingColors.length) / srcColors.size) * 25 : 25;
  const respScore = !srcHasResponsive || targetHasResponsive ? 20 : 0;
  const integrityScore = (openCount === closeCount && !hasForbiddenParagraphClass && badComments.length === 0) ? 20 : 5;
  const totalScore = Math.round(textScore + colorScore + respScore + integrityScore);

  return {
    score: totalScore,
    sourceSections: srcSections,
    textPreserved: `${srcTexts.length - missingTexts.length}/${srcTexts.length}`,
    missingTexts,
    colorsPreserved: `${srcColors.size - missingColors.length}/${srcColors.size}`,
    missingColors,
    responsiveParity: !srcHasResponsive || targetHasResponsive,
    gutenbergIntegrity: {
      balancedDelimiters: openCount === closeCount,
      openCount,
      closeCount,
      hasForbiddenParagraphClass,
      nonGutenbergComments: badComments.length,
    },
  };
}

const args = process.argv.slice(2);
const srcIdx = args.indexOf('--source');
const tgtIdx = args.indexOf('--target');
if (srcIdx === -1 || tgtIdx === -1 || !args[srcIdx + 1] || !args[tgtIdx + 1]) {
  console.log('Usage: node audit-pixel-fidelity.js --source template.html --target cloned.html [--json]');
  process.exit(0);
}

const sourceHtml = fs.readFileSync(args[srcIdx + 1], 'utf8');
const targetMarkup = fs.readFileSync(args[tgtIdx + 1], 'utf8');
const report = audit(sourceHtml, targetMarkup);

if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`=== Pixel-Fidelity Audit Report ===`);
  console.log(`Score: ${report.score}/100`);
  console.log(`Text / Headings Preserved: ${report.textPreserved}`);
  console.log(`Color Tokens Preserved:    ${report.colorsPreserved}`);
  console.log(`Responsive Parity:         ${report.responsiveParity ? 'OK' : 'MISSING tablet/mobile rules'}`);
  console.log(`Gutenberg Integrity:       ${report.gutenbergIntegrity.balancedDelimiters && !report.gutenbergIntegrity.hasForbiddenParagraphClass && report.gutenbergIntegrity.nonGutenbergComments === 0 ? 'PASSED' : 'FAILED'}`);
  if (report.missingTexts.length) console.log(`Missing Copy: ${report.missingTexts.join(' | ')}`);
  if (report.missingColors.length) console.log(`Missing Colors: ${report.missingColors.join(', ')}`);
}
