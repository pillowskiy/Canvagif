<div align="center">
  <img src="https://user-images.githubusercontent.com/97808006/191083266-e911231e-4fa4-47de-b0f7-3ec2c93410da.png" /><br>
  
  <img src="https://img.shields.io/bundlephobia/min/canvagif?color=blue&label=Package%20Size&logo=npm&style=for-the-badge" alt="Package Size">
</div>
    
# CanvaGIF
<p align="center">
  A simple library for encoding and decoding GIF and draw it using <a href="https://github.com/Automattic/canvas">canvas</a>
</p>

## Installation

This module is installed via npm:

``` bash
$ npm install canvagif
```

## Dependencies (6)
  - axios
  - multi-integer-range
  - ndarray
  - ndarray-ops
  - omggif
  - tslib

# Encoder

## Methods: 

  ### Required Methods:
     - start: Starts encode and makes gif
     @returns {Encoder} Encoder
     
     - updateFrame: Write out a new frame to the GIF
     @returns {void} void
     
     - finish: Ends encode and the final byte of the gif is being written
     @returns {Buffer} a boolean value that indicates the success of the gif creation
     
  - #### setTransparent: Define the color which represents transparency in the GIF.<br><br>
      @param {number} color color to represent transparent background<br>
      Example: 0x00FF00<br>
      @returns {Encoder} Encoder <br><br>
  - #### setQuality: Set the quality. <br><br>
      @param {number} quality positive number <br>
      - Info :<br>
          1 — best colors, worst performance.<br>
          n — the higher the number, the worse the quality.<br>
      @returns {Encoder} Encoder <br><br>
  - #### setRepeat: Sets amount of times to repeat GIF. <br><br>
      @param {number} value amount of repeat <br><br>
      - Values :<br>
          -1 — Play once.<br>
          0 — Loop indefinitely.<br>
          n — a positive number, loop n times, cannot be more than 20.<br>
      @returns {Encoder} Encoder <br><br>
  - #### setDispose: Set the disposal code. <br><br>
      @param {number} code alters behavior of how to render between frames. If no transparent color has been set, defaults to 0. Otherwise, defaults to 2. <br><br>
      - Values :<br>
        0 — No disposal specified. The decoder is not required to take any action.<br>
        1 — Do not dispose. The graphic is to be left in place.<br>
        2 — Restore to background color. The area used by the graphic must be restored to the background color. <br>
        3 — Restore to previous. The decoder is required to restore the area overwritten by the graphic with what was there prior to rendering the graphic.<br>
      @returns {Encoder} Encoder <br>
  - #### setFrameRate: Set encoder fps <br><br>
      Default 30<br>
      @param {number} fps number frames of encoder per second <br>
      @returns {Encoder} Encode <br><br>
  - #### setDelay: Set milliseconds to wait between frames <br><br>
      Default 100 / 30 <br>
      @param {number} milliseconds number milliseconds of encoder's delay <br>
      @returns {Encoder} Encoder <br><br>
      
## A simple encoder work example

### <a href="examples/black-white.gif"> Result </a>

```js
const { writeFile } = require("fs");
const { Encoder } = require("canvagif");

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
```

# Decoder
  
## Methods: 
  To be continued.. =)
     
     
## Decode gif into png

### <a href="examples/cats"> Result </a>

```js
const { writeFile } = require("fs");
const { Decoder } = require("canvagif");

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
```

## Decode&Encode example

### <a href="examples/cat.gif"> Result </a>

```js
const { writeFile } = require("fs");
const { Encoder, Decoder } = require("canvagif");

const decoder = new Decoder()
  // .setUrl("https://media3.giphy.com/media/3oz8xsaLjLVqVXr3tS/200.gif")
  .setUrl(__dirname + "\\cat_default.gif") // U also can set path to your gif

// Method "start" returns Promise, so..
decoder.start().then((frameData) => {
  const { width, height, delay } = frameData[0].details; // Get encoded gif width, height and delay, easy :3

  const encoder = new Encoder(width, height)
    .setDelay(delay) // set encoded gif delay
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
    __dirname + "\\cat.gif", // path where u want save the gif
    encoder.finish(), // method "finish" returns buffer
    () => console.log("Encode ended!")
  );
});
```

## Decode&Encode delay change example

### <a href="examples/slowlycat.gif"> Result </a>

```js
const { writeFile } = require("fs");
const { Encoder, Decoder } = require("canvagif");

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
```

