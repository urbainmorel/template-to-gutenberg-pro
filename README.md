# Template to Gutenberg Pro (`template-to-gutenberg-pro` v2.0.0)

**100% Free & Open-Source (`v2.0.0`)** (`MIT` + `GPL-2.0-or-later`) — High-Precision Universal AI Agent Skill & AST Compiler Suite for cloning **any HTML/Tailwind template, screenshot/image, or screen-recording video** pixel-for-pixel and animation-for-animation into **pure WordPress Gutenberg blocks** powered by [`gutenberg-pro-blocks`](https://github.com/urbainmorel/gutenberg-pro-blocks) and [`cf7-pro-suite`](https://github.com/urbainmorel/cf7-pro-suite).

---

## Precision CLI Suite (`v2.0.0`)

| Tool | Purpose |
| :--- | :--- |
| **`extract-template-spec.js`** | Stack-based HTML DOM + CSS Stylesheet + `:root` variable resolver + Tailwind v3/v4 token extractor |
| **`convert-html-to-gpb.js`** | Deterministic HTML/CSS/Tailwind -> pure WordPress 7.0 Gutenberg Pro + CF7 Pro compiler |
| **`audit-pixel-fidelity.js`** | Automated 0–100% Fidelity Auditor (section coverage, verbatim headings/CTAs, color tokens, responsive parity, Gutenberg integrity) |
| **`render-gpb-preview.js`** | Sequential nested block compiler producing a standalone `preview.html` with Google Fonts & **Onion-Skin Reference Diff Toolbar** (`--reference`) |

---

## Quick Start: Install the Skill (Any Harness)

### Option 1: Universal CLI (`npx skills`)
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

## Example Precision Pipeline

```bash
# 1. Extract CSS variables, Tailwind tokens & sections
node skills/template-to-gutenberg-pro/scripts/extract-template-spec.js --file template.html --json

# 2. Deterministically convert HTML/Tailwind -> Pure Gutenberg Pro + CF7 Pro
node skills/template-to-gutenberg-pro/scripts/convert-html-to-gpb.js --file template.html --output cloned.html --cf7-out form.html

# 3. Audit Pixel Fidelity (0-100%)
node skills/template-to-gutenberg-pro/scripts/audit-pixel-fidelity.js --source template.html --target cloned.html

# 4. Render browser preview with optional screenshot onion-skin overlay
node skills/template-to-gutenberg-pro/scripts/render-gpb-preview.js --input cloned.html --output preview.html --reference screenshot.png
```

---

## Dual License (`MIT` AND `GPL-2.0-or-later`)

See [LICENSE](LICENSE), [LICENSE-MIT.txt](LICENSE-MIT.txt), and [LICENSE-GPL-2.0.txt](LICENSE-GPL-2.0.txt).
