export default class NeuQuant {
  private pixels: Uint8Array;
  private samplefac: Uint8Array;

  private network: Float64Array[] = [];
  private netindex = new Int32Array(256);
  private bias = new Int32Array(256);
  private freq = new Int32Array(256);
  private radpower = new Int32Array(256 >> 3);

  constructor(pixels: Uint8Array, samplefac: Uint8Array) {
    this.pixels = pixels;
    this.samplefac = samplefac;
  }

  public init() {
    let i, v;
    for (i = 0; i < 256; i++) {
      v = (i << (4 + 8)) / 256;
      this.network[i] = new Float64Array([v, v, v, 0]);
      this.freq[i] = (1 << 16) / 256;
      this.bias[i] = 0;
    }
  }
  private unbiasnet() {
    for (let i = 0; i < 256; i++) {
      this.network[i][0] >>= 4;
      this.network[i][1] >>= 4;
      this.network[i][2] >>= 4;
      this.network[i][3] = i;
    }
  }
  private altersingle(alpha: number, i: number, b: number, g: number, r: number) {
    this.network[i][0] -= (alpha * (this.network[i][0] - b)) / (1 << 10);
    this.network[i][1] -= (alpha * (this.network[i][1] - g)) / (1 << 10);
    this.network[i][2] -= (alpha * (this.network[i][2] - r)) / (1 << 10);
  }
}