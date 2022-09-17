import type { EncoderOptions } from "../types/Encoder";
import ByteArray from "./ByteArray";
import ColorMap from "./ColorMap";
import PixelWriter from "./PixelWriter";

export default class Encoder implements EncoderOptions {
  /**
    * Context width
    * @type {number}
    * @readonly
  */
  readonly width: number;

  /**
    * Context height
    * @type {number}
    * @readonly
  */
  readonly height: number;

  private started = false;
  private delay = 0;
  private repeat = 0;
  private dispose = -1;
  private transIndex = 0;
  private transparent: number;
  private sample = 10;

  private colorDepth: number;
  private palSize: number;

  private firstFrame = true;

  private usedEntry = new Array({});

  private colorTab: number[];

  private pixels: Uint8Array;
  private indexedPixels: Uint8Array;

  private image: Uint8ClampedArray | CanvasRenderingContext2D;

  readonly out = new ByteArray();

  /**
     * Encoder constructor
     * @param {number} width Canvas Width
     * @param {number} height Canvas Height
  */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Starts encode and makes gif
   * @returns {boolean} a boolean value that indicates the success of the gif creation
  */
  public start() {
    this.out.writeUTFBytes("GIF89a");
    this.started = true;
    return this.started;
  }

  /**
   * Write out a new frame to the GIF.
   * @param {CanvasRenderingContext2D} imageData rendering canvas context (2d)
   * @returns {void} void
  */
  public addFrame(imageData: CanvasRenderingContext2D) {
    if (imageData && imageData.getImageData) {
      this.image = imageData.getImageData(0, 0, this.width, this.height).data;
    } else {
      this.image = imageData as CanvasRenderingContext2D;
    }

    this.getImagePixels();
    this.analyzePixels();

    if (this.firstFrame) {
      this.writeLSD();
      this.writePalette();
      if (this.repeat >= 0) {
        this.writeNetscapeExt();
      }
    }

    this.writeGraphicCtrlExt();
    this.writeImageDesc();
    if (!this.firstFrame) this.writePalette();
    this.writePixels();

    this.firstFrame = false;
  }
  private getImagePixels() {
    const image = this.image as Uint8ClampedArray;
    this.pixels = new Uint8Array(this.width * this.height * 3);
    let count = 0;

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const b = (i * this.width * 4) + j * 4;
        this.pixels[count++] = image[b];
        this.pixels[count++] = image[b + 1];
        this.pixels[count++] = image[b + 2];
      }
    }
  }
  private analyzePixels() {
    const nPix = this.pixels.length / 3;
    this.indexedPixels = new Uint8Array(nPix);

    const img = new ColorMap(this.pixels, this.sample);
    img.buildColormap();
    this.colorTab = img.getColormap();

    let k = 0;
    for (let j = 0; j < nPix; j++) {
      const index = img.lookupRGB(this.pixels[k++] & 0xff, this.pixels[k++] & 0xff, this.pixels[k++] & 0xff);
      this.usedEntry[index] = true;
      this.indexedPixels[j] = index;
    }

    this.pixels = null;
    this.colorDepth = 8;
    this.palSize = 7;

    if (this.transparent !== null) {
      this.transIndex = this.findClosest(this.transparent);
      for (let pixelIndex = 0; pixelIndex < nPix; pixelIndex++) {
        const image = this.image as Uint8ClampedArray;
        if (image[pixelIndex * 4 + 3] === 0) {
          this.indexedPixels[pixelIndex] = this.transIndex;
        }
      }
    }
  }
  private findClosest(color: number) {
    if (this.colorTab === null) return -1;

    const r = (color & 0xFF0000) >> 16;
    const g = (color & 0x00FF00) >> 8;
    const b = (color & 0x0000FF);

    let minPos = 0;
    let dMin = 256 * 256 * 256;

    for (let i = 0; i < this.colorTab.length;) {
      const index = i / 3;
      const dr = r - (this.colorTab[i++] & 0xff);
      const dg = g - (this.colorTab[i++] & 0xff);
      const db = b - (this.colorTab[i++] & 0xff);
      const d = dr * dr + dg * dg + db * db;
      if (this.usedEntry[index] && (d < dMin)) {
        dMin = d;
        minPos = index;
      }
    }

    return minPos;
  }
  private writeLSD() {
    this.writeShort(this.width);
    this.writeShort(this.height);
    this.out.writeByte(0x80 | 0x70 | 0x00 | this.palSize);
    this.out.writeByte(0);
    this.out.writeByte(0);
  }
  private writeShort(value: number) {
    this.out.writeByte(value & 0xFF);
    this.out.writeByte((value >> 8) & 0xFF);
  }
  private writePixels() {
    const encoder = new PixelWriter(
      this.width, this.height,
      { "pixels": this.indexedPixels, "colorDepth": this.colorDepth }
    );

    encoder.encode(this.out);
  }
  private writePalette() {
    this.out.writeBytes(this.colorTab);
    const length = (3 * 256) - this.colorTab.length;
    for (let i = 0; i < length; i++) {
      this.out.writeByte(0);
    }
  }
  private writeGraphicCtrlExt() {
    this.out.writeByte(0x21);
    this.out.writeByte(0xf9);
    this.out.writeByte(4);

    let transParent, disParent;
    if (this.transparent === null) {
      transParent = 0;
      disParent = 0;
    } else {
      transParent = 1;
      disParent = 2;
    }
    if (this.dispose >= 0) {
      disParent = this.dispose & 7;
    }
    disParent <<= 2;
    this.out.writeByte(0 | disParent | 0 | transParent);

    this.writeShort(this.delay);
    this.out.writeByte(this.transIndex);
    this.out.writeByte(0);
  }
  private writeImageDesc() {
    this.out.writeByte(0x2c);
    this.writeShort(0);
    this.writeShort(0);
    this.writeShort(this.width);
    this.writeShort(this.height);

    if (this.firstFrame) {
      this.out.writeByte(0);
    } else {
      this.out.writeByte(0x80 | 0 | 0 | 0 | this.palSize);
    }
  }
  private writeNetscapeExt() {
    this.out.writeByte(0x21);
    this.out.writeByte(0xff);
    this.out.writeByte(11);
    this.out.writeByte(3);
    this.out.writeByte(1);
    this.writeShort(this.repeat);
    this.out.writeByte(0);
  }

  /**
   * Ends encode and the final byte of the gif is being written
   * @returns {Buffer} a boolean value that indicates the success of the gif creation
  */
  public finish() {
    this.out.writeByte(0x3b);
    return this.out.getData();
  }

  /**
   * Set milliseconds to wait between frames
   * Default 0
   * @param {number} milliseconds number milliseconds of encoder's delay
   * @returns {this} Encoder 
  */
  public setDelay(milliseconds: number) {
    this.delay = Math.round(milliseconds / 10);
    return this;
  }

  /**
   * Set encoder fps
   * @param {number} fps number frames of encoder per second
   * @returns {this} Encoder 
  */
  public setFrameRate(fps: number) {
    this.delay = Math.round(100 / fps);
    return this;
  }

  /**
   * Set the disposal code
   * @param {number} code alters behavior of how to render between frames. If no transparent color has been set, defaults to 0. Otherwise, defaults to 2.
   *
   *  
   * Values :
   * 
   *    0 — No disposal specified. The decoder is not required to take any action.
   * 
   *    1 — Do not dispose. The graphic is to be left in place.
   * 
   *    2 — Restore to background color. The area used by the graphic must be restored to the background color.
   * 
   *    3 — Restore to previous. The decoder is required to restore the area overwritten by the graphic with what was there prior to rendering the graphic.
   * 
   * @returns {this} Encoder 
  */
  public setDispose(code: number) {
    if (code >= 0) this.dispose = code;
    return this;
  }

  /**
   * Sets amount of times to repeat GIF
   * @param {number} value amount of repeat
   *
   *  
   * Values :
   * 
   *    -1 — Play once.
   * 
   *    0 — Loop indefinitely.
   * 
   *    n — a positive number, loop n times, cannot be more than 20.
   * 
   * @returns {this} Encoder 
  */
  public setRepeat(value = 0) {
    let readableValue: number;

    if (value < 0) {
      readableValue = -1;
    } else if (value > 20) {
      readableValue = 20;
    }

    this.repeat = readableValue;
    return this;
  }

  /**
   * Set the quality.
   * @param {number} quality positive number
   *
   *  
   * Info :
   * 
   *    1 — best colors, worst performance.
   * 
   *    n — 20 is suggested maximum, but there is no limit.
   * 
   * @returns {this} Encoder 
  */
  public setQuality(quality: number) {
    if (quality < 1) quality = 1;
    this.sample = quality;
    return this;
  }

  /**
   * Define the color which represents transparency in the GIF.
   * @param {number} color color to represent transparent background
   *
   * Example: 0x00FF00
   * @returns {this} Encoder
  */
  public setTransparent(color: number) {
    this.transparent = color;
    return this;
  }
}