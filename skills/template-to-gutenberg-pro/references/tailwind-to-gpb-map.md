# Tailwind CSS & Modern CSS to GPB JSON Mapping Guide

| Tailwind / CSS Pattern | Exact GPB JSON Equivalent |
| :--- | :--- |
| `grid grid-cols-3 md:grid-cols-2 gap-6` | `"desktop":{"display":"grid","gridTemplateColumns":"repeat(3,minmax(0,1fr))","gap":"24px"},"tablet":{"gridTemplateColumns":"repeat(2,minmax(0,1fr))"},"mobile":{"gridTemplateColumns":"1fr"}` |
| `col-span-2` | `"desktop":{"gridColumn":"span 2"},"mobile":{"gridColumn":"span 1"}` |
| `p-8 md:p-6 sm:p-4` | `"desktop":{"padding":"32px"},"tablet":{"padding":"24px"},"mobile":{"padding":"16px"}` |
| `rounded-3xl border border-white/15` | `"desktop":{"borderRadius":"24px","border":"1px solid rgba(255,255,255,0.15)"}` |
| `backdrop-blur-xl bg-slate-900/60 shadow-2xl` | `"glass":{"blur":"24px","bg":"rgba(15,23,42,0.6)","border":"1px solid rgba(255,255,255,0.14)","shadow":"0 25px 50px -12px rgba(0,0,0,0.45)"}` |
| `bg-gradient-to-r from-white to-sky-400 bg-clip-text text-transparent` | `"desktop":{"textGradient":"linear-gradient(90deg,#ffffff 0%,#38bdf8 100%)"}` |
| `hover:-translate-y-1.5 hover:scale-105 transition-all duration-300` | `"hover":{"translateY":"-6px","scale":1.05,"transition":"all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"}` |
| `sticky top-0 z-50` | `"desktop":{"position":"sticky","top":"0px","zIndex":50}` |
| `hidden md:block` | `"desktop":{"display":"block"},"mobile":{"hide":true}` |
| `perspective-[1200px] preserve-3d` | `"desktop":{"perspective":"1200px","transformStyle":"preserve-3d"}` |
| Ambient Glow Orb (`absolute -top-24 left-1/2 blur-3xl opacity-40`) | `"desktop":{"position":"absolute","top":"-96px","left":"50%","transform":"translateX(-50%)","width":"520px","height":"520px","borderRadius":"9999px","background":"radial-gradient(circle,rgba(56,189,248,0.35),transparent 70%)","filter":"blur(60px)","pointerEvents":"none","zIndex":0}` |
