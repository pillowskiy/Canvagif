import Encoder from "../src/Encoder/Encoder";
import { createCanvas } from 'canvas';
import { writeFile } from 'fs';
import path from 'path';

(async () => {
  console.time();
  await draw();
  console.timeEnd();
})();

async function draw() {
  const size = 200;
  const half = size / 2;

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  function drawBackground() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  const encoder = new Encoder(size, size);
  encoder.setDelay(500);
  encoder.setRepeat(0);

  encoder.start();

  drawBackground();
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, half, half);
  encoder.addFrame(ctx);

  drawBackground();
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(half, 0, half, half);
  encoder.addFrame(ctx);

  drawBackground();
  ctx.fillStyle = '#000';
  ctx.fillRect(half, half, half, half);
  encoder.addFrame(ctx);

  drawBackground();
  ctx.fillStyle = '#818181';
  ctx.fillRect(0, half, half, half);
  encoder.addFrame(ctx);

  encoder.finish();

  const buffer = encoder.out.getData();

  writeFile(path.join(__dirname, 'test.gif'), buffer, () => null);
  return true;
}