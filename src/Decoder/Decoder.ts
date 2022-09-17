import ndarray from "ndarray";
import ops from 'ndarray-ops';

import { MultiRange } from 'multi-integer-range';
import { GifReader } from 'omggif';
import { readFile } from "fs";
import { createCanvas } from 'canvas';
import axios from "axios";

import type { FrameData } from '../types/Decoder';
import { parseDataUri, isImage } from '../utils/Util';

export default class Decoder {
  private url: string;
  private frames: "all" | number;

  private cumulative: boolean;
  private acceptedFrames: MultiRange | "all";

  private started = false;

  private async handleGIF(data: Buffer, cb: (err: unknown, array?: ndarray.NdArray<Uint8Array>) => void) {
    let reader, ndata;
    try {
      reader = new GifReader(data);
    } catch (err) {
      cb(err);
      return;
    }
    if (reader.numFrames() > 0) {
      const nshape = [reader.numFrames(), reader.height, reader.width, 4];
      try {
        ndata = new Uint8Array(nshape[0] * nshape[1] * nshape[2] * nshape[3]);
      } catch (err) {
        cb(err);
        return;
      }
      const result = ndarray(ndata, nshape);
      try {
        for (let i = 0; i < reader.numFrames(); ++i) {
          reader.decodeAndBlitFrameRGBA(i, ndata.subarray(
            result.index(i, 0, 0, 0),
            result.index(i + 1, 0, 0, 0)
          )
          );
        }
      } catch (err) {
        cb(err);
        return;
      }
      cb(null, result.transpose(0, 2, 1));
    } else {
      const nshape = [reader.height, reader.width, 4];
      const ndata = new Uint8Array(nshape[0] * nshape[1] * nshape[2]);
      const result = ndarray(ndata, nshape);
      try {
        reader.decodeAndBlitFrameRGBA(0, ndata);
      } catch (err) {
        cb(err);
        return;
      }
      cb(null, result.transpose(1, 0));
    }
  }
  private getPixels(url: string, cb: (err: unknown, pixels?: ndarray.NdArray<Uint8Array>) => void) {
    if (Buffer.isBuffer(url)) {
      this.handleGIF(url, cb);
    } else if (url.indexOf('data:') === 0) {
      try {
        const buffer = parseDataUri(url);
        if (buffer) {
          process.nextTick(() => {
            this.handleGIF(buffer.data, cb);
          });
        } else {
          process.nextTick(() => {
            cb('Error parsing data URI');
          });
        }
      } catch (err) {
        process.nextTick(() => {
          cb(err);
        });
      }
    } else if (url.includes("https") || url.includes("http") && isImage(url)) {
      axios.get(url, { responseType: 'arraybuffer' }).then((response) => {
        const buffer = Buffer.from(response.data, "utf-8");
        this.handleGIF(buffer, cb);
      }).catch(err => cb(err));
    } else {
      readFile(url, (err, data) => {
        if (err) {
          cb(err);
          return;
        }
        this.handleGIF(data, cb);
      });
    }
  }
  private handleData(array: ndarray.NdArray<Uint8Array>, data: any, frame?: number): string | null {  // eslint-disable-line @typescript-eslint/no-explicit-any
    if (array.shape.length === 4) {
      return this.handleData(array.pick(frame), data, 0);
    } else if (array.shape.length === 3) {
      if (array.shape[2] === 3) {
        ops.assign(
          ndarray(data,
            [array.shape[0], array.shape[1], 3],
            [4, 4 * array.shape[0], 1]),
          array);
        ops.assigns(
          ndarray(data,
            [array.shape[0] * array.shape[1]],
            [4],
            3),
          255);
      } else if (array.shape[2] === 4) {
        ops.assign(
          ndarray(data,
            [array.shape[0], array.shape[1], 4],
            [4, array.shape[0] * 4, 1]),
          array);
      } else if (array.shape[2] === 1) {
        ops.assign(
          ndarray(data,
            [array.shape[0], array.shape[1], 3],
            [4, 4 * array.shape[0], 1]),
          ndarray(array.data,
            [array.shape[0], array.shape[1], 3],
            [array.stride[0], array.stride[1], 0],
            array.offset));
        ops.assigns(
          ndarray(data,
            [array.shape[0] * array.shape[1]],
            [4],
            3),
          255);
      } else {
        return 'Incompatible array shape';
      }
    } else if (array.shape.length === 2) {
      ops.assign(
        ndarray(data,
          [array.shape[0], array.shape[1], 3],
          [4, 4 * array.shape[0], 1]),
        ndarray(array.data,
          [array.shape[0], array.shape[1], 3],
          [array.stride[0], array.stride[1], 0],
          array.offset));
      ops.assigns(
        ndarray(data,
          [array.shape[0] * array.shape[1]],
          [4],
          3),
        255);
    } else {
      return 'Incompatible array shape';
    }
    return null;
  }
  private savePixels(array: ndarray.NdArray<Uint8Array>) {
    const canvas = createCanvas(600, 338);
    const context = canvas.getContext('2d');
    canvas.width = array.shape[0];
    canvas.height = array.shape[1];

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = this.handleData(array, imageData.data);
    if (typeof data === 'string') throw Error(data);
    context.putImageData(imageData, 0, 0);

    return canvas;
  }
  public async start(): Promise<FrameData[]> {
    return new Promise((resolve, reject) => {
      this.getPixels(this.url, (err, pixels) => {
        if (err) reject(err);
        if (pixels.shape.length < 4) {
          reject('"url" input should be multi-frame GIF.');
          return;
        }
        this.started = true;
        const frameData: FrameData[] = [];
        let maxAccumulatedFrame = 0;
        for (let i = 0; i < pixels.shape[0]; i++) {
          if (this.acceptedFrames !== 'all' && !this.acceptedFrames.has(i)) {
            continue;
          }
          ((frameIndex) => {
            frameData.push({
              getImage: () => {
                if (this.cumulative && frameIndex > maxAccumulatedFrame) {
                  let lastFrame = pixels.pick(maxAccumulatedFrame);
                  for (let f = maxAccumulatedFrame + 1; f <= frameIndex; f++) {
                    const frame = pixels.pick(f);
                    for (let x = 0; x < frame.shape[0]; x++) {
                      for (let y = 0; y < frame.shape[1]; y++) {
                        if (frame.get(x, y, 3) === 0) {
                          frame.set(x, y, 0, lastFrame.get(x, y, 0));
                          frame.set(x, y, 1, lastFrame.get(x, y, 1));
                          frame.set(x, y, 2, lastFrame.get(x, y, 2));
                          frame.set(x, y, 3, lastFrame.get(x, y, 3));
                        }
                      }
                    }
                    lastFrame = frame;
                  }
                  maxAccumulatedFrame = frameIndex;
                }
                return this.savePixels(pixels.pick(frameIndex));
              },
              frameIndex: frameIndex,
            });
          })(i);
        }
        resolve(frameData);
      });
    });
  }
  public setUrl(url: string) {
    this.url = url;
    return url;
  }
  public setFramesCount(count: "all" | number) {
    this.acceptedFrames = count === 'all' ? 'all' : new MultiRange(this.frames);
  }
  public setCollective(value: boolean) {
    this.cumulative = value;
  }
}