const { createCanvas } = require("canvas");
const { writeFile } = require("fs");
const { GIF } = require("../dist");

const gif = new GIF().setQuality(100);

gif.decode(__dirname + "\\cat_default.gif", 20).then((frameData) => {
  console.log(frameData.length)
  let font = 10;

  const canvas = createCanvas(gif.width, gif.height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#000";
  context.textAlign = "center";
  context.font = `${font}px Sans`;

  for (let i = 0; i < frameData.length; i++) {
    context.drawImage(frameData[i].getImage(), 0, 0, gif.width, gif.height); // draw Frame #i with encoded gif width&height
    context.font = `${font++}px Sans`;
    context.fillText("Cats rule the world", gif.width / 2, 100)
    context.fillText(`${i}/${frameData.length}`, gif.width / 2, gif.height / 2 + 50);
    gif.addFrame(context); // Add a new frame to ur custom gif =) 
  }

  writeFile(
    __dirname + "\\cat.gif", // path where u want save the gif
    gif.buffer(), // method "finish" returns buffer
    () => console.log("Encode ended!")
  );
})