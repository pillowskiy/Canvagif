export interface WriteStreamOptions {
  "delay"?: number,
  "frameRate"?: number,
  "dispose"?: number,
  "repeat"?: number,
  "transparent"?: boolean,
  "quality": number,
}

export interface EncoderOptions {
  setDelay: (milliseconds: number) => void,
  setFrameRate: (fps: number) => void,
  setDispose: (code: number) => void,
  setRepeat: (value: number) => void,
  setTransparent: (color: number) => void
}