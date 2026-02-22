import { generatePDF, type PdfData } from "@/utils/pdf";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as PdfData;

    const pdfBytes = await generatePDF(data);

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
