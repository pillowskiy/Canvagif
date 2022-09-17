import { Canvas } from "canvas";

export interface FrameData {
  getImage: () => Canvas,
  frameIndex: number
}