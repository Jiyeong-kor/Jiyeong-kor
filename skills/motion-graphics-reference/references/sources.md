# Sources and reference notes

## Prompt Motion

- Gallery: https://prompt-motion.com
- Original X post supplied by the user: https://x.com/p4nthera_/status/2107175720086589633
- Snapshot noted on 2026-10-06: the creator described a growing gallery of 226 motion-graphics examples, each paired with the prompt or skill used to make it and credited to the original creator.
- The count is expected to change because the gallery is described as growing.

Prompt Motion is primarily a discovery and reference gallery. It is not itself the renderer or video model. Use the linked prompts, skills, and original creator sources to understand the technique behind a reference.

## Maintained implementation sources

### HyperFrames

- Repository: https://github.com/heygen-com/hyperframes
- Motion-graphics skill: https://github.com/heygen-com/hyperframes/tree/main/skills/motion-graphics
- HyperFrames is designed for agent-authored HTML motion and video rendering.
- Its skill router can select specialized workflows for short motion graphics, general video, website motion, and other video tasks.

Typical install:

```bash
npx skills add heygen-com/hyperframes
```

### Remotion Agent Skills

- Repository: https://github.com/remotion-dev/skills
- Provides agent skills for creating, authoring, previewing, and rendering Remotion projects.
- Useful when the project is React-based or already uses Remotion.

Typical install:

```bash
npx skills add remotion-dev/skills
```

### Additional reference collections

- Verified Opus motion/video prompt collection: https://github.com/yihui-dev/awesome-opus5-5-videos
- Motion recipe gallery: https://oneshotted.io/

Use these as discovery sources. Prefer primary creator links when reproducing or closely adapting a reference.
