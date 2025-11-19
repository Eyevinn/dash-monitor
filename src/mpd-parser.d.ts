/**
 * Type declarations for mpd-parser
 */
declare module 'mpd-parser' {
  export interface ParseOptions {
    manifestUri: string;
    previousManifest?: any;
  }

  export function parse(manifest: string, options: ParseOptions): any;
}
