#!/usr/bin/env node
/**
 * End-to-end self-test for extract-template-spec.js and render-gpb-preview.js.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 't2gpb-'));
const srcHtmlPath = path.join(tmpDir, 'source.html');
const gpbHtmlPath = path.join(tmpDir, 'gpb.html');
const previewPath = path.join(tmpDir, 'preview.html');

fs.writeFileSync(
  srcHtmlPath,
  `<header class="sticky top-0 z-50 backdrop-blur-lg"><nav>Nav</nav></header>
   <section class="grid grid-cols-3 md:grid-cols-2 gap-6 p-8 rounded-3xl" style="background: radial-gradient(circle, #1e293b, #020617); color: #f8fafc;">
     <div class="col-span-2 hover:-translate-y-1.5">Card</div>
   </section>
   <form><input type="email" /></form>`,
  'utf8'
);

const extractScript = path.join(__dirname, '..', 'skills', 'template-to-gutenberg-pro', 'scripts', 'extract-template-spec.js');
const previewScript = path.join(__dirname, '..', 'skills', 'template-to-gutenberg-pro', 'scripts', 'render-gpb-preview.js');

const extractOut = execFileSync('node', [extractScript, '--file', srcHtmlPath, '--json'], { encoding: 'utf8' });
const spec = JSON.parse(extractOut);
assert(spec.sections.length === 4, 'Expected 4 semantic tags extracted');
assert(spec.tokens.gradients.length >= 1, 'Expected gradient extracted');

fs.writeFileSync(
  gpbHtmlPath,
  `<!-- wp:group {"gpb":{"desktop":{"padding":"32px","borderRadius":"24px"},"glass":{"blur":"16px","bg":"rgba(15,23,42,0.7)"},"hover":{"translateY":"-6px"}}} -->
<div class="wp-block-group">
<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">Cloned Hero</h2>
<!-- /wp:heading -->
</div>
<!-- /wp:group -->`,
  'utf8'
);

execFileSync('node', [previewScript, '--input', gpbHtmlPath, '--output', previewPath], { encoding: 'utf8' });
const previewHtml = fs.readFileSync(previewPath, 'utf8');
assert(previewHtml.includes('.gpb-'), 'Expected compiled .gpb-* selector in preview.html');
assert(previewHtml.includes('backdrop-filter:blur(16px)'), 'Expected compiled glassmorphism CSS');
assert(previewHtml.includes('translateY(-6px)'), 'Expected compiled hover CSS');

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('PASSED: extract-template-spec.js and render-gpb-preview.js verified successfully.');
