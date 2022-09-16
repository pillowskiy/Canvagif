import type { EncoderOptions } from "../types/Encoder";
import ByteArray from "./ByteArray";

export default class Encoder implements EncoderOptions {
  readonly width: number;
  readonly height: number;

  private started = false;
  private delay = 0;
  private repeat = 0;
  private dispose = -1;
  private transparent: number;
  private sample = 10;

  private pixels: Uint8Array;
  private indexedPixels: Uint8Array;

  private image: CanvasRenderingContext2D | Uint8ClampedArray;

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
      this.image = imageData;
    }
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