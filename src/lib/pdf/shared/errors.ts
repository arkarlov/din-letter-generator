export class PdfLayoutError extends Error {
  /** Name of the form field to attach the message to, when one is known. */
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "PdfLayoutError";
    this.field = field;
  }
}
