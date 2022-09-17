export default class ByteArray {
  public data: number[] = [];

  public getData() {
    return Buffer.from(this.data);
  }
  public writeByte(value: number) {
    this.data.push(value);
  }
  public writeUTFBytes(string: string) {
    for (let i = 0; i < string.length; i++) {
      this.writeByte(string.charCodeAt(i));
    }
  }
  public writeBytes(array: Uint8Array, offset: number, length: number) {
    const writtenLength = length || array.length;
    for (let i = offset || 0; i < writtenLength; i++) {
      this.writeByte(array[i]);
    }
  }
}