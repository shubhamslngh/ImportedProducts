declare module 'pdf-parse' {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    text: string;
  }

  function pdf(data: Buffer | Uint8Array | ArrayBuffer, options?: Record<string, unknown>): Promise<PdfParseResult>;
  export default pdf;
}
