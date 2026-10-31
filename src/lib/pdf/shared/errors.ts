export class PdfLayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfLayoutError";
  }
}
