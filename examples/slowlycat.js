const { writeFile } = require("fs");
const { Encoder, Decoder } = require("../dist");

const decoder = new Decoder()
  .setUrl("https://media3.giphy.com/media/3oz8xsaLjLVqVXr3tS/200.gif") // Set Gif URL for encode

// Method "start" returns Promise, so..
decoder.start().then((frameData) => {
  const { width, height } = frameData[0].details; // Get encoded gif width and height, easy :3

  const encoder = new Encoder(width, height)
    .setDelay(100) // set delay for 100 milliseconds
    .setQuality(100) // set gif quality (affects colors)
    .start(); // required method "start" returns encoder

  let font = 10;

  const context = encoder.getContext();
  context.fillStyle = "#000";
  context.textAlign = "center";
  context.font = `${font}px Sans`;

  for (let i = 0; i < frameData.length; i++) {
    context.drawImage(frameData[i].getImage(), 0, 0, width, height); // draw Frame #i with encoded gif width&height
    context.font = `${font++}px Sans`;
    context.fillText("Cats rule the world", width / 2, 100)
    context.fillText(`${i}/${frameData.length}`, width / 2, height / 2 + 50);
    encoder.updateFrame(); // Add a new frame to ur custom gif =) 
  }

  writeFile(
    __dirname + "\\fastcat.gif", // path where u want save the gif
    encoder.finish(), // method "finish" returns buffer
    () => console.log("Encode ended!")
  );
});