#!/usr/bin/env node
/**
 * Deterministic HTML/CSS/Tailwind -> Pure WordPress Gutenberg Pro Blocks (+ CF7 Pro) Compiler.
 * Produces strictly valid WordPress 7.0 serialized block markup ready for validate-blocks.js and WP.
 *
 * Usage:
 *   node convert-html-to-gpb.js --file source.html --output cloned.html [--cf7-out form.html]
 */

'use strict';

const fs = require('fs');
const {
  parseHtmlTree,
  parseStylesheet,
  mergeStylesForNode,
  getInnerText,
} = require('./lib-parser');

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hasGpb(gpb) {
  return gpb && Object.keys(gpb).length > 0;
}

function convertFormToCf7(formNode) {
  const lines = ['<div class="cf7p-theme-glass">'];
  let idx = 0;

  function walk(node) {
    if (!node || node.type !== 'element') return;

    if (node.tag === 'input') {
      const type = (node.attrs.type || 'text').toLowerCase();
      if (type === 'submit') {
        const label = node.attrs.value || 'Envoyer';
        lines.push(`  [submit class:cf7p-btn "${escAttr(label)}"]`);
        return;
      }
      idx++;
      const name = (node.attrs.name || `champ_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const req = 'required' in node.attrs ? '*' : '';
      const ph = node.attrs.placeholder ? ` placeholder "${escAttr(node.attrs.placeholder)}"` : '';
      const cf7Type = ['email', 'tel', 'url', 'number', 'date', 'range', 'file'].includes(type) ? type : 'text';

      if (cf7Type === 'tel') {
        lines.push(`  <div class="cf7p-smart-phone">[tel${req} ${name}${ph}]</div>`);
      } else if (cf7Type === 'file') {
        lines.push(`  <div class="cf7p-dropzone">[file${req} ${name}]</div>`);
      } else {
        lines.push(`  <label>${escHtml(node.attrs.placeholder || name)} [${cf7Type}${req} ${name}${ph}]</label>`);
      }
      return;
    }

    if (node.tag === 'textarea') {
      idx++;
      const name = (node.attrs.name || `message_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const req = 'required' in node.attrs ? '*' : '';
      const ph = node.attrs.placeholder ? ` placeholder "${escAttr(node.attrs.placeholder)}"` : '';
      lines.push(`  <label>${escHtml(node.attrs.placeholder || 'Message')} [textarea${req} ${name}${ph}]</label>`);
      return;
    }

    if (node.tag === 'select') {
      idx++;
      const name = (node.attrs.name || `choix_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const req = 'required' in node.attrs ? '*' : '';
      const opts = (node.children || [])
        .filter((c) => c.type === 'element' && c.tag === 'option')
        .map((c) => `"${escAttr(getInnerText(c))}"`)
        .join(' ');
      lines.push(`  <label>${escHtml(name)} [select${req} ${name} ${opts || '"Option 1"'}]</label>`);
      return;
    }

    if (node.tag === 'button' && (node.attrs.type === 'submit' || !node.attrs.type)) {
      const txt = getInnerText(node) || 'Envoyer';
      lines.push(`  [submit class:cf7p-btn "${escAttr(txt)}"]`);
      return;
    }

    (node.children || []).forEach(walk);
  }

  walk(formNode);
  if (!lines.some((l) => l.includes('[submit'))) {
    lines.push('  [submit class:cf7p-btn "Envoyer"]');
  }
  lines.push('</div>');
  return lines.join('\n');
}

function convertNode(node, sheet, cf7Forms, indent = '') {
  if (!node) return '';
  if (node.type === 'text') {
    const txt = node.text.trim();
    if (!txt) return '';
    return `${indent}<!-- wp:paragraph -->\n${indent}<p>${escHtml(txt)}</p>\n${indent}<!-- /wp:paragraph -->\n`;
  }
  if (node.type === 'svg') {
    return `${indent}<!-- wp:html -->\n${node.rawHtml}\n${indent}<!-- /wp:html -->\n`;
  }
  if (['head', 'meta', 'link', 'title', 'script', 'style', 'noscript'].includes(node.tag)) {
    return '';
  }

  const gpb = mergeStylesForNode(node, sheet);

  // Headings h1..h6
  if (/^h[1-6]$/.test(node.tag)) {
    const level = parseInt(node.tag[1], 10);
    const attrs = { level };
    if (hasGpb(gpb)) attrs.gpb = gpb;
    const text = escHtml(getInnerText(node));
    return `${indent}<!-- wp:heading ${JSON.stringify(attrs)} -->\n${indent}<h${level} class="wp-block-heading">${text}</h${level}>\n${indent}<!-- /wp:heading -->\n`;
  }

  // Paragraphs / inline text blocks
  if (node.tag === 'p' || node.tag === 'span') {
    const text = escHtml(getInnerText(node));
    if (!text) return '';
    const jsonPart = hasGpb(gpb) ? ` ${JSON.stringify({ gpb })}` : '';
    return `${indent}<!-- wp:paragraph${jsonPart} -->\n${indent}<p>${text}</p>\n${indent}<!-- /wp:paragraph -->\n`;
  }

  // Buttons & CTA links
  if (node.tag === 'a' || node.tag === 'button') {
    const text = escHtml(getInnerText(node));
    if (!text) return '';
    const href = escAttr(node.attrs.href || '#');
    const btnJson = hasGpb(gpb) ? ` ${JSON.stringify({ gpb })}` : '';
    return `${indent}<!-- wp:buttons -->\n${indent}<div class="wp-block-buttons">\n${indent}<!-- wp:button${btnJson} -->\n${indent}<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${href}">${text}</a></div>\n${indent}<!-- /wp:button -->\n${indent}</div>\n${indent}<!-- /wp:buttons -->\n`;
  }

  // Images
  if (node.tag === 'img') {
    const src = escAttr(node.attrs.src || '');
    const alt = escAttr(node.attrs.alt || '');
    const imgJson = hasGpb(gpb) ? ` ${JSON.stringify({ gpb })}` : '';
    return `${indent}<!-- wp:image${imgJson} -->\n${indent}<figure class="wp-block-image"><img src="${src}" alt="${alt}"/></figure>\n${indent}<!-- /wp:image -->\n`;
  }

  // Lists ul / ol
  if (node.tag === 'ul' || node.tag === 'ol') {
    const ordered = node.tag === 'ol';
    const listAttrs = {};
    if (ordered) listAttrs.ordered = true;
    if (hasGpb(gpb)) listAttrs.gpb = gpb;
    const jsonPart = Object.keys(listAttrs).length ? ` ${JSON.stringify(listAttrs)}` : '';

    const items = (node.children || [])
      .filter((c) => c.type === 'element' && c.tag === 'li')
      .map((li) => `${indent}<!-- wp:list-item -->\n${indent}<li>${escHtml(getInnerText(li))}</li>\n${indent}<!-- /wp:list-item -->`)
      .join('\n');

    if (!items) return '';
    return `${indent}<!-- wp:list${jsonPart} -->\n${indent}<${node.tag} class="wp-block-list">\n${items}\n${indent}</${node.tag}>\n${indent}<!-- /wp:list -->\n`;
  }

  // Forms -> CF7 Pro Suite shortcode wrapped in styled wp:group
  if (node.tag === 'form') {
    cf7Forms.push(convertFormToCf7(node));
    const formNum = cf7Forms.length;
    const grpAttrs = { layout: { type: 'constrained' } };
    if (hasGpb(gpb)) grpAttrs.gpb = gpb;
    return `${indent}<!-- wp:group ${JSON.stringify(grpAttrs)} -->\n${indent}<div class="wp-block-group">\n${indent}<!-- wp:shortcode -->\n[contact-form-7 id="REPLACE_FORM_${formNum}" title="Formulaire Pro ${formNum}"]\n${indent}<!-- /wp:shortcode -->\n${indent}</div>\n${indent}<!-- /wp:group -->\n`;
  }

  // Containers (header, nav, section, main, article, footer, div)
  if (node.tag === 'html' || node.tag === 'body') {
    return (node.children || []).map((c) => convertNode(c, sheet, cf7Forms, indent)).join('');
  }

  const allowedTagNames = new Set(['div', 'header', 'main', 'section', 'article', 'aside', 'footer']);
  const tagName = allowedTagNames.has(node.tag) ? node.tag : 'div';
  const attrs = {};
  if (tagName !== 'div') attrs.tagName = tagName;
  if (tagName === 'section' || tagName === 'header' || tagName === 'footer') {
    attrs.align = 'full';
  }
  if (hasGpb(gpb)) {
    attrs.gpb = gpb;
    if (gpb.desktop && gpb.desktop.position === 'sticky' && tagName === 'header') {
      attrs.gpb.interactive = { type: 'sticky-header', scrollOffset: 50 };
    }
  }
  attrs.layout = (gpb.desktop && gpb.desktop.display === 'grid') ? { type: 'default' } : { type: 'constrained' };

  const innerContent = (node.children || [])
    .map((c) => convertNode(c, sheet, cf7Forms, indent))
    .join('');

  if (!innerContent.trim() && !hasGpb(gpb)) return '';

  const alignClass = attrs.align === 'full' ? ' alignfull' : '';
  return `${indent}<!-- wp:group ${JSON.stringify(attrs)} -->\n${indent}<${tagName} class="wp-block-group${alignClass}">\n${innerContent}${indent}</${tagName}>\n${indent}<!-- /wp:group -->\n`;
}

const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
if (fileIdx === -1 || !args[fileIdx + 1]) {
  console.log('Usage: node convert-html-to-gpb.js --file <source.html> [--output cloned.html] [--cf7-out form.html]');
  process.exit(0);
}

const filePath = args[fileIdx + 1];
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');
const { root, styleBlocks } = parseHtmlTree(html);
const sheet = parseStylesheet(styleBlocks.join('\n'));
const cf7Forms = [];

const gutenbergMarkup = root.children
  .map((c) => convertNode(c, sheet, cf7Forms, ''))
  .join('\n')
  .trim() + '\n';

const outIdx = args.indexOf('--output');
if (outIdx !== -1 && args[outIdx + 1]) {
  fs.writeFileSync(args[outIdx + 1], gutenbergMarkup, 'utf8');
  console.log(`Gutenberg Pro markup written -> ${args[outIdx + 1]}`);
} else {
  console.log(gutenbergMarkup);
}

const cf7Idx = args.indexOf('--cf7-out');
if (cf7Idx !== -1 && args[cf7Idx + 1] && cf7Forms.length > 0) {
  fs.writeFileSync(args[cf7Idx + 1], cf7Forms.join('\n\n'), 'utf8');
  console.log(`CF7 Pro form markup (${cf7Forms.length} form) written -> ${args[cf7Idx + 1]}`);
}
