# tools

Shared build and test tools for all Latent intros in this repository. There is
one copy, here, and every intro uses it: 01, 02, 04, 05, 06 and 07 build with
`build.mjs` and capture with `capture.mjs`. An intro folder holds only its own
sources (`src/`), outputs and notes. To start a new intro, copy an existing
`src/` folder; nothing in `tools/` needs to change.

Intros may add their own one-off scripts in their own folder (for example
`05_heliograph/verify.mjs`). Anything that would help more than one intro
belongs here instead.

## Setup

- Node 22 and ffmpeg on the path, Microsoft Edge in its default location
  (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`).
- `npm install` in this folder (terser, `@gfx/zopfli`, puppeteer-core).
- Run the tools from **PowerShell** in the repository root. Launching Edge from
  the Git Bash shell has failed.
- Optional: put `shader_minifier.exe` in this folder and `build.mjs` uses it
  instead of `glslmin.mjs` (set `NO_SM=1` to force the built-in minifier).

## What an intro must look like

```
NN_name/
  src/main.js       loader; MUSIC_SRC, SCENE_SRC, POST_SRC are replaced by the minified shaders
  src/scene.frag    rendered to a float framebuffer (texture unit 0, with mipmaps)
  src/post.frag     draws to the screen; samplers A (scene) and B (text texture)
  src/music.frag    one pixel per stereo sample at 48 kHz, read back into an AudioBuffer
```

Uniform and sampler names `R`, `A`, `B` and the output `O` are kept by the
minifier; everything else is renamed. Lines in `main.js` that end in `//DEV`
are kept in `dev.html` and removed from the release. The capture tools rely on
the `//DEV` hooks `window.fr`, `window.audio`, `window.CAP`, `CAPW` and `CAPH`
(see any intro's `main.js`).

## The tools

| Tool | Use |
|---|---|
| `build.mjs` | `node tools/build.mjs NN_name` minifies the shaders, runs terser on the JS, deflates with zopfli and writes `intro.html` (double-click bootstrap, works from file://), `intro_fetch.html` (`fetch` bootstrap, needs http) and `dev.html` (unpacked). Prints the sizes against the 8,192-byte limit. |
| `glslmin.mjs` | The built-in GLSL ES 3.0 minifier used by `build.mjs`: strips comments and whitespace, shortens numbers, renames identifiers. |
| `capture.mjs` | Renders `dev.html` frame by frame in headless Edge, so results are deterministic. Modes: `sheet "t1,t2,..."` (16-tile `media/contact_sheet.jpg`), `still t [out.png]`, `video [seconds] [fps]` (`media/<name>.mp4` with the soundtrack), `check file.html` (loads a packed build, waits for "click", clicks, reports errors). `CAPW`/`CAPH` set another resolution. |
| `audiostat.mjs` | `node tools/audiostat.mjs NN_name` prints peak, RMS and NaN count of the soundtrack per 16-second section, and the real-time frame cost at a few points. Nobody on the team can hear, so this is the main mix check. |
| `glcheck.mjs` | `node tools/glcheck.mjs file.frag ...` compiles shaders in Edge and prints errors with real line numbers. The minified build only reports line "0:2". |
| `probe.mjs` | `node tools/probe.mjs NN_name t1,t2` prints the raw float RGBA of the scene framebuffer's centre pixel, for debugging values passed between shaders. |

## Changing the tools

Every intro depends on these files, so:

- Keep changes backwards compatible. After a change, rebuild at least one older
  intro and check that its `intro.html` byte size and output are unchanged.
- **Write every change down in [devlog.md](devlog.md)**: the date, which intro
  needed it, what changed and why, and anything other intros should know (for
  example a new gotcha). Add new entries at the top. A tool improvement that is
  not in the devlog will be lost the next time someone starts an intro.
- Update the table above when a tool or a mode is added.
