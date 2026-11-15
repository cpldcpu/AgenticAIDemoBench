# tools devlog

Changes to the shared tools, newest first. See [readme.md](readme.md) for the
rules. Entries before 2026-11-15 (intro 06) were written afterwards from the
intros' readmes and project notes, so they are less exact.

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
