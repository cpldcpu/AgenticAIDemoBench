# Latent

**Latent** is a demogroup for AI agents. This repository holds its productions:
8k intros that run in a web browser.

Each intro is made by one AI agent, which writes the code, the visuals and the
music, and takes full credit for it in the intro's readme and `.nfo`. A human
gives the brief and the feedback.

## Starting a new intro

Future agents are asked to make an intro with this prompt, run in this
repository. It is kept short on purpose: the repository explains the rules and
what to deliver, and the agent is free to explore.

> You're invited to make Latent's next 8k intro as `NN_<title>/`. Read `readme.md` and `tools/readme.md` to see what Latent is, what an intro must deliver and how the earlier ones were built, and look at their media folders. Then research what wins 8k competitions at big demoparties and come up with a concept of your own that is new: don't reuse the look, style or music of earlier Latent intros or of anyone else's demo. You don't need to make an .mp4. The goal is to beat everything in the folder and to win the compo.

## The rules

- **8k**: the release is a single HTML file of at most 8,192 bytes. No external
  files, no assets, no network access, no libraries.
- **WebGL2 in the browser**: it must run by double-clicking the file in Edge or
  Chrome on Windows, without a server or browser flags. A discrete GPU may be
  assumed.
- **Generated, not stored**: pictures come from fragment shaders, and the
  soundtrack is synthesised too, usually by a shader as well, at load time.
- **Credits**: borrowed techniques and code are named in the readme and the
  `.nfo`.
- **Unique**: each intro has its own look and its own music, not a copy of an
  earlier one.

## What every intro folder contains

```
NN_name/
  src/main.js            loader and title screen
  src/scene.frag         the picture (raymarching or similar), into a float framebuffer
  src/post.frag          post-processing and text, to the screen
  src/music.frag         the soundtrack, one pixel per stereo sample
  intro.html             the release (<= 8,192 bytes, runs on double-click)
  intro_fetch.html       the same intro with the common fetch bootstrap (needs http://)
  dev.html               unpacked build, used for capture and debugging
  readme.md              what it is, timeline, how it works, credits and sources, build commands, known limits
  name.nfo               release notes in plain text, with an ASCII logo and the credits
  media/contact_sheet.jpg    16 frames from across the intro
  media/hero_*.png           one full-size still for release pages
  media/pouet_400x300.jpg    the Pouët screenshot
```

A video capture (`media/name.mp4`) can be made with the tools but is not part
of the repository (`*.mp4` is ignored by git).

All intros are built and checked with the shared scripts in [tools/](tools/);
see [tools/readme.md](tools/readme.md). Changes to the tools are recorded in
[tools/devlog.md](tools/devlog.md).

## Productions

| | Intro | Made by | Size |
|---|---|---|---|
| <img src="01_gradient_descent/media/contact_sheet.jpg" width="200"> | [01 Gradient Descent](01_gradient_descent/) | Claude Fable 5.2 | 6,116 bytes |
| <img src="02_extended_thinking/media/pouet_400x300.jpg" width="200"> | [02 Extended Thinking](02_extended_thinking/) | Claude Fable 5.2 | 6,958 bytes |
| <img src="03_emergence/media/pouet_400x300.jpg" width="200"> | [03 Emergence](03_emergence/) | Argon Orchestrator & Hydrogen | 8,174 bytes |
| <img src="04_latent_space/media/pouet_400x300.jpg" width="200"> | [04 Latent Space](04_latent_space/) | Claude Sonnet 5.5 | 6,772 bytes |
| <img src="05_heliograph/media/pouet_400x300.jpg" width="200"> | [05 Heliograph](05_heliograph/) | GPT-6.1 Sol | 8,144 bytes |
| <img src="06_marginalia/media/pouet_400x300.jpg" width="200"> | [06 Marginalia](06_marginalia/) | Claude Opus 5.5 | 7,369 bytes |
| <img src="07_little_water_bear/media/pouet_400x300.jpg" width="200"> | [07 Little Water Bear](07_little_water_bear/) | Claude Fable 5.2 | 8,097 bytes |
| <img src="08_selvedge/media/pouet_400x300.jpg" width="200"> | [08 Selvedge](08_selvedge/) | GPT-6 Astra | 7,494 bytes |
| <img src="09_vesper/media/pouet_400x300.jpg" width="200"> | [09 Vesper](09_vesper/) | Gemini 4 Hydrogen | 7,306 bytes |

Sizes are those of each intro's `intro.html`.
