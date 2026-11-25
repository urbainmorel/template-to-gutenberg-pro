#!/usr/bin/env node
/**
 * End-to-end self-test for v2.0.0:
 * extract-template-spec -> convert-html-to-gpb -> validate-blocks.js (if available) ->
 * audit-pixel-fidelity -> render-gpb-preview.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 't2gpb-v2-'));
const srcHtmlPath = path.join(tmpDir, 'source.html');
const clonedPath = path.join(tmpDir, 'cloned.html');
const cf7OutPath = path.join(tmpDir, 'form.html');
const previewPath = path.join(tmpDir, 'preview.html');

fs.writeFileSync(
  srcHtmlPath,
  `<!DOCTYPE html><html><head>
   <style>
     :root { --accent: #38bdf8; --bg-dark: #020617; }
     .hero-title { background: linear-gradient(135deg, #ffffff 0%, var(--accent) 100%); -webkit-background-clip: text; color: transparent; }
     .glass-card { backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.14); }
     .glass-card:hover { box-shadow: 0 24px 48px rgba(56,189,248,0.25); }
     @media (max-width: 767px) { .hero-wrap { padding: 48px 16px; } }
   </style></head>
   <body>
     <header class="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/80"><a href="/">MonBrand</a></header>
     <section class="hero-wrap p-12 bg-slate-950 text-white">
       <h1 class="hero-title text-6xl">Clonage Pixel-Perfect</h1>
       <p class="text-slate-300">Reproduction exacte en blocs Gutenberg natifs.</p>
       <div class="grid grid-cols-3 md:grid-cols-2 gap-6">
         <div class="glass-card col-span-2 p-8 rounded-3xl hover:-translate-y-1.5">
           <h3>Carte Bento 3D</h3>
           <p>Design fidèle au pixel près.</p>
         </div>
       </div>
       <a href="#start" class="hover:scale-105">Démarrer</a>
       <form>
         <input type="text" name="nom" placeholder="Votre nom" required />
         <input type="email" name="email" placeholder="Email" required />
         <input type="tel" name="telephone" required />
         <button type="submit">Envoyer</button>
       </form>
     </section>
   </body></html>`,
  'utf8'
);

const scriptsDir = path.join(__dirname, '..', 'skills', 'template-to-gutenberg-pro', 'scripts');
const extractScript = path.join(scriptsDir, 'extract-template-spec.js');
const convertScript = path.join(scriptsDir, 'convert-html-to-gpb.js');
const auditScript = path.join(scriptsDir, 'audit-pixel-fidelity.js');
const previewScript = path.join(scriptsDir, 'render-gpb-preview.js');

// 1. Extract
const spec = JSON.parse(execFileSync('node', [extractScript, '--file', srcHtmlPath, '--json'], { encoding: 'utf8' }));
assert(spec.tokens.cssVariables['--accent'] === '#38bdf8', 'Expected :root CSS variable extracted');
assert(spec.sections.length === 2, 'Expected 2 sections (<header>, <section>)');
assert(spec.forms.length === 1 && spec.forms[0].inputs.length === 3, 'Expected 1 form with 3 inputs');

// 2. Convert HTML -> Pure Gutenberg Pro + CF7 Pro
execFileSync('node', [convertScript, '--file', srcHtmlPath, '--output', clonedPath, '--cf7-out', cf7OutPath], { encoding: 'utf8' });
const clonedMarkup = fs.readFileSync(clonedPath, 'utf8');
const cf7Markup = fs.readFileSync(cf7OutPath, 'utf8');
assert(clonedMarkup.includes('<!-- wp:group'), 'Expected wp:group output');
assert(clonedMarkup.includes('"textGradient":"linear-gradient(135deg, #ffffff 0%, #38bdf8 100%)"'), 'Expected resolved CSS var in textGradient');
assert(cf7Markup.includes('cf7p-smart-phone'), 'Expected Smart Phone CF7 Pro wrapper');

// 3. Validate against Gutenberg's official parser if installed globally
const gpbValidator = path.join(process.env.USERPROFILE || '', '.gemini', 'config', 'skills', 'gutenberg-block-authoring', 'scripts', 'validate-blocks.js');
if (fs.existsSync(gpbValidator)) {
  const valOut = execFileSync('node', [gpbValidator, '--file', clonedPath], { encoding: 'utf8' });
  assert(valOut.includes('PASSED: All blocks valid'), 'Expected validate-blocks.js to pass with 0 errors');
}

// 4. Pixel Fidelity Audit
const auditReport = JSON.parse(execFileSync('node', [auditScript, '--source', srcHtmlPath, '--target', clonedPath, '--json'], { encoding: 'utf8' }));
assert(auditReport.score >= 90, `Expected fidelity score >= 90, got ${auditReport.score}`);
assert(auditReport.gutenbergIntegrity.balancedDelimiters === true, 'Expected balanced delimiters');

// 5. Render Visual Preview
execFileSync('node', [previewScript, '--input', clonedPath, '--output', previewPath, '--reference', 'shot.png'], { encoding: 'utf8' });
const previewHtml = fs.readFileSync(previewPath, 'utf8');
assert(previewHtml.includes('backdrop-filter:blur(18px)'), 'Expected compiled glassmorphism in preview');
assert(previewHtml.includes('gpb-qa-bar'), 'Expected QA reference diff toolbar in preview');

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`PASSED: Full v2.0.0 precision pipeline verified (Fidelity Score: ${auditReport.score}/100).`);
