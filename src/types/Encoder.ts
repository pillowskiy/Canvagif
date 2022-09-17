export interface WriteStreamOptions {
  "delay"?: number,
  "frameRate"?: number,
  "dispose"?: number,
  "repeat"?: number,
  "transparent"?: number,
  "quality": number,
}

export interface EncoderOptions {
  setDelay: (milliseconds: number) => void,
  setFrameRate: (fps: number) => void,
  setDispose: (code: number) => void,
  setRepeat: (value: number) => void,
  setTransparent: (color: number) => void
}

export interface LZWEncodeDetails {
  "pixels": Uint8Array,
  "colorDepth": number
}

export type OptionsFuncName = "setDelay" | "setFrameRate" | "setDispose" | "setRepeat" | "setTransparent";