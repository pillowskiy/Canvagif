const { writeFile } = require("fs");
const { Decoder } = require("../dist");

new Decoder()
.setUrl("https://media3.giphy.com/media/3oz8xsaLjLVqVXr3tS/200.gif") // Set Gif URL for encode
.start().then((frameData) => {
  for (let i = 0; i < frameData.length; i++) {
    // method getImage returns only canvas, so =(
    writeFile(
      __dirname + `\\cats/cat_${i}.png`,
      frameData[i].getImage().toBuffer("image/png"),
      () => console.log("Encode ended!")
    );
  }
});