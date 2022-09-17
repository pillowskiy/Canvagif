import { PixelWriterDetails } from "../types/Encoder";
import ByteArray from "./ByteArray";

export default class PixelWriter {
  static MAXCODE(n_bits: number) {
    return (1 << n_bits) - 1;
  }

  private pixels: Uint8Array;
  readonly width: number;
  readonly height: number;
  private remaining: number;

  readonly initCodeSize: number;

  private accum = new Uint8Array(256);
  private hTab = new Int32Array(5003);
  private codetab = new Int32Array(5003);

  private cur_accum = 0;
  private cur_bits = 0;
  private curPixel: number;
  private free_ent = 0;

  private a_count: number;
  private maxCode: number;
  private nBits: number;

  private clear_flg = false;

  private g_init_bits: number;
  private clearCode: number;
  private EOFCode: number;

  readonly bitMasks: [
    0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
    0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
    0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
  ];

  constructor(width: number, height: number, details: PixelWriterDetails) {
    this.width = width;
    this.height = height;
    this.pixels = details.pixels;
    this.initCodeSize = Math.max(2, details.colorDepth);
  }

  private char_out(bit: number, outs: ByteArray) {
    this.accum[this.a_count++] = bit;
    if (this.a_count >= 254) this.flush_char(outs);
  }
  private cl_block(outs: ByteArray) {
    this.cl_hash(5003);
    this.free_ent = this.clearCode + 2;
    this.clear_flg = true;
    this.output(this.clearCode, outs);
  }
  private cl_hash(hSize: number) {
    for (let i = 0; i < hSize; ++i) this.hTab[i] = -1;
  }
  private compress(init_bits: number, outs: ByteArray) {
    let fcode, c, i, ent, disp, hshift;

    this.g_init_bits = init_bits;
    this.clear_flg = false;
    this.nBits = this.g_init_bits;
    this.maxCode = PixelWriter.MAXCODE(this.nBits);

    this.clearCode = 1 << (init_bits - 1);
    this.EOFCode = this.clearCode + 1;
    this.free_ent = this.clearCode + 2;

    this.a_count = 0;

    ent = this.nextPixel();

    hshift = 0;
    for (fcode = 5003; fcode < 65536; fcode *= 2) ++hshift;
    hshift = 8 - hshift;

    const hsize_reg = 5003;
    this.cl_hash(hsize_reg);

    this.output(this.clearCode, outs);

    outer_loop: while ((c = this.nextPixel()) != -1) {
      fcode = (c << 12) + ent;
      i = (c << hshift) ^ ent;
      if (this.hTab[i] === fcode) {
        ent = this.codetab[i];
        continue;
      } else if (this.hTab[i] >= 0) {
        disp = hsize_reg - i;
        if (i === 0) disp = 1;
        do {
          if ((i -= disp) < 0) i += hsize_reg;
          if (this.hTab[i] === fcode) {
            ent = this.codetab[i];
            continue outer_loop;
          }
        } while (this.hTab[i] >= 0);
      }

      this.output(ent, outs);
      ent = c;

      if (this.free_ent < 1 << 12) {
        this.codetab[i] = this.free_ent++;
        this.hTab[i] = fcode;
      } else {
        this.cl_block(outs);
      }
    }

    this.output(ent, outs);
    this.output(this.EOFCode, outs);
  }
  public encode(outs: ByteArray) {
    outs.writeByte(this.initCodeSize);
    this.remaining = this.width * this.height;
    this.curPixel = 0;
    this.compress(this.initCodeSize + 1, outs);
    outs.writeByte(0);
  }
  private flush_char(outs: ByteArray) {
    if (this.a_count > 0) {
      outs.writeByte(this.a_count);
      outs.writeBytes(this.accum, 0, this.a_count);
      this.a_count = 0;
    }
  }
  private nextPixel() {
    if (this.remaining === 0) return -1;
    --this.remaining;
    const pix = this.pixels[this.curPixel++];
    return pix & 0xff;
  }
  private output(code: number, outs: ByteArray) {
    this.cur_accum &= this.bitMasks[this.cur_bits];

    this.cur_bits > 0 ?
      this.cur_accum |= (code << this.cur_bits):
      this.cur_accum = code;

    this.cur_bits += this.nBits;

    while (this.cur_bits >= 8) {
      this.char_out((this.cur_accum & 0xff), outs);
      this.cur_accum >>= 8;
      this.cur_bits -= 8;
    }

    if (this.free_ent > this.maxCode || this.clear_flg) {
      if (this.clear_flg) {
        this.maxCode = PixelWriter.MAXCODE(this.nBits = this.g_init_bits);
        this.clear_flg = false;
      } else {
        ++this.nBits;
        this.nBits == 12 ?
          this.maxCode = 1 << 12:
          this.maxCode = PixelWriter.MAXCODE(this.nBits);
      }
    }

    if (code == this.EOFCode) {
      while (this.cur_bits > 0) {
        this.char_out((this.cur_accum & 0xff), outs);
        this.cur_accum >>= 8;
        this.cur_bits -= 8;
      }
      this.flush_char(outs);
    }
  }
}