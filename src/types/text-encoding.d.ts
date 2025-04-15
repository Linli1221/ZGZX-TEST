declare module 'text-encoding' {
  export class TextEncoder {
    constructor(encoding?: string);
    encode(input: string): Uint8Array;
  }

  export class TextDecoder {
    constructor(encoding?: string, options?: { fatal?: boolean });
    decode(input?: ArrayBuffer | ArrayBufferView): string;
  }
} 