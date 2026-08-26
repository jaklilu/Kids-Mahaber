import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const svg = fs.readFileSync("public/favicon.svg");
const jobs = [
  { size: 180, file: "apple-touch-icon.png" },
  { size: 192, file: "pwa-192.png" },
  { size: 512, file: "pwa-512.png" },
];

for (const { size, file } of jobs) {
  await sharp(svg).resize(size, size).png().toFile(path.join("public", file));
  console.log("wrote", file);
}
