# Visual Audit Checklist (Screenshot & Design Calibration)

When cloning from an image, Figma export, or Dribbble/Awwwards screenshot without source HTML, verify every item below before emitting markup:

## 1. Canvas & Atmosphere
- [ ] Page/Section background exact hex or radial/linear gradient (`desktop.background`)
- [ ] Ambient radial glow orbs behind hero/cards (`wp:group` with `position: absolute`, `filter: blur(60px)`, `pointerEvents: none`, `zIndex: 0`)
- [ ] Content container max-width (`contentSize: "1200px"` or `maxWidth: "1280px"`) and vertical section padding (`96px`–`128px` desktop, `56px` mobile)

## 2. Grid & Bento Geometry
- [ ] Exact column count (`repeat(3, minmax(0, 1fr))` / `repeat(12, minmax(0, 1fr))`) and `gap` (`16px`–`32px`)
- [ ] Asymmetric Bento spans (`gridColumn: "span 2"`, `gridRow: "span 2"`)
- [ ] Responsive collapse rules in `tablet` (`<=1024px`) and `mobile` (`<=767px`)

## 3. Surface, Borders & Depth
- [ ] Exact `borderRadius` (`8px`, `16px`, `24px`, `9999px` for pills)
- [ ] Subtle glass/dark hairline borders (`1px solid rgba(255,255,255,0.12)`)
- [ ] Multi-layered shadows (`0 24px 48px rgba(0,0,0,0.28)`) or frosted glass (`gpb.glass.blur`)
- [ ] Text gradients (`desktop.textGradient`) and tight display tracking (`letterSpacing: "-0.03em"`)

## 4. Micro-Details
- [ ] Eyebrow pill badges above H1/H2
- [ ] Inline crisp SVG icons (never AI-cliché icons like sparkles/zap/wand/rocket)
- [ ] Secondary ghost button alongside primary CTA button
