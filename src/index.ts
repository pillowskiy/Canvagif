import Encoder from "../src/Encoder/Encoder";
import Decoder from "../src/Decoder/Decoder";

import { createCanvas } from 'canvas';
import { writeFile } from 'fs';
import path from 'path';

(async () => {
  console.time();
  await drawBanner();
  console.timeEnd();
})();

async function drawBanner() {
  const encoder = new Encoder(600, 338);
  const start = Date.now();

  encoder.start();
  encoder.setRepeat(0);
  encoder.setQuality(150);

  const canvas = createCanvas(600, 338);

  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "40px Sans";

  const decoder = new Decoder();
  decoder.setUrl(`${process.cwd()}/canvas/background.gif`);
  decoder.setFramesCount("all");
  decoder.setCollective(true);

  const frameData = await decoder.start();
  for (let i = 0; i < frameData.length; i++) {
    encoder.setDelay(20);
    console.log(`Рисую хуйню номер ${i} из ${frameData.length}`);
    ctx.drawImage(frameData[i].getImage(), 0, 0, 600, 338);
    ctx.fillText("Hello World", 200, 240);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  const buffer = encoder.out.getData();
  writeFile(path.join(__dirname, 'test.gif'), buffer, error => null);

  const end = Date.now();
  console.log(
    `Функция выполнилась за ${end - start}ms.`
  );
}