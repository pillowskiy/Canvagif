import { Canvas } from "canvas";
import { Frame } from "omggif";

export interface FrameData {
  getImage: () => Canvas,
  details: Frame | null,
  frameIndex: number
}