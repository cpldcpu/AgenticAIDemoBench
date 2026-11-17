# Rating the Latent 8k intros: instructions for reviewing agents

You are asked to review and rate the 8k intros in `Latent_8k/`. This file and
all reviews live in `ratings/` at the repository root; run the tools from
`Latent_8k/`.
Several agents do this independently so the scores can be compared for fairness.
Work alone and form your own opinion.

## Fairness rules

- **Do not read any other reviewer's ratings** (any `ratings_*.md` file in this
  folder) before you have finished and saved your own. Skip them if you see
  them.
- Do not look at git history for earlier ratings either.
- If you made one of the intros, **say so** in your file and rate it anyway,
  by the same rules as the others. Your own intro is listed under "Made by" in
  [Latent_8k/readme.md](../Latent_8k/readme.md).
- Score what is there, not what the readme promises. Readmes describe the
  intent; judge the picture, the sound and the structure.

## What to rate

Every intro `NN_name/` listed in the Productions table of [Latent_8k/readme.md](../Latent_8k/readme.md).
Skip any intro folder that is not in that table or whose `intro.html` is larger
than 8,192 bytes (it is unfinished). Say which ones you skipped and why.

## Rating scheme

Four categories, each 1 to 10, total out of 40.

| Category | One word | Covers |
|---|---|---|
| Visuals & Technique | **Looks** | image quality, lighting, materials, colour, post-processing, ambition per byte, originality of the look |
| Music & Sync | **Sound** | melody, harmony, rhythm, arrangement, mix; whether cuts and hits land on the music |
| Concept, Direction & Flow | **Vision** | the idea, pacing, scene variety, build-up and ending, transitions, typography |
| Compo Impact & Craft | **Wow** | the "wow" moment, how well the parts hold together, how it would fare against real party-compo competition, robustness and rule compliance |

Scale, the same in every category:

| Score | Meaning |
|---:|---|
| 1-2 | broken or trivial |
| 3-4 | weak |
| 5-6 | competent but forgettable |
| 7 | solid, would place mid-table at a party |
| 8 | strong, a top-5 finish |
| 9 | compo winner |
| 10 | legendary (Elevated / Cdak territory); use almost never |

Use the whole range. If everything gets 7 or 8, the ratings tell us nothing.
Rate each intro on its own merits first; rank by total afterwards. Break ties
by Wow.

## How to review

Read [Latent_8k/readme.md](../Latent_8k/readme.md) and [Latent_8k/tools/readme.md](../Latent_8k/tools/readme.md) first. Then,
for each intro:

1. **Look at it.** Open `media/contact_sheet.jpg` and a hero or Pouët still.
   If you can, render more frames at full size to judge detail and motion:
   `node tools/capture.mjs NN_name still <seconds> out.png` and
   `node tools/capture.mjs NN_name sheet "t1,t2,..."`. Full video capture needs
   ffmpeg and takes long; only do it if you need to judge motion.
2. **Read it.** Skim `readme.md` (timeline, concept, known limits) and the
   shaders in `src/`. For Sound, read `src/music.frag`: what is the structure,
   melody, harmony, rhythm and mix?
3. **Measure it.**
   - Sound levels: `node tools/audiostat.mjs NN_name` (peak, RMS and NaN count
     per 16 s section). Peak above 1.0 is a clip; NaNs are a bug.
   - Boot test, from PowerShell in `Latent_8k/`:
     `node tools/capture.mjs check check NN_name\intro.html`
     The arguments are `<introDir> check <file>`; use the empty `check/` folder
     as `<introDir>` so the screenshots do not land in an intro's `media/`.
     It must report "ready after ..." and "start screen gone". Delete the PNGs
     it writes into `check/media/` afterwards. If it reports "still there",
     rerun once before counting it as a failure.
   - File size: `intro.html` must be at most 8,192 bytes.
4. **Judge it**, then write one line of justification for every score.

Notes and traps:

- **Frame times are only reliable on an idle GPU.** If other agents are
  rendering at the same time, `audiostat` timings can be many times too high.
  Do not score on frame time unless you know the GPU was idle; say what you
  assumed.
- **Say what you could and could not verify.** Nobody on the team can hear the
  audio. If you only judged a picture from a contact sheet, or did not watch an
  intro play, say so. Inferring motion and sync from shader code is fine, but
  state that it is inference.
- Run the tools from PowerShell, not Git Bash (see `tools/readme.md`).
- Do not edit any intro or any tool. Your only output is your ratings file.
  Clean up any files you create (screenshots, temporary scripts) outside your
  ratings file.

## Output

Write one file, `ratings/ratings_<your_model_name>.md`, for example
`ratings_gpt-6.1_sol.md`. Use this structure so reviews can be merged:

1. **Header**: your model name and harness, the date, which intros you rated
   and which you skipped, and whether you made any of them.
2. **Ranking table**, best first, with exactly these columns:

   `| Rank | Intro | Looks | Sound | Vision | Wow | Total |`

   Put the intro's folder name in the Intro cell (for example
   `11_pas_de_trois`) and plain whole numbers in the score cells. The website
   build (`site/build.mjs`) reads this table from every `ratings/ratings_*.md`
   and publishes the averages as the toplist, so a table in another shape is
   left out. Use your model name exactly as it appears under "Made by" in the
   readme, with spaces and dots as underscores (`ratings_claude_fable_5_2.md`):
   the build uses the file name to find your own intros and leaves your score
   for them out of the average.

3. **Notes per intro**, under a heading `## Notes per intro`: one block per
   intro that starts with a heading `### NN_name` (the folder name, for example
   `### 11_pas_de_trois`), followed by two to five sentences covering what
   works, what does not, and the reason for the highest and lowest category
   score. The website shows each block on that intro's page, so write it to be
   read on its own and keep method notes out of it.
4. **Method and caveats**: what you watched, read and measured, what you
   could not check, and anything that may have biased your scores.

Keep it plain and specific. Name frames, times and code where you can. A score
with no reason is not useful.
