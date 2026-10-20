import fs from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setConcurrency(4);
// Filtros SVG + drop-shadows: el render por GPU de software necesita algo más de margen.
Config.setTimeoutInMilliseconds(120000);

// En entornos sin descarga de Chrome (CI / contenedores) usar el headless shell preinstalado.
const preinstalled = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(preinstalled)) {
  Config.setBrowserExecutable(preinstalled);
}
