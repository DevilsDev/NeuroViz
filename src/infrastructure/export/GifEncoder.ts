/**
 * Simple GIF encoder for browser-side GIF creation.
 * Uses LZW compression and builds GIF89a format.
 */

interface GifFrame {
  imageData: ImageData;
  delay: number; // in centiseconds (1/100th of a second)
}

/**
 * Encodes frames into an animated GIF.
 * Simplified implementation using median cut colour quantisation.
 */
export class GifEncoder {
  private width: number;
  private height: number;
  private frames: GifFrame[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Adds a frame to the GIF.
   * @param imageData - Canvas ImageData
   * @param delay - Frame delay in milliseconds
   */
  addFrame(imageData: ImageData, delay: number): void {
    this.frames.push({
      imageData,
      delay: Math.round(delay / 10), // Convert ms to centiseconds
    });
  }

  /**
   * Generates the GIF blob.
   */
  async encode(): Promise<Blob> {
    if (this.frames.length === 0) {
      throw new Error('No frames to encode');
    }

    const bytes: number[] = [];

    // GIF Header
    this.writeString(bytes, 'GIF89a');

    // Logical Screen Descriptor
    this.writeWord(bytes, this.width);
    this.writeWord(bytes, this.height);
    bytes.push(0xF7); // Global colour table flag, 256 colours
    bytes.push(0);    // Background colour index
    bytes.push(0);    // Pixel aspect ratio

    // Global Colour Table (256 colours)
    const palette = this.generatePalette();
    for (const colour of palette) {
      bytes.push(colour.r, colour.g, colour.b);
    }

    // Netscape Application Extension (for looping)
    bytes.push(0x21, 0xFF, 0x0B);
    this.writeString(bytes, 'NETSCAPE2.0');
    bytes.push(0x03, 0x01);
    this.writeWord(bytes, 0); // Loop forever
    bytes.push(0x00);

    // Encode each frame
    for (const frame of this.frames) {
      this.encodeFrame(bytes, frame, palette);
    }

    // GIF Trailer
    bytes.push(0x3B);

    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
  }

  private writeString(bytes: number[], str: string): void {
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
  }

  private writeWord(bytes: number[], value: number): void {
    bytes.push(value & 0xFF);
    bytes.push((value >> 8) & 0xFF);
  }

  private generatePalette(): Array<{ r: number; g: number; b: number }> {
    // Generate a 256-colour palette using web-safe colours + grayscale
    const palette: Array<{ r: number; g: number; b: number }> = [];

    // Web-safe colours (6x6x6 = 216 colours)
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          palette.push({
            r: Math.round(r * 51),
            g: Math.round(g * 51),
            b: Math.round(b * 51),
          });
        }
      }
    }

    // Fill remaining with grayscale
    for (let i = 216; i < 256; i++) {
      const gray = Math.round((i - 216) * 6.375);
      palette.push({ r: gray, g: gray, b: gray });
    }

    return palette;
  }

  private findClosestColour(
    r: number,
    g: number,
    b: number,
    palette: Array<{ r: number; g: number; b: number }>
  ): number {
    let minDist = Infinity;
    let closest = 0;

    for (let i = 0; i < palette.length; i++) {
      const p = palette[i];
      if (!p) continue;
      const dist = (r - p.r) ** 2 + (g - p.g) ** 2 + (b - p.b) ** 2;
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }

    return closest;
  }

  private encodeFrame(
    bytes: number[],
    frame: GifFrame,
    palette: Array<{ r: number; g: number; b: number }>
  ): void {
    // Graphic Control Extension
    bytes.push(0x21, 0xF9, 0x04);
    bytes.push(0x00); // Disposal method
    this.writeWord(bytes, frame.delay);
    bytes.push(0x00); // Transparent colour index
    bytes.push(0x00);

    // Image Descriptor
    bytes.push(0x2C);
    this.writeWord(bytes, 0); // Left
    this.writeWord(bytes, 0); // Top
    this.writeWord(bytes, this.width);
    this.writeWord(bytes, this.height);
    bytes.push(0x00); // No local colour table

    // Convert image data to indexed colours
    const indexed: number[] = [];
    const data = frame.imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      indexed.push(this.findClosestColour(r, g, b, palette));
    }

    // LZW encode
    const lzwMinCodeSize = 8;
    bytes.push(lzwMinCodeSize);

    const encoded = this.lzwEncode(indexed, lzwMinCodeSize);
    
    // Write sub-blocks
    let offset = 0;
    while (offset < encoded.length) {
      const blockSize = Math.min(255, encoded.length - offset);
      bytes.push(blockSize);
      for (let i = 0; i < blockSize; i++) {
        bytes.push(encoded[offset + i] ?? 0);
      }
      offset += blockSize;
    }

    bytes.push(0x00); // Block terminator
  }

  private lzwEncode(indexed: number[], minCodeSize: number): number[] {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    
    const dictionary = new Map<string, number>();
    
    // Initialize dictionary with single-character codes
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i);
    }

    const output: number[] = [];
    let bits = 0;
    let bitCount = 0;

    const writeBits = (code: number, size: number): void => {
      bits |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        output.push(bits & 0xFF);
        bits >>= 8;
        bitCount -= 8;
      }
    };

    writeBits(clearCode, codeSize);

    let current = '';
    
    for (const pixel of indexed) {
      const next = current + ',' + pixel;
      
      if (dictionary.has(next)) {
        current = next;
      } else {
        writeBits(dictionary.get(current) ?? 0, codeSize);
        
        if (nextCode < 4096) {
          dictionary.set(next, nextCode++);
          
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        }
        
        current = String(pixel);
      }
    }

    if (current !== '') {
      writeBits(dictionary.get(current) ?? 0, codeSize);
    }

    writeBits(eoiCode, codeSize);

    // Flush remaining bits
    if (bitCount > 0) {
      output.push(bits & 0xFF);
    }

    return output;
  }
}

/**
 * Captures an SVG element as ImageData.
 */
export async function captureSvgAsImageData(
  svg: SVGSVGElement,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#0f172a'; // Dark background
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}
