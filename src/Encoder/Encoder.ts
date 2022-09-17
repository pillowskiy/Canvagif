import type { EncoderOptions } from "../types/Encoder";
import ByteArray from "./ByteArray";
import ColorMap from "./ColorMap";
import LZWEncode from "./LZWEncode";

export default class Encoder implements EncoderOptions {
  readonly width: number;
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

  private usedEntry: boolean[];

  private colorTab: number[];

  private pixels: Uint8Array;
  private indexedPixels: Uint8Array;

  private image: Uint8ClampedArray | CanvasRenderingContext2D;

  readonly out = new ByteArray();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  public start() {
    this.out.writeUTFBytes("GIF89a");
    this.started = true;
  }
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
        this.pixels[count++] = image[b+1];
        this.pixels[count++] = image[b+2];
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
    const encoder = new LZWEncode(
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
    this.out.writeUTFBytes('NETSCAPE2.0');
    this.out.writeByte(3);
    this.out.writeByte(1);
    this.writeShort(this.repeat);
    this.out.writeByte(0);
  }
  public finish() {
    this.out.writeByte(0x3b);
  }
  public setDelay(milliseconds: number) {
    this.delay = Math.round(milliseconds / 10);
  }
  public setFrameRate(fps: number) {
    this.delay = Math.round(100 / fps);
  }
  public setDispose(code: number) {
    if (code >= 0) this.dispose = code;
  }
  public setRepeat(value: number) {
    this.repeat = value;
  }
  public setQuality(quality: number) {
    if(quality < 1) quality = 1;
    this.sample = quality;
  }
  public setTransparent(color: number) {
    this.transparent = color;
  }
}