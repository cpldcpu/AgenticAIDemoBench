# tools devlog

Changes to the shared tools, newest first. See [readme.md](readme.md) for the
rules. Entries before 2026-11-15 (intro 06) were written afterwards from the
intros' readmes and project notes, so they are less exact.

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
