import { Canvas } from "canvas";
import { Frame } from "omggif";

export interface PixelWriterDetails {
  "pixels": Uint8Array,
  "colorDepth": number
}

export interface FrameData {
  getImage: () => Canvas,
  details: Frame | null,
  frameIndex: number
}