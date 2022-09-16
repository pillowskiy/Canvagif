import stream from "stream";
import { WriteStreamOptions, EncoderOptions } from "../types/Encoder";

export default class Encoder implements EncoderOptions {
  readonly width: number;
  readonly height: number;

  private started = false;
  private delay: number;
  private repeat: number;
  private dispose: number;
  private transparent: number;

  private readStreams: stream.Duplex[] = [];
  constructor(width: number, height: number) {
    this.width = ~~width;
    this.height = ~~height;
  }  
  private createReadStream(readStream: stream.Duplex) {
    if(!readStream) throw Error("Cannot find readable strem");
    this.readStreams.push(readStream);
    return readStream;
  }
  public createWriteStream(options?: WriteStreamOptions) {
    if(options) {
      Object.keys(options).forEach(option => {
        const setFunc = 'set' + option[0].toUpperCase() + option.substring(1);
        if (~['setDelay', 'setFrameRate', 'setDispose', 'setRepeat',
          'setTransparent', 'setQuality'].indexOf(setFunc)) {
          // this[setFunc].call(self, options[option as keyof WriteStreamOptions]);
        }
      });
    }

    // const writeStream = new stream.Duplex({ objectMode: true });
    // this.createReadStream(writeStream);

    // writeStream._write = (data, _, next) => {
    //   if (!this.started) this.start();
    //   this.addFrame(data);
    //   next();
    // };

    // const end = writeStream.end;
    // writeStream.end = () => {
    //   end.apply(writeStream, [].slice.call(arguments));
    //   this.finish();
    // };
    // return writeStream;
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
  public setTransparent(color: number) {
    this.transparent = color;
  }
}