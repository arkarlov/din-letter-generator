import { generatePDF } from "@/utils/pdf";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();

  const pdfBytes = await generatePDF(data);

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=letter.pdf`,
    },
  });
}
