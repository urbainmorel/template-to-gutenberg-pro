# Template to Gutenberg Pro (`template-to-gutenberg-pro`)

**100% Free & Open-Source (`v1.0.0`)** (`MIT` + `GPL-2.0-or-later`) — Universal AI Agent Skill & CLI Suite for cloning **any HTML/Tailwind template, screenshot/image, or screen-recording video** pixel-for-pixel and animation-for-animation into **pure WordPress Gutenberg blocks** powered by [`gutenberg-pro-blocks`](https://github.com/urbainmorel/gutenberg-pro-blocks) and [`cf7-pro-suite`](https://github.com/urbainmorel/cf7-pro-suite).

---

## The Complete 3-Repo Open-Source WordPress Ecosystem

1. **[`gutenberg-pro-blocks`](https://github.com/urbainmorel/gutenberg-pro-blocks)** — Responsive Desktop/Tablet/Mobile CSS, 3D Tilt & Transforms, Glassmorphism, 15 Interactive Controllers, Server-Side Display Conditions & Dynamic Tags (ACF/WooCommerce), Visual Gutenberg Inspector, and MCP Adapter Abilities.
2. **[`cf7-pro-suite`](https://github.com/urbainmorel/cf7-pro-suite)** — Multi-Step Wizards, Conditional Logic (Client + Server), Live Calculators, 7 Smart Fields (International Phone with Cloudflare `HTTP_CF_IPCOUNTRY`, Digital Signature, Star Rating, Smart Date/Slots, Masks, Repeater, Toggle), Cloudflare Turnstile + Smart reCAPTCHA Optimizer, Local Entries CSV, Webhooks, and MCP Adapter Abilities.
3. **`template-to-gutenberg-pro` (This Repo)** — The AI Cloning Protocol & CLI tools (`extract-template-spec.js` + `render-gpb-preview.js`) that convert HTML, Images, or Videos into pure Gutenberg Pro + CF7 Pro markup without simplifying micro-details.

---

## Quick Start: Install the Skill (Any Harness)

### Option 1: Universal CLI (`npx skills`)
Works with **Antigravity, Claude Code, Codex, OpenCode, Cursor, Windsurf**:
```bash
npx skills add urbainmorel/template-to-gutenberg-pro
```

### Option 2: Automated Multi-Harness Installer

**Windows (PowerShell):**
```powershell
git clone https://github.com/urbainmorel/template-to-gutenberg-pro.git
cd template-to-gutenberg-pro
.\install.ps1
```

**macOS / Linux:**
```bash
git clone https://github.com/urbainmorel/template-to-gutenberg-pro.git
cd template-to-gutenberg-pro
chmod +x install.sh && ./install.sh
```

---

## Included CLI Tools

### 1. Design Token & Tailwind Extractor (`extract-template-spec.js`)
Extracts colors, gradients, fonts, blurs, `@keyframes`, Tailwind layout/hover/glass classes, and semantic sections from any HTML template:
```bash
node skills/template-to-gutenberg-pro/scripts/extract-template-spec.js --file template.html --json
```

### 2. Standalone Visual Preview Compiler (`render-gpb-preview.js`)
Compiles `<!-- wp:... {"gpb":{...}} -->` markup into a browser-ready `preview.html` to inspect pixel fidelity before pasting into WordPress or deploying via MCP Adapter:
```bash
node skills/template-to-gutenberg-pro/scripts/render-gpb-preview.js --input page.html --output preview.html
```

---

## Dual License (`MIT` AND `GPL-2.0-or-later`)

See [LICENSE](LICENSE), [LICENSE-MIT.txt](LICENSE-MIT.txt), and [LICENSE-GPL-2.0.txt](LICENSE-GPL-2.0.txt).
