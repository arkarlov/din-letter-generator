import { NextResponse } from "next/server";
import { envelopeSchema } from "@/lib/letter/envelope-schema";
import { PdfLayoutError } from "@/lib/pdf/shared/errors";
import { generateEnvelopePDF } from "@/lib/pdf/generate";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = envelopeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  try {
    const pdfBytes = await generateEnvelopePDF(parsed.data);

    return new NextResponse(new Blob([Buffer.from(pdfBytes)]), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="envelope.pdf"',
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("Envelope PDF generation failed", error);
    const layoutError = error instanceof PdfLayoutError ? error : undefined;

    return NextResponse.json(
      { error: layoutError?.message ?? "Failed to generate PDF" },
      { status: layoutError ? 422 : 500 },
    );
  }
}
