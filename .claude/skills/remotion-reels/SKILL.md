---
name: remotion-reels
description: Edit videos into viral vertical 9:16 reels with Remotion (animated word-by-word captions in mixed fonts, animated emoji stickers, punch-in zooms, flashes). Use when the user uploads a video and asks to add subtitles, cut it, make it vertical, or make it "viral" for Reels/TikTok/Shorts.
---

# Remotion reels

The Remotion workspace lives in `remotion/` (dependencies are installed by the
SessionStart hook). Composition `Reel` (1080x1920, 30 fps) takes `ReelProps`
from `remotion/src/types.ts`; `remotion/src/demo.ts` is a complete example.

## Workflow

1. Copy the user's video into `remotion/public/<project>/` (don't commit large
   source videos unless asked).
2. Transcribe with word timestamps. Hugging Face is blocked in cloud sessions,
   so load Whisper from npm instead:
   ```bash
   mkdir -p /tmp/asr && cd /tmp/asr && npm init -y >/dev/null
   npm i --ignore-scripts sts-whisper-small @huggingface/transformers
   ffmpeg -v error -y -i VIDEO -ac 1 -ar 16000 -f f32le audio.f32
   ```
   ```js
   // tr.mjs
   import {pipeline, env} from '@huggingface/transformers';
   import fs from 'fs';
   env.allowRemoteModels = false;
   env.localModelPath = './node_modules/sts-whisper-small/models/';
   const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {dtype: 'q8'});
   const b = fs.readFileSync('audio.f32');
   const r = await asr(new Float32Array(b.buffer, b.byteOffset, b.length / 4),
     {language: 'spanish', task: 'transcribe', return_timestamps: 'word'});
   fs.writeFileSync('words.json', JSON.stringify(r.chunks));
   ```
   Tell the user about any word the model may have misheard.
3. Write a props JSON (same shape as `demo.ts`): split into short pages with
   `newPage`, mark 1 key word per page as `big` (Anton, gradient) or `script`
   (Great Vibes), use `punch: true` on the strongest words, add stickers from
   `public/stickers/manifest.json` as "exclamation marks", flashes on scene changes.
   Use `focusX` to keep the speaker centered when cropping 16:9 to 9:16.
4. Check stills before the full render, then render:
   ```bash
   cd remotion
   npx remotion still Reel out/check.png --frame=90 --props=public/<project>/props.json
   npx remotion render Reel out/<project>.mp4 --props=public/<project>/props.json
   ```
5. Send the result with SendUserFile.

## Notes

- `remotion.config.ts` points Remotion at the pre-installed Playwright
  Chromium, because Remotion can't download its own browser in cloud sessions.
- Fonts come from `@fontsource/*` (Google Fonts is blocked at render time).
- More animated emoji: npm packages `@lobehub/fluent-emoji-anim-1..4` (MIT),
  files named by codepoint (e.g. `1f631.webp`). Convert them to PNG frames in
  `public/stickers/<name>/000.png...` and add the frame count to `manifest.json`.
- Face tracking (e.g. effects that follow the eyes): the MediaPipe
  `face_landmarker.task` model ships in npm `@beautinique/frontend-tryon-assets`;
  Python `mediapipe` needs `apt-get install -y libegl1 libgles2`.
- Real AI upscaling isn't available offline; the Higgsfield connector has
  `upscale_video` but it spends the user's credits, so ask first.
