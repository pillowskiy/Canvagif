// A simple encoder work example
const { writeFile } = require("fs");
const { Encoder } = require("../dist");

const encoder = new Encoder(200, 200).start(); // required method "start" returns encoder

const context = encoder.getContext();

context.fillStyle = "#000";
context.fillRect(0, 0, 200, 200);
encoder.updateFrame();

context.fillStyle = "#fff";
context.fillRect(0, 0, 200, 200);
encoder.updateFrame();

writeFile(
  __dirname + "\\black-white.gif", // path where u want save the gif
  encoder.finish(), // method "finish" returns buffer
  () => console.log("Encode ended!")
);