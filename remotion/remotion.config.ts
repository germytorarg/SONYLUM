import fs from 'node:fs';
import path from 'node:path';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);

// Cloud sessions can't download Remotion's own Chrome, so reuse the
// Chromium that Playwright pre-installs under /opt/pw-browsers.
const pwRoot = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
if (fs.existsSync(pwRoot)) {
	const shell = fs
		.readdirSync(pwRoot)
		.filter((d) => d.startsWith('chromium_headless_shell-'))
		.sort()
		.map((d) => path.join(pwRoot, d, 'chrome-linux', 'headless_shell'))
		.filter((p) => fs.existsSync(p))
		.pop();
	if (shell) {
		Config.setBrowserExecutable(shell);
	}
}
