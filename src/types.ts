import { Canvas } from "canvas";
import { Frame } from "omggif";
import NAPI from "@napi-rs/canvas";

export interface PixelWriterDetails {
  "pixels": Uint8Array,
  "colorDepth": number
}

export interface FrameData {
  getImage: () => Canvas | NAPI.Canvas,
  details: Frame | null,
  frameIndex: number
}