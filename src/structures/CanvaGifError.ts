export enum ErrorCode {
  "CANVA_GIF_ERROR" = "Canva-Gif Error",
  "DECODER_ERROR" = "Decoder Error",
  "ENCODER_ERROR" = "Encoder Error",
  "BUFFER_ERROR" = "Buffer Error",
  "COLOR_MAP_ERROR" = "MODULE — Color-Map Error",
  "BYTE_ARRAY_ERROR" = "MODULE — ByteArray Error",
  "PIXEL_WRITER_ERROR" = "MODULE — Pixel Writer Error"
}

export class CanvaGifError extends Error {
  public message: string;
  public statusCode: ErrorCode;
  public createdAt = new Date();

  constructor(message: string, code: ErrorCode = ErrorCode.CANVA_GIF_ERROR) {
    super();

    this.message = `${message}`;
    this.statusCode = code;
    this.name = code;

    Error.captureStackTrace(this);
  }
  get createdTimestamp() {
    return this.createdAt.getTime();
  }
  valueOf() {
    return this.statusCode;
  }
  toJSON() {
    return {
      stack: this.stack,
      code: this.statusCode,
      message: this.message,
      created: this.createdTimestamp
    };
  }
  toString() {
    return this.stack;
  }
}