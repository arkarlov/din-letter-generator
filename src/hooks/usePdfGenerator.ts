"use client";

import { requestEnvelopePdf, requestLetterPdf } from "@/lib/api/pdf";
import type { EnvelopeData } from "@/lib/letter/envelope-schema";
import type { LetterData } from "@/lib/letter/schema";
import { useState } from "react";

interface UsePdfGeneratorReturn<Payload> {
  isLoading: boolean;
  generatePdf: (formData: Payload) => Promise<void>;
}

const downloadPdf = (blob: Blob, filename = "letter.pdf") => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function usePdfGenerator<Payload>(
  requestPdf: (payload: Payload) => Promise<Blob>,
  filename: string,
): UsePdfGeneratorReturn<Payload> {
  const [isLoading, setIsLoading] = useState(false);

  const generatePdf = async (payload: Payload) => {
    setIsLoading(true);

    try {
      const blob = await requestPdf(payload);

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      downloadPdf(blob, filename);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, generatePdf };
}

export function useGenerateLetterPdf() {
  return usePdfGenerator<LetterData>(requestLetterPdf, "letter.pdf");
}

export function useGenerateEnvelopePdf() {
  return usePdfGenerator<EnvelopeData>(requestEnvelopePdf, "envelope.pdf");
}
