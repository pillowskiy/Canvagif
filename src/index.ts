import Encoder from "../src/structures/Encoder";
import Decoder from "../src/structures/Decoder";
import { Canvas } from "canvas";
import NAPI from '@napi-rs/canvas';
import { writeFile } from "fs";

(async () => {
  console.time("node-canvas");
  await drawBannerCanvas();
  console.timeEnd("node-canvas");

  console.time("napi-canvas");
  await drawBannerNapi();
  console.timeEnd("napi-canvas");
})();

async function drawBannerCanvas() {
  const decoder = new Decoder()
    .setUrl("https://thumbs.gfycat.com/GrayNecessaryDuckbillplatypus-max-1mb.gif")
    .setCollective(true);
  
  const frameData = await decoder.start();

  const encoder = new Encoder(600, 338)
    .setFrameRate(30)
    .setRepeat(0)
    .setQuality(200)
    .start();

  const ctx = encoder.getContext("canvas");

  ctx.lineWidth = 3;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "40px Sans";

  for (let i = 0; i < frameData.length; i++) {
    const image = frameData[i].getImage();
    if (image instanceof Canvas) {
      // @ts-ignore
      ctx.drawImage(image, 0, 0, 600, 338);
      encoder.addFrame(ctx);
    }
  }

  writeFile("color_test2.gif", encoder.finish(), () => null);
}

async function drawBannerNapi() {
  const decoder = new Decoder()
    .setUrl("https://thumbs.gfycat.com/GrayNecessaryDuckbillplatypus-max-1mb.gif")
    .setDecodeTech("napi_canvas")
    .setCollective(true);
  
  const frameData = await decoder.start();

  const encoder = new Encoder(600, 338)
    .setFrameRate(30)
    .setRepeat(0)
    .setQuality(200)
    .start();

  const ctx = encoder.getContext("napi_canvas");

  ctx.lineWidth = 3;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "40px Sans";

  for (let i = 0; i < frameData.length; i++) {
    ctx.drawImage(frameData[i].getImage() as NAPI.Canvas, 0, 0, 600, 338);
    encoder.addFrame(ctx);
  }

  writeFile("color_test3.gif", encoder.finish(), () => null);
}