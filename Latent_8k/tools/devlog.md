# tools devlog

Changes to the shared tools, newest first. See [readme.md](readme.md) for the
rules. Entries before 2026-11-15 (intro 06) were written afterwards from the
intros' readmes and project notes, so they are less exact.

## 2026-11-17 · intro 18 (Zugzwang) · Gemini 4 Argon

- No tool changes. Things other intros should know:
- Gotcha (D3D11 compile time vs. multi-object SDFs): calling a detailed piece
  SDF 12 times inside `map()` made ANGLE/D3D11 (`fxc`) take 51 seconds to
  compile because `fxc` inlines every call site (12 calls x 3 `map()` sites =
  36 copies). Precomputing the active hero object positions once per pixel in
  `main()` before the raymarch loop, selecting the single closest candidate via
  fast bounding cylinders (`dbBest`) inside `map()`, and evaluating the detailed
  SDF only once at the end of `map()` cut D3D11 compile time from 51 s to 3.9 s
  and saved ~1.8 kB of compressed size.
- Gotcha (second-closest bounding volume in single-site SDF selection): when
  evaluating only the closest candidate's detailed SDF, do NOT early-exit on
  `dbBest > 0.25` by returning `min(d, dbBest)` or clamp the return value of
  `map()` with `min(d, max(dbSec, 0.08))`. Both introduce hard discontinuities
  into `map()` along the bounding cylinder in empty space, which the soft-shadow
  raymarcher (`sh = min(sh, k * a / s)`) and AO probe sample as concentric
  stepped contour rings across nearby surfaces. Instead, return pure continuous
  `d` from `map()`, and pass `max(dbSec, 0.05)` via a side-channel global (`GD`)
  used only by the primary raymarch loop.
- Gotcha (shadow striping across variable-height grid cells): in a stepped grid
  where each cell `u = round(p.xz / 2.)` has its own height `tileH(u)`,
  evaluating only the current cell's box makes `map()` blind to a taller
  neighboring tile until a shadow ray physically crosses the cell boundary,
  causing discrete shadow steps to jump into or over the neighbor's wall and
  paint 18 alternating light/dark bands across adjacent surfaces. Evaluate the
  2x2 neighborhood `floor(p.xz / 2.) + vec2(i & 1, i >> 1)` in `map()` so the
  stepped terrain is a true continuous Euclidean SDF across all cell borders,
  and use Quilez's soft-shadow triangulation (`b = a*a/(2.*ph)`).
- Gotcha (dark terminator stripe from opposing warm backlight): adding warm sun
  color `SC * max(0., dot(n, -SD))` on backfaces while `dl = max(0., dot(n, SD))`
  is on frontfaces leaves a zero-energy valley right at the terminator
  (`dot(n, SD) = 0`) where only dark cool ambient `HZ` illuminates the surface,
  painting a dark vertical stripe down spheres and cylinders. Fold `bk` into the
  cool sky hemisphere ambient `HZ` instead.
- Gotcha (cell-border guard strip in repeated grids): in a `2.0 x 2.0` grid
  (`lc = p.xz - round(p.xz/2.)*2.`, where `lc` spans `[-1, 1]`), writing
  `g = min(.98 - abs(lc.x), .98 - abs(lc.y))` and disabling the cell-wall guard
  when `g < 0.` turns off the guard inside the `0.02`-wide border strip of
  EVERY internal cell (`0.98 < |lc| <= 1.0`), causing rays that land in that
  strip to jump `d = 1.5` units straight through the neighboring cell's object
  and slice it vertically along the cell plane. Use `1.01 - abs(lc)` so `g < 0.`
  only triggers outside the clamped grid.
- Camera personal-space clearance in domain-repeated scenes: when a low-angle
  camera moves inside a repeated grid of objects, a background cell object
  spawning `1.0–2.8` units in front of `ro` gets blurred by Bokeh DoF into a
  giant blob covering half the frame. Suppress cell objects within ~3 units of
  the camera (`if (length(id*cellSize - RO.xz) < 3.2) cKind = -1;`).
- Gotcha (tilting/toppling an object on a floor): pivoting a cylinder of radius
  `R` to the left (`-x`) around its right base edge (`+R`) swings the entire
  base and lower body downward below `y = 0` into the floor like a seesaw. Pivot
  around the edge in the direction of the fall (`-R`), and rotate the query
  point into the object's local space before evaluating its bounding cylinder
  so the bound tilts with the object.
- Gotcha (starfield diagonal tiling): `h1(floor(d.xy*N) + floor(d.z*N)*19.)`
  adds a scalar `floor(d.z*N)*19.` equally to both `.x` and `.y`, so stars
  repeat diagonally across `z`-slices in visible bands. Multiply `floor(d.z*N)`
  by an asymmetric `vec2(17.3, 31.7)`.
- Size coding with `glslmin.mjs`: `glslmin.mjs` assigns 1-character names
  (`a..z`, `A..Z`, 52 total) globally across the file by token frequency, not
  per function scope, and keeps all GLSL built-in names (`smoothstep`,
  `length`, `vec3`) verbatim. Reusing the same short local variable names
  (`a,b,c,d,e,f,g,h,n,q,r,s,u,v,w`) across functions keeps every identifier in
  the 1-character pool and improves Zopfli repetition.

## 2026-11-17 · intro 17 (Supercell) · GLM 5.3

- No tool changes. The intro's own debug helper lives in
  `17_supercell/wip/` (raw scene-FBO dump + pixel-statistics scripts).
  Things other intros should know:
- Gotcha: a density band written as `sat(1.-(q.y-yb)/w)` is a HALF-SPACE, not
  a slab - it is 1 for every point BELOW yb, so the camera and half the world
  sit "inside the cloud" and transmittance collapses to ~0 everywhere. A slab
  needs `sat(1.-abs(q.y-center)/w)`. Symptom to recognise: flat dim frames
  with no black and no bright pixels anywhere, and the hero subject missing.
  Fastest diagnosis: dump the raw scene FBO (before post) and print
  transmittance/bright-pixel bbox directly; a small puppeteer script that
  writes shader debug values into RGB and reads the FBO back is worth its
  40 lines (see `17_supercell/wip/scenedump.mjs`).
- Gotcha: `glslmin` corrupts hex and large integer literals (`0x7fffffff`
  becomes `0 O`, `1376312589` becomes `137****2589`), and the broken source
  then only fails in the minified dev build. Use the uint hash style of
  `10_geode` (`747796405u` etc.) for audio noise; glcheck the MINIFIED
  output, not only the source.
- Gotcha: aerial perspective fog that mixes toward `sky(rd)` inherits the
  sun-glow cone - when the camera faces the sun, every ground pixel fogs
  toward a blown gold value. Gate the glow below the horizon
  (`*sat(rd.y*6.+.2)`, the sun's disc stays, the scattered term dies).
- Gotcha: the borrowed post-shader's 12-tap DOF blur REPLACES the base pixel
  (`c` starts at 0 and the taps average to it). Pre-initialising `c` with the
  base pixel adds it twice and blows the frame ~2x; the bug hides behind
  "just an exposure problem" for several rounds.
- Gotcha: a volumetric interior renders an opaque surface at ~the full
  per-sample light value. Any ambient/rim term you add must already be at
  the brightness you want the SURFACE to read at - a .9-amplitude "sunset
  rim" turned the whole anvil underside into a blown sheet.
- Gotcha: a 1-pixel feature (a lightning bolt) must not drive the DOF radius
  in the alpha channel: a mip-blur of radius >1 px dissolves it into a dim
  smear. Keep bolts out of the alpha; let the compact bloom loop give the
  halo instead.
- Gotcha: the ray-cylinder quadratic for thin vertical objects (poles) needs
  `rel = ro - pole`, not `pole - ro`; with the wrong sign t comes out
  negative, no hit ever passes `t>0`, and the object simply never renders.
  Verify thin geometry with a per-column min-luminance scan of a 1080p
  still, not with block-averaged contact-sheet cells.
- The vision-backend-down fallback in numbers: per-still statistics (mean RGB
  per third, blown/black counts, bright-pixel centroid+bbox), dark-vertical-
  line detection for poles/bolts, ASCII colour maps whose hue classes only
  apply above lum ~.42 (below that everything reads "warm" and misleads),
  and Goertzel-free mix checks via audiostat zero-crossings. This found every
  real bug in the build; state plainly in the readme that no frame was
  eyeballed.
- Python replication of `fract(sin(x*127.1)...)` does NOT predict the GPU for
  large args (float32 sin at 4e4 rad drifts from double). Do not hand-compute
  hash-driven positions (bolt landing spots) and trust them; design so any
  hash outcome stays in frame, or read the positions back from the GPU.

## 2026-11-17 · intro 16 (Afterglow) · DeepSeek V4-Pro

- No tool changes. Things other intros should know:
- Gotcha: `exp(-(br-START)*k)` only decays after START; before START the
  argument is positive and overflows to inf at br=0 when `k*START>~88` (here
  START=47, k=2.2), and `inf * gate(=0)` is NaN across the whole track. Clamp
  with `exp(-max(0.,br-START)*k)` before multiplying by the gate.
- Gotcha: a spherical "shell" added by closest-approach-to-origin
  (`hd=length(cross(ro,rd))`) goes dark the moment the camera is inside the
  shell (it is then behind the ray, hd~0). Keep the camera outside a raymarched
  solid ball, or key the glow on the angular radius `atan(Rg,D)`.
- Gotcha: a collapsing star whose corona thickness is not scaled by the collapse
  envelope leaves a big atmosphere after the surface has shrunk, so the
  "implosion" reads bright, not dark. Scale the corona with the same envelope as
  the radius.
- A star is limb-darkened, not limb-brightened: shade
  `(.55+.45*dot(n,-rd))`. A reversed term reads as a ring.
- When the vision review backend is down, verify the arc numerically: mean RGB
  per beat, the centroid of bright pixels (framing), and per-band Goertzel
  energy of the soundtrack over 12 s windows. These catch over-exposure,
  off-centre framing and a bottom-heavy mix that peak/RMS alone miss. Say
  plainly in the readme that the frames were not eyeballed.

## 2026-11-16 · intro 15 (Gather) · Grok 4.7

- No tool changes. Things other intros should know:
- A glowing subject with the post glow left at the default reads as a
  blob of light, not as an object. Pull the mip glow down (here 0.012)
  and judge the shape before adding bloom back.
- A camera at distance 2 with a subject of radius 0.5 makes a dot on a
  960x540 sheet. Put the camera inside one subject-radius of the surface
  or the contact sheet cannot tell you whether the form works.
- An interior heat march (step inside the surface, sum where the distance
  is negative) sells "hot glass" far better than a fresnel mirror of a
  black room, which reads as metal.

## 2026-11-16 · intro 13 (Sounding) · DeepSeek V4.1 Flash

- No tool changes. Things other intros should know:
- Gotcha: a silhouette shape drawn as a screen-space cut-out (half-plane
  intersections, no depth field) has no waterline or floor of its own. The
  lighthouse shaft was bounded at `-q.y - 90.0` and painted a black column
  90 m below the sea, straight through its own reflection. Bound every cut-out
  at the surface it stands on.
- Gotcha: a halo sized in absolute angular terms swallows its own source. The
  lighthouse lens is ~14 px wide at 300 m; a halo with a 23 px radius made the
  lantern room an unreadable blob and the tower "a stick with a light on top".
  Give the wide terms small amplitudes and keep a hard core; a small bright
  thing on a near-black sky reads as bright through contrast, not size.
- Gotcha: a gaussian smaller than a pixel (`0.30 / d` for a distant point
  light) samples as a dot that flickers and mostly vanishes. Floor the angular
  radius at about one pixel's worth (here `max(0.30/d, 0.0011)`) and lift the
  far falloff to compensate for the light one pixel collects.
- Judging a night picture: `capture.mjs sheet` at 960x540 hides a lot, because
  a bright point is one or two pixels. Check the source of every light with a
  1080p `still` cropped 3x around it. Brightness on the sheet said "ok" while
  the tower head was a white disc.
- Mixing without ears, second lesson (the first is in intro 11): per-band
  FFT percentages on the rendered WAV (band energies over 12 s, not peak and
  RMS) found that 94 % of the energy sat below 500 Hz, that the pad's A3 was
  exactly on the cello tune, and that nothing at all was above 2 kHz. Moving
  the tune up an octave and adding one high noise layer fixed both. Peak/RMS
  and the spectrum picture had each looked acceptable on their own.
- A hand-written `check_frame.py` that mirrors the camera law drifts silently
  when the shader's camera changes, and then reports "11 of 16 frames have
  framing problems" on a cut that is fine. Keep the projection in the frame's
  own uv (divide by the aspect, as the ray construction does) and re-run it
  after every camera edit.

## 2026-11-16 · intro 14 (Remanence) · Claude Fable 5.2

- No tool changes. Things other intros should know:
- A black mirror in a black room is invisible. With only thin lamps to
  reflect, the fluid showed where it had spikes to catch a highlight, and the
  smooth ball and the ring were black on black for ten review rounds. What
  fixed it was not more lamps but a faint gradient on the wall (0.04, plus a
  soft halo around each tube): it gives every shape a silhouette and gives the
  mirror something to show between highlights. Give a reflective subject a
  low, smooth environment first and add the bright accents second.
- Gotcha: a glow whose colour is chosen per sector (`mod(b,3.)<1.?lime:white`)
  needs to reach zero at the sector borders, or the wall shows a hard-edged
  coloured panel. `pow(abs(sin(3.1416*b)),8.)` does, and needs no `fract`.
- Gotcha: a height field with tall thin cones, marched with its value divided
  by a slope bound, leaves rays on the flanks that run out of steps. Shading
  them as hits gives beaded, doubled silhouettes. Treat `d>.01` after the loop
  as a miss.
- A Gaussian bump raised to make a "column" reads as a hill. The cube of the
  same Gaussian (`f*f*f`) is narrow enough to read as a spire, for no extra
  code. Check the gap to what it reaches for in pixels on a still; the first
  three versions ended 300, 135 and 100 px short and "did not reach".
- The amplitude that reaches the scene (here the magnet strength 0.8) scales
  such terms; work out the real height from the envelope values at that bar
  before judging a constant.
- Two vision reviews of the same sheet can differ by 1.5 points. Compare the
  per-frame notes between rounds, not the score.
- Sync by sharing a table: the wobble rates of the bass (`float[8](4.,4.,8.,
  4.,4.,6.,8.,16.)`) are the same literal in `music.frag` and `scene.frag`.

## 2026-11-16 · intro 07 (Little Water Bear), bug fixes · Claude Fable 5.2

- No tool changes. Two bugs reported by the user after watching the intro:
- Gotcha: if a material is painted by position (`q.x>1.41` is the mouth, a
  small sphere is the eye highlight), the hit point must really be on the
  surface. A displacement like `d-.02*cos(p.x*12.6)` or a sheared domain makes
  the field steeper than 1; the march then lands a few hundredths inside, and
  the painted feature is cut along arcs that change with the camera distance.
  It looks like clipped geometry, only "sometimes". Scale that object's
  distance (here `*.8`) and put small painted features on the surface, not
  above it, if the surface moves (head bob).
- Scrolling a background to suggest the camera's own motion: the pattern must
  move against the travel. Do not judge the sign from stills; render two
  frames 0.04 s apart and measure the shift (a 20-line SAD script on
  `ffmpeg -f rawvideo` output is enough).
- A dense sweep (`capture.mjs sheet` every 0.4 s through the shots in
  question) found the cut mouth; sheets at 1.5 s spacing had missed it.

## 2026-11-16 · intro 12 (Murmuration) · Kimi K3

- No tool changes. Things other intros should know:
- Gotcha: if particles are sampled in coordinates rotated about the origin
  (`p.xz *= rot(T*w)`), a distant cloud slides around the camera as the angle
  grows and can leave the frame entirely mid-shot. Rotate around the cloud's
  own centre instead (`p.z += 24.; rot(); p.z -= 24.`).
- Gotcha: a moving dot drawn as the min distance to a few chained sample
  points reads as separate pips, never a streak. Use a real segment distance:
  project `rd - normalize(p0-ro)` onto `normalize(p1-ro)-normalize(p0-ro)` and
  measure the perpendicular term.
- Gotcha: a metaball crowd drawn as density·cell-hash shows a faint ring of
  its iso-boundary when the interior is sparse. Saturate the density steeply
  (`pow(sat((f-1.)*3.),1.5)`) and give the interior a strong continuous
  absorption term so the core goes silhouette-black; only the fringe should
  stay granular.
- Judging animal flocks: at 960x540 capture-sheet resolution individual birds
  alias into general dirt and read as film grit. Judge the mass on the sheet,
  the individuals on a 1080p `still`; they can disagree completely.
- Running `capture.mjs` from WSL through `powershell.exe -NoProfile -Command
  "cd D:\...; node tools/capture.mjs ..."` works fine (Windows Node 22 +
  Edge); do not pass `$env:TEMP`-style paths as the sheet output, relative
  paths inside the repo are safest.

## 2026-11-16 · intro 11 (Pas de Trois) · Claude Fable 5.2

- No tool changes. Things other intros should know:
- Gotcha: a distance field that mirrors a figure with `abs(p.x)` but poses the
  two halves differently (one leg forward, one back) is not continuous across
  the mirror plane. Rays stepped over the plane and cut slices out of the far
  leg. It only showed in a 3x crop of a still. Limit the march step to
  `abs(p.x) + 0.06` near such a figure (a second "guard" value next to the one
  for cell walls); do not put it into the returned distance, or occlusion and
  soft shadows darken along the plane.
- Gotcha: with one object per repeated cell, a guard of "distance to the cell
  wall + a little" makes rays that run along a wall crawl, and they run out of
  steps (shows as haze-coloured pixels). For rows and grids, step to the exact
  exit of the cell along the ray instead: `v=(sign(rd.xz)-cellPos)/rd.xz;
  step=min(d,min(v.x,v.y)+.02)`. Also drop the guard above the tallest object;
  a camera 23 units above a ring of dancers needed 185 steps without that.
- Gotcha: when choosing the nearest turn of a helix (or any repeated thin
  shape whose size changes from one copy to the next) by rounding, the field
  jumps halfway between two turns and rays tunnel through the tube. Test the
  turn below and the turn above and take the minimum.
- Gotcha: `step(44.,br)*exp((44.-br)*8.)` is `0*inf = NaN` before bar 44 and
  blacks out the frame (the same trap as in the entry for intro 07, here with a
  positive argument). Clamp the argument of `exp`.
- Colour: after gamma, an additive term of 0.1 (a floor that mirrors 10 % of a
  pale backdrop) turns a saturated red into salmon. For flat poster colours
  keep additive light below about 0.02 where the surface is seen head-on: weight
  reflections by a Fresnel term, and skip ACES (a plain `1-exp(-2c)` and gamma
  kept the primaries).
- `glslmin` output is fine with `for` bodies in braces, but GLSL does not allow
  the comma operator with a `void` function call (`a=..,U(..);`).
- Mix check without ears: dump the soundtrack of `dev.html` to a WAV (as
  `capture.mjs video` does) and run
  `ffmpeg -i m.wav -lavfi showspectrumpic=s=1900x900:scale=log:fscale=log:start=30:stop=12000 spec.png`.
  The picture showed at once that bass and kick drowned everything else, which
  the peak and RMS numbers of `audiostat.mjs` did not. A `spectrum` mode for
  `capture.mjs` would be a useful addition.
- Piping `capture.mjs ... sheet` into `Select-Object -First n` kills it early
  and leaves a `media/tmp*` folder behind. Filter with `Select-String` instead.
- Light effect that is cheap in bytes: three lamps a third of a turn apart
  with colours `0.2+0.4*vec3(k==0,k==1,k==2)` add up to white, so albedos are
  unchanged, but each shadow is tinted. With `0.1+0.8*...` white heads turned
  green on one side; 0.2+0.4 keeps surfaces neutral. Three shadow marches of 16
  steps cost less time than expected (2 ms per frame instead of 1.7).
- A horizontal "lens streak" from thresholded highlights (19 taps of a mip
  level) was tried and removed: on small highlights it looks like broken scan
  lines, not like a lens.
- Unexplained: the striped torso (`if(m==3.&&fract(q.y*9.)<.5)`) was in the
  shader from the start but rendered plain white until the lighting code after
  it was restructured; then the stripes appeared. No error, same GPU. If a
  material detail is missing, do not assume the code is wrong; check with
  `probe.mjs` whether the value reaches the branch.
- Two samples per pixel (a loop around the whole trace, offsets of a quarter
  pixel) cost about 60 bytes and doubled the frame time from 1 to 2 ms; for
  hard-edged graphics that is worth it.

## 2026-11-16 · intro 10 (Geode) · Claude Haiku 5.5

- No tool changes. Things other intros should know:
- Gotcha: a `sin`-based hash for audio noise (`fract(sin(n*12.9898)*43758.5)`)
  with `n = mod(sampleIndex, 1000)` repeats every 1000 samples, which is a 48 Hz
  buzz in the snare and hats. Use an integer hash on `uint(x)` instead, as in
  `10_geode/src/music.frag` (`hs()`).
- Gotcha: the first version of this intro was washed out. Lit surfaces with a
  strong fresnel and specular term, plus bloom and flashes, went almost white
  under ACES. Lowering the exposure to `aces(c * 0.95)`, the crystal emission to
  about 0.3 and the bloom to 0.06 fixed it. Judge the exposure on a contact sheet
  before anything else.
- Kaleidoscope burst in `post.frag`: fold the polar angle with
  `abs(mod(an, 2*sc) - sc)` (sc = pi/3) and blend it in with the cut's age. It is
  one line of extra work and reads well on a drop.

## 2026-11-15 · intro 07 (Little Water Bear) · Claude Fable 5.2

- No tool changes. Things other intros should know:
- `capture.mjs sheet` takes an output path as a fifth argument, so test sheets
  can go to a temporary folder instead of overwriting `media/contact_sheet.jpg`.
- Gotcha: a line that ends in `//DEV` is removed from the release as a whole.
  `const p = ..., t0 = performance.now(); //DEV` removed `p` too, and only the
  packed build failed. Always run `capture.mjs check` on `intro.html`.
- Gotcha: `step(0.,x)*exp(-x*30.)` is `0*inf = NaN` for very negative `x` and
  blacks out the frame. Clamp the argument of `exp` instead. A sheet whose
  frames report about 5 ms each is probably black (black PNGs encode fast).
- Compile time under Direct3D fell from 36 s to 4 s by giving `map()` three
  call sites instead of five (shadow, occlusion and thickness samples share one
  loop) and `env()` one instead of four (a loop with a non-constant bound).
- Gotcha: WebGL's default minification filter is `NEAREST_MIPMAP_LINEAR`, so
  `textureLod(B,p,3.5)` on the text texture (used as a soft shadow or glow
  behind captions) returns blocks of 8 to 16 pixels. One line fixes it after
  `generateMipmap`: `g.texParameteri(3553, 10241, 9987)`. Intros 01 to 04 had
  the same blocks behind their text; the line was added to them too and they
  were rebuilt (01: 6,116 bytes, 02: 6,958, 03: 8,174, 04: 6,772).
- The soundtrack can be post-processed in JavaScript after the read-back. A
  four-line feedback delay network reverb over 6.7 million samples costs about
  150 bytes and half a second.

## 2026-11-15 · intro 06 (Marginalia) · Claude Opus 5.5

- `capture.mjs`, mode `check`: the "ready" test now matches `click` in any case
  (`/CLICK/i`). Before, a title screen without an upper-case "CLICK" timed out
  after 120 s. Results for older intros do not change.
- Started this devlog and `readme.md`.
- Gotcha: in Windows PowerShell 5.1, `Set-Content -Encoding utf8` writes a byte
  order mark, and the shader then fails with `0:1: '?' : syntax error`. Write
  files with `[IO.File]::WriteAllText` or the editor instead.

## 2026-11 · intro 04 (Latent Space) · Claude Sonnet 5.5

- Added `glcheck.mjs`: compiles single shader files in Edge and prints the
  error log with the source's own line numbers.
- Gotcha: values passed from the scene shader to the post shader through the
  framebuffer must be clamped; the mip-chain blur spreads one huge or NaN pixel
  over the whole frame.

## 2026-11 · intro 02 (Extended Thinking) · Claude Fable 5.2

- No tool changes are recorded. Lesson for all intros: under ANGLE/D3D11, shader
  compile time grows with the number of `map()` call sites, because they are all
  inlined. Check the `init ... ms` line that `capture.mjs` prints.

## 2026-11 · intro 01 (Gradient Descent) · Claude Fable 5.2

- First versions of `build.mjs` (with the double-click bootstrap), `glslmin.mjs`,
  `capture.mjs`, `audiostat.mjs` and `probe.mjs`.
