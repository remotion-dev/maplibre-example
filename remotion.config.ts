import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Set this to "swangle" when rendering on Lambda.
Config.setChromiumOpenGlRenderer("angle");
