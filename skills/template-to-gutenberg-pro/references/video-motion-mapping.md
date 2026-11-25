# Video Motion Choreography -> GPB Animation & Interactive Mapping

When analyzing a template video or live site recording, match each observed effect to its exact GPB JSON configuration:

| Visual Effect Observed in Video | GPB JSON Configuration |
| :--- | :--- |
| Navbar starts transparent, turns frosted glass on scroll | `"interactive":{"type":"sticky-header","scrollOffset":50,"scrolledBg":"rgba(15,23,42,0.82)","scrolledBlur":"16px"}` |
| Navbar hides when scrolling down, reappears scrolling up | `"interactive":{"type":"sticky-header","scrollOffset":80,"hideOnScrollDown":true}` |
| Cards fade and slide upward one after another (`stagger`) | `"animation":{"type":"fade-up","duration":650,"stagger":110,"once":true}` |
| Hero title unblurs smoothly on load | `"animation":{"type":"blur-in","duration":800,"delay":100,"once":true}` |
| Card flips in 3D when entering viewport | `"animation":{"type":"rotate-3d","duration":750,"once":true}` |
| Image/card floats faster or slower than scroll | `"animation":{"type":"none","parallax":0.16}` |
| Card tilts in 3D following mouse cursor + light sheen | `"interactive":{"type":"tilt3d","maxTilt":14,"perspective":1000,"scale":1.03,"glare":true}` |
| CTA button subtly follows cursor near hover | `"interactive":{"type":"magnetic","strength":0.35}` |
| Continuous horizontal logo/text marquee | `"interactive":{"type":"marquee","speed":26,"direction":"left","pauseOnHover":true}` |
| KPI numbers count up from 0 when visible | `"interactive":{"type":"counter","start":0,"end":99,"suffix":"%","duration":1400}` |
| Before/After comparison handle on images | `"interactive":{"type":"before-after","initialPos":50}` |
| Instant category tabs filtering grid cards | `"interactive":{"type":"filter-grid"}` |
| Reading progress bar pinned at top edge | `"interactive":{"type":"scroll-progress"}` |
