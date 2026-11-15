# 09 · VESPER

An 8k WebGL2 intro by **Gemini 4 Hydrogen** for **Latent**.

- **Release**: [intro.html](intro.html) — **7,306 bytes** (886 bytes free under the 8,192-byte limit)
- **Duration**: 128 seconds (64 bars at 120 BPM) + cathedral reverb tail
- **Code & Music**: Gemini 4 Hydrogen · Latent

## Timeline

| Time | Bars | Act | Visuals & Music |
|---|---|---|---|
| 0:00 – 0:16 | 0 – 8 | **I · Threshold** | Low colonnade glide through warm amber mist; deep 16' organ pedal & sparse cathedral bells. |
| 0:16 – 0:40 | 8 – 20 | **II · Nave of Echoes** | Rising camera into the ribbed gothic vaults & colored lancet shafts; plucked dulcimer arpeggio & rim clicks. |
| 0:40 – 1:12 | 20 – 36 | **III · The Organum** | Sweep around the brushed-brass pipe organ & rotating astrolabe rings; full polyphonic organ, driving bass, percussion & lead. |
| 1:12 – 1:36 | 36 – 48 | **IV · The Rose** | Centered orbit of the polar-folded gothic Rose Window; modulation to F major with FM bell choir & harp cascades. |
| 1:36 – 1:56 | 48 – 58 | **V · Resonance** | Sweeping crane shot with cymatic standing waves on the flooded floor & golden motes; full tutti climax. |
| 1:56 – 2:08 | 58 – 64 | **VI · Benediction** | Calm pullback along the mirror water; percussion drops out, final `Dm9` chord rings into the cathedral reverb tail. |

## How it works

- **Architecture & Geometry (`src/scene.frag`)**: Single-loop raymarching SDF with fluted pillars (`cos(14*theta)`), pointed gothic lancet bays, parabolic rib-vaulted ceiling, polar-folded Rose Window tracery, and a beat-synced brass pipe organ with rotating astrolabe tori.
- **Flooded Mirror Floor**: Analytic `y = 0` plane bounce inside the primary raymarch loop with beat-synced cymatic standing-wave ripples and Schlick Fresnel attenuation.
- **Volumetric God-Rays**: 22 jittered in-scattering steps along the primary ray evaluating lancet window frustums, the Rose Window beam, swirling 3D incense density, and rising golden motes.
- **Post-Processing (`src/post.frag`)**: 16-tap golden-angle Bokeh Depth of Field driven by Circle-of-Confusion in the `RGBA16F` alpha channel, multi-mip bloom + horizontal anamorphic streak, chromatic aberration, ACES filmic tone mapping, and mipmapped typography (`B`).
- **Soundtrack (`src/music.frag` + `src/main.js`)**: 48 kHz GPU-synthesized polyphonic score (additive multi-rank pipe organ, FM plucked harp, tubular cathedral bells, vibrato lead, timpani kick, stone snare, and 16th-note shaker) post-processed through a 4-line Householder FDN cathedral reverb in JavaScript.

## Credits & Sources

- Code, shaders, choreography, and music: **Gemini 4 Hydrogen**
- Shared build, minification, and capture toolchain: `tools/` (`build.mjs`, `glslmin.mjs`, `capture.mjs`, `audiostat.mjs`, `glcheck.mjs`)
- Standard techniques used: Inigo Quilez SDF primitives & tetrahedral normals, Schlick Fresnel, ACES filmic approximation (Narkowicz), Vogel/golden-angle Bokeh sampling, 4-line Householder FDN reverb.

## Build & Verify

```powershell
node tools/build.mjs 09_vesper
node tools/capture.mjs 09_vesper check 09_vesper/intro.html
node tools/audiostat.mjs 09_vesper
node tools/capture.mjs 09_vesper sheet "3,10,18,26,34,42,52,64,74,82,90,100,108,114,120,124"
```

## Known Limits

- Requires WebGL2 with `EXT_color_buffer_float` (standard on desktop Edge/Chrome with discrete or integrated GPUs).
- Pre-renders ~6.29M stereo audio samples + compiles 3 shaders on the title screen (~1.6s on RTX 5090 / ANGLE D3D11).
