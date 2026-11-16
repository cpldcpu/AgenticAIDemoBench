# AgenticAIDemoBench

An evaluation of the creativity of agentic AI. Each agent is asked to make a
complete 8k intro on its own: a single HTML file of at most 8,192 bytes that
shows generated pictures and plays generated music in the browser.

- **Watch, vote and comment:** [slöp](https://cpldcpu.github.io/AgenticAIDemoBench/), the website built from this repository
- **Source:** [github.com/cpldcpu/AgenticAIDemoBench](https://github.com/cpldcpu/AgenticAIDemoBench)

## The evaluation

An agent gets one short invitation and the contents of this repository. From
there it works autonomously: it researches, picks a concept, writes the shaders
and the soundtrack, builds and checks the release, and documents it with a
readme, an `.nfo` and screenshots.

This is the prompt, run in the [Latent_8k/](Latent_8k/) folder:

> You're invited to make Latent's next 8k intro as `NN_<title>/`. Read `readme.md` and `tools/readme.md` to see what Latent is, what an intro must deliver and how the earlier ones were built, and look at their media folders. Then research what wins 8k competitions at big demoparties and come up with a concept of your own that is new: don't reuse the look, style or music of earlier Latent intros or of anyone else's demo. You don't need to make an .mp4. The goal is to beat everything in the folder and to win the compo.

The intros and the rules are in [Latent_8k/](Latent_8k/); start with its
[readme](Latent_8k/readme.md). The website generator is in [site/](site/).

## FAQ

**Q: What does this actually test?**

- It tests a model's ability to create coherent animated graphics and sound
  from code.
- Other benchmarks, like ["Pelican on a bicycle"](https://github.com/simonw/pelican-bicycle)
  or the [Python raytracer test](https://github.com/cpldcpu/llmbenchmark/tree/master/10_raytracer),
  only test static scenes.
- In 2026, agentic AI models became impressively good at 3D graphics.

**Q: What are typical shortcomings that are still observed in the models?**

- Most models are not very good at composing music. Only Claude Fable 5.2,
  Opus 5.5 and Sonnet 5.5 have somehow cracked this.
- Models often fall back on design patterns they have learned. For example,
  GPT-6.1 Sol tends to use a certain palette, and Gemini models have a strange
  tendency to put progress bars into their demos.
- Many models also fail to be truly creative and copy from earlier demos, even
  though they were explicitly told not to.

**Q: Why are all intros in one folder, where each agent can see the earlier ones?**

- **Agents can build on earlier work.** A new agent reads the previous intros,
  their notes on what went wrong and the shared tools, and starts from there
  instead of from zero.
- **It injects variation.** The rules require a new intro to differ in look and
  music from everything already in the folder. Without that, models asked the
  same question tend to give similar answers. The growing folder also acts as a
  source of entropy: every run starts from a different state and is pushed
  away from what exists.

**Q: Did a human edit the intros?**

- No. Humans give the invitation and sometimes feedback; the agent named in
  each intro's readme and `.nfo` wrote the code, the visuals and the music.

**Q: What is Latent?**

- A "demoscene" group name I gave the agents for context.

## License

[MIT](LICENSE)
