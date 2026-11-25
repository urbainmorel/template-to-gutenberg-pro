---
name: template-to-gutenberg-pro
description: >
  Use when cloning or converting any website template (from an HTML/CSS/Tailwind file,
  a screenshot/image, or a screen-recording video) pixel-for-pixel and animation-for-animation
  into pure WordPress Gutenberg core blocks enhanced with Gutenberg Pro Blocks (gpb v3.1)
  and CF7 Pro Suite (cf7p v1.3), with optional direct deployment via WordPress MCP Adapter.
---

# Pixel-Perfect Template-to-Gutenberg Pro Cloner (`v2.0.0`)

Convert any **HTML/CSS/Tailwind file**, **Screenshot/Image**, or **Screen-Recording Video** into **100% pure WordPress Gutenberg core blocks (`<!-- wp:... -->`)** + **`gpb` Pro attributes** + **`cf7-pro-suite` forms** with deterministic precision and automated visual/fidelity verification.

**Mandatory Companion Skills:**
- `gutenberg-block-authoring` (WordPress 7.0 core grammar + `gpb` v3.1 schema + `validate-blocks.js`)
- `cf7-pro-authoring` (Contact Form 7 Pro forms + `validate-cf7.js`)

---

## Strict Anti-Simplification Rules

1. **NEVER summarize or omit sections.** Every section, card, pill badge, ambient radial glow, divider, floating element, and footer column in the source MUST be reproduced.
2. **NEVER flatten Z-axis layers.** Decorative background blurs/glows (`position: absolute; zIndex: 0`) must be explicit nested `wp:group` layers inside a `position: relative` parent.
3. **NEVER invent placeholder copy** when real copy is visible in the HTML, screenshot, or video.
4. **ALWAYS run the automated QA pipeline** (`audit-pixel-fidelity.js` + `validate-blocks.js` + `render-gpb-preview.js`) before finishing.

---

## Precision 5-Phase Cloning Pipeline

### Phase 1: Deterministic Extraction

#### A. From HTML / CSS / Tailwind Source
1. Run the deep AST token & Tailwind extractor:
   ```bash
   node scripts/extract-template-spec.js --file source-template.html --json
   ```
2. Generate an exact 1:1 structural & CSS baseline automatically with the AST compiler:
   ```bash
   node scripts/convert-html-to-gpb.js --file source-template.html --output cloned-page.html --cf7-out cloned-form.html
   ```
   Then polish layout structure (`wp:columns`, `wp:buttons` grouping, `gpb.animation`, `gpb.interactive`, `gpb.customCss`) while preserving every extracted color, font size, radius, glassmorphism, and breakpoint rule.

#### B. From Screenshot / Image
Follow **`references/visual-audit-checklist.md`** strictly:
- Calibrate 12-column / Bento grid proportions (`gridTemplateColumns`, `gridColumn: "span 2"`).
- Measure typographic scale (`H1:body` ratio, negative `letterSpacing`, `textGradient`).
- Reconstruct multi-layer shadows, `1px solid rgba(...)` hairlines, and ambient background orbs.

#### C. From Video / Screen Recording
Follow **`references/video-motion-mapping.md`** frame-by-frame to map every scroll reveal, stagger delay, parallax speed, 3D tilt (`tilt3d` + glare), magnetic pull (`magnetic`), sticky header behavior (`sticky-header`), and marquee/slider transition.

---

### Phase 2: Automated Pixel-Fidelity Audit & Gutenberg Validation

1. **Audit Pixel & Copy Fidelity** (target score **>= 95/100**):
   ```bash
   node scripts/audit-pixel-fidelity.js --source source-template.html --target cloned-page.html
   ```
2. **Validate Pure Gutenberg Serialization**:
   ```bash
   node <path-to-gutenberg-block-authoring>/scripts/validate-blocks.js --file cloned-page.html
   ```
3. **Validate Converted CF7 Pro Forms** (if any):
   ```bash
   node <path-to-cf7-pro-authoring>/scripts/validate-cf7.js --file cloned-form.html
   ```
4. **Render Standalone Visual Preview (with Optional Onion-Skin Reference Diff)**:
   ```bash
   node scripts/render-gpb-preview.js --input cloned-page.html --output preview.html --reference screenshot.png
   ```

---

### Phase 3: Optional Direct Deployment via WordPress MCP Adapter
- `gpb/upsert-template-part` -> deploy custom Headers & Footers (`wp_template_part`)
- `cf7p/upsert-form` -> deploy converted Contact Form 7 Pro forms
- `gpb/upsert-page` -> publish the cloned page directly into WordPress
