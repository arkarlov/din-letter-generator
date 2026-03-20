import { generatePDF } from "@/components/pdf/generatePDF";
import { pdfDataSchema } from "@/components/pdf/types";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = pdfDataSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Validation failed",
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
    const pdfBytes = await generatePDF(parsed.data);

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
    return new NextResponse(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
