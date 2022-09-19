const { createCanvas } = require("canvas");
const { writeFile } = require("fs");
const { Decoder } = require("../dist");

new Decoder()
.setUrl("https://media3.giphy.com/media/3oz8xsaLjLVqVXr3tS/200.gif") // Set Gif URL for encode
.start().then((frameData) => {
  const { width, height } = frameData[0].details; // Get encoded gif width, height and delay, easy :3

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  for (let i = 0; i < frameData.length; i++) {
    context.drawImage(frameData[i].getImage(), 0, 0, width, height); // method get image can return only canvas, so =(
    writeFile(
      __dirname + `\\cats/cat_${i}.png`,
      canvas.toBuffer("image/png"),
      () => console.log("Encode ended!")
    );
  }
});