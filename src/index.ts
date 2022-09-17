import Encoder from "./structures/Encoder";
import Decoder from "./structures/Decoder";

import { createCanvas } from 'canvas';
import { writeFile } from 'fs';
import path from 'path';

(async () => {
  console.time();
  await drawBanner();
  console.timeEnd();
})();

async function drawBanner() {
  const decoder = new Decoder();
  decoder.setUrl("https://c.tenor.com/gIkUdWaNZCMAAAAd/anime.gif");
  decoder.setFramesCount("all");
  decoder.setCollective(true);

  const frameData = await decoder.start();

  const encoder = new Encoder(600, 338);
  const start = Date.now();

  encoder.setDelay(frameData[0].details.delay * 10);
  encoder.setRepeat(0);
  encoder.setQuality(150);
  encoder.start();

  const canvas = createCanvas(600, 338);

  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "40px Sans";

  for (let i = 0; i < frameData.length; i++) {
    console.log(`Рисую хуйню номер ${i} из ${frameData.length}`);
    ctx.drawImage(frameData[i].getImage(), 0, 0, 600, 338);
    ctx.fillText("Hello World", 200, 240);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  const buffer = encoder.out.getData();
  writeFile(path.join(__dirname, 'test.gif'), buffer, () => null);

  const end = Date.now();
  console.log(`Функция выполнилась за ${end - start}ms.`);
}