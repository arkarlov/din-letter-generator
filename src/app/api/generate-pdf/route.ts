import { letterSchema } from "@/lib/letter/schema";
import { generateLetterPDF } from "@/lib/pdf/generate";
import { PdfLayoutError } from "@/lib/pdf/shared/errors";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return new NextResponse(
      JSON.stringify({
        error: "Invalid JSON payload",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const parsed = letterSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(
      JSON.stringify({
        error: parsed.error.issues[0]?.message ?? "Validation failed",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const pdfBytes = await generateLetterPDF(parsed.data);

    return new NextResponse(
      new Blob([Buffer.from(pdfBytes)], { type: "application/pdf" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="letter.pdf"',
          "Content-Length": pdfBytes.length.toString(),
        },
      },
    );
  } catch (error) {
    console.error("PDF generation failed", error);
    const layoutError = error instanceof PdfLayoutError ? error : undefined;

    return new NextResponse(
      JSON.stringify({
        error: layoutError?.message ?? "Failed to generate PDF",
      }),
      {
        status: layoutError ? 422 : 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
