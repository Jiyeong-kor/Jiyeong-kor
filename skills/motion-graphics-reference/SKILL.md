---
name: motion-graphics-reference
description: Use for code-generated motion graphics, product promos, animated explainers, kinetic typography, logo stings, UI or website motion, data-visualization video, or adapting a motion reference. When web access is available, inspect current motion examples and their source prompts or skills, then build an original result with the project's existing stack or an appropriate motion framework and verify the render.
---

# Motion Graphics Reference

Use this skill when the user wants motion graphics or a short code-generated video, especially when a visual reference, prompt gallery, website, UI, logo, chart, or product brief is available.

## 1. Research references

- When network access is available, inspect https://prompt-motion.com first for examples that match the requested purpose, duration, aspect ratio, visual language, and technique.
- Treat gallery items as references. Preserve creator attribution when a creator or source is known.
- Prefer the original post, repository, prompt, or skill linked by the gallery over derivative summaries.
- Do not bulk-copy a gallery or present another creator's prompt, composition, or skill as original work.
- When a reference has a distinctive composition, extract reusable motion principles and create a new composition unless the user explicitly asks for a faithful reproduction and has the right to do so.
- If Prompt Motion is unavailable, consult the maintained sources in `references/sources.md`.

## 2. Route to the right implementation

Use the project's existing motion stack when one already exists.

- HyperFrames: prefer for agent-authored HTML motion, short motion-first pieces, UI or website animation, kinetic typography, data visualization, and browser-native compositions.
- Remotion: prefer for React-based video projects, reusable React compositions, programmatic scene systems, captions, and projects already using Remotion.
- Plain HTML/CSS/Canvas/SVG/GSAP/Three.js: prefer when the task is small and does not justify adding a larger video framework.
- Do not migrate between frameworks unless the user requests migration or the existing stack cannot satisfy the deliverable.

If a framework-specific agent skill is installed, read and follow it before implementation. If it is not installed and installation would change the environment, ask for approval before installing it.

## 3. Capture only missing requirements

Infer what is safe to infer from the project and supplied assets. Ask only for information that materially affects the output:

- purpose and audience
- duration
- aspect ratio and target dimensions
- exact required text, numbers, logo, screenshots, or brand assets
- whether audio, captions, transparency, or looping is required

When the user delegates a choice, choose a sensible default and state it briefly.

## 4. Build the motion

- Plan a small number of visual beats before coding.
- Keep each beat focused on one visual idea.
- Use exact user-provided copy and numeric data.
- Prefer deterministic, seekable timing. Avoid wall-clock animation and unseeded randomness in renderable compositions.
- Use easing, scale, position, opacity, masking, typography, and camera motion deliberately. Avoid adding motion that does not improve hierarchy or storytelling.
- Keep typography readable at the target resolution and viewing duration.
- Reuse project tokens and brand assets when available.
- Keep external assets licensed and attributable.

## 5. Verify before delivery

- Render or preview the actual composition.
- Inspect representative frames from the beginning, transitions, key beats, and ending.
- Check clipping, text legibility, unintended blank frames, timing, asset loading, and aspect ratio.
- Verify that the final frame is clean. If a seamless loop is requested, verify that the first and last states match.
- Confirm output dimensions, frame rate, duration, and file path.
- When the task was based on external references, include source and creator credits where appropriate.

## 6. Deliver

Return the editable source, the render or preview path, and the exact command needed to reproduce the output. Mention important framework or dependency choices only when they affect future editing or rendering.
