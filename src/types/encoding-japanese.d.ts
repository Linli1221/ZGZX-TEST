declare module 'encoding-japanese' {
  export interface ConvertOptions {
    to: string;
    from?: string;
  }

  export interface DetectOptions {
    suggestedEncoding?: string;
  }

  export function convert(data: Uint8Array | number[], options: ConvertOptions): number[];
  export function detect(data: Uint8Array | number[], options?: DetectOptions): string;
  export function codeToString(data: number[]): string;
  export function stringToCode(str: string): number[];
} 