import sharp from "sharp";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const sourceCandidates = [
  join(
    root,
    "assets",
    "c__Users_Gaming_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Gemini_Generated_Image_bg0irxbg0irxbg0i-7b7bc77f-d39a-43a5-80fd-99664ed75893.png",
  ),
  join(
    process.env.USERPROFILE ?? "",
    ".cursor",
    "projects",
    "c-Users-Gaming-Desktop-Tutorai",
    "assets",
    "c__Users_Gaming_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Gemini_Generated_Image_bg0irxbg0irxbg0i-7b7bc77f-d39a-43a5-80fd-99664ed75893.png",
  ),
  join(root, "public", "yazzow-logo-source.png"),
];

const source = sourceCandidates.find((path) => existsSync(path));
if (!source) {
  throw new Error("Original logo source not found. Place yazzow-logo-source.png in public/.");
}

const output = join(root, "public", "yazzow-logo.png");
const iconOutput = join(root, "src", "app", "icon.png");
const cachedSource = join(root, "public", "yazzow-logo-source.png");

if (source !== cachedSource) {
  copyFileSync(source, cachedSource);
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function chroma(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isPaperBackground(r, g, b) {
  const lum = luminance(r, g, b);
  const ch = chroma(r, g, b);
  return lum >= 220 && ch <= 40;
}

async function removeBackground(inputPath, outPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isPaperBackground(r, g, b)) {
      data[i + 3] = 0;
      continue;
    }

    const lum = luminance(r, g, b);
    const ch = chroma(r, g, b);
    if (lum >= 205 && lum <= 240 && ch <= 28) {
      const fade = Math.min(1, (240 - lum) / 20);
      data[i + 3] = Math.round(data[i + 3] * fade);
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
}

await removeBackground(cachedSource, output);
await sharp(output).resize(512).png().toFile(iconOutput);

console.log("Transparent logo written to", output);
