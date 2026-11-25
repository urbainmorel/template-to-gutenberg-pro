---
name: template-to-gutenberg-pro
description: >
  Use when cloning or converting any website template (from an HTML/CSS/Tailwind file,
  a screenshot/image, or a screen-recording video) pixel-for-pixel and animation-for-animation
  into pure WordPress Gutenberg core blocks enhanced with Gutenberg Pro Blocks (gpb v3.1)
  and CF7 Pro Suite (cf7p v1.3), with optional direct deployment via WordPress MCP Adapter.
---

# Pixel-Perfect Template-to-Gutenberg Pro Cloner

Convert any **HTML/CSS/Tailwind file**, **Screenshot/Image**, or **Screen-Recording Video** into **100% pure WordPress Gutenberg core blocks (`<!-- wp:... -->`)** + **`gpb` Pro attributes** + **`cf7-pro-suite` forms** without ever simplifying, summarizing, or losing micro-details.

**Mandatory Companion Skills:**
- `gutenberg-block-authoring` (core Gutenberg grammar + `gpb` v3.1 schema + `validate-blocks.js`)
- `cf7-pro-authoring` (Contact Form 7 Pro forms + `validate-cf7.js`)

---

## Strict Anti-Simplification Rules

1. **NEVER summarize or omit sections.** Every section, card, pill badge, decorative ambient glow, divider, floating element, and footer column in the source MUST be reproduced.
2. **NEVER flatten Z-axis layers.** If a hero has a radial glow orb behind a glass card (`position: absolute; zIndex: 0; filter: blur(80px)`), emit a dedicated nested `wp:group` for that decorative layer inside a `position: relative` parent.
3. **NEVER invent placeholder copy** if exact text is visible in the HTML, image, or video. Copy visible copy verbatim; only translate or adapt if explicitly requested.
4. **ALWAYS validate before finishing.** Run `validate-blocks.js` (and `validate-cf7.js` if a `<form>` was converted) and generate a visual preview via `scripts/render-gpb-preview.js` when inspecting pixel fidelity.

---

## 5-Phase Cloning Protocol

### Phase 1: Source Extraction (Choose by Input Type)

#### A. If Input is an HTML / CSS / Tailwind File
Run the built-in extractor first:
```bash
node scripts/extract-template-spec.js --file source-template.html --json
```
Extract every exact hex/rgba color, `linear-gradient`/`radial-gradient`, font size (`clamp()`), border-radius, `backdrop-filter`, `box-shadow`, `@keyframes`, and `@media` breakpoint.

#### B. If Input is an Image / Screenshot
Perform a **4-Layer Visual Audit** before writing a single block:
1. **Background & Atmosphere Layer**: Page background color/gradient, radial light spots, noise/grid overlays.
2. **Layout & Grid Geometry**: Exact column counts (`gridTemplateColumns`), asymmetric spans (`gridColumn: "span 2"`), container `maxWidth`, section vertical `padding`, and card `gap`.
3. **Typography & Surface Tokens**: H1–H4 scale, `letterSpacing`, text gradients (`textGradient`), Glassmorphism (`blur`, `bg`, `1px solid rgba(...)`), and exact `borderRadius`.
4. **Micro-Details**: Floating badges, icons (use crisp inline SVG or clean semantic icons — never cliché icons), status dots, and button shadows.

#### C. If Input is a Video / Screen Recording
Perform a **Frame-by-Frame Choreography Audit** (see `references/video-motion-mapping.md`):
- Header behavior on scroll -> `gpb.interactive.type = "sticky-header"` (`scrollOffset`, `hideOnScrollDown`, `scrolledBg`, `scrolledBlur`)
- Card/section entrance -> `gpb.animation` (`fade-up`, `blur-in`, `flip-up`, `rotate-3d`, `duration`, `stagger`)
- Scroll depth movement -> `gpb.animation.parallax`
- Cursor-tracking card tilt + shine -> `gpb.interactive.type = "tilt3d"` (`maxTilt`, `glare: true`)
- Magnetic CTA pull -> `gpb.interactive.type = "magnetic"`
- Infinite logo/text strip -> `gpb.interactive.type = "marquee"`
- Interactive tabs, accordions, sliders, counters, before/after, off-canvas drawers -> matching `gpb.interactive.type`

---

### Phase 2: 1:1 Structural Block Mapping

| Source Element | Pure Gutenberg + Pro Equivalent |
| :--- | :--- |
| `<header>` / Navbar | `wp:template-part` or `wp:group {"tagName":"header","gpb":{"interactive":{"type":"sticky-header",...}}}` |
| `<section>` / Wrapper `<div>` | `wp:group {"tagName":"section","align":"full","gpb":{"desktop":{...},"tablet":{...},"mobile":{...}}}` |
| CSS Grid / Bento Grid | `wp:group {"gpb":{"desktop":{"display":"grid","gridTemplateColumns":"repeat(3,minmax(0,1fr))","gap":"24px"},"mobile":{"gridTemplateColumns":"1fr"}},"layout":{"type":"default"}}` |
| `<h1>`..`<h6>` | `wp:heading {"level":N,"gpb":{...}}` (`<hN class="wp-block-heading">...</hN>`) |
| `<p>` | `wp:paragraph {"gpb":{...}}` (**NO** `wp-block-paragraph` class on `<p>`) |
| `<a>` CTA / Button | `wp:buttons` > `wp:button {"gpb":{"hover":{...}}}` (`wp-block-button__link wp-element-button`) |
| `<img>` | `wp:image {"gpb":{...}}` (`<figure class="wp-block-image"><img src="..." alt="..."/></figure>`) |
| `<form>` (Contact, Quote, Booking) | `cf7-pro-suite` markup inside `wp:shortcode` (`[contact-form-7 id="..."]`) wrapped in a styled `wp:group` |

---

### Phase 3: Exact Responsive, Glassmorphism & 3D Translation
- Put desktop rules (`>1024px`) in `gpb.desktop`, tablet (`<=1024px`) in `gpb.tablet`, and mobile (`<=767px`) in `gpb.mobile`.
- Use `gpb.glass` for frosted glass surfaces (`blur`, `saturate`, `bg`, `border`, `shadow`).
- Use `gpb.hover` for hover micro-interactions (`translateY`, `scale`, `rotate`, `rotateX`, `rotateY`, `boxShadow`, `borderColor`, `transition`).
- Use `gpb.customCss` with `&` when styling nested child tags (e.g. `"&:hover img{transform:scale(1.06)}"`).
- See `references/tailwind-to-gpb-map.md` for direct Tailwind -> GPB JSON conversions.

---

### Phase 4: Multi-Validator & Visual Preview QA Loop

1. **Validate Gutenberg markup**:
   ```bash
   node <path-to-gutenberg-block-authoring>/scripts/validate-blocks.js --file cloned-page.html
   ```
2. **Validate any CF7 Pro form** (if the template had a form):
   ```bash
   node <path-to-cf7-pro-authoring>/scripts/validate-cf7.js --file cloned-form.html
   ```
3. **Render standalone preview** to visually compare against the target image/video/HTML:
   ```bash
   node scripts/render-gpb-preview.js --input cloned-page.html --output preview.html
   ```
4. **Optional Direct Deployment via WordPress MCP Adapter**:
   - Deploy pages directly via `gpb/upsert-page`
   - Deploy custom FSE headers/footers via `gpb/upsert-template-part`
   - Deploy forms via `cf7p/upsert-form`
