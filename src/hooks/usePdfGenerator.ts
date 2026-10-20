"use client";

import { requestLetterPdf } from "@/lib/api/pdf";
import { LetterData } from "@/lib/letter/schema";
import { useState } from "react";

interface UsePdfGeneratorReturn {
  isLoading: boolean;
  generatePdf: (formData: LetterData) => Promise<void>;
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

export function useGeneratePdf(): UsePdfGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);

  const generatePdf = async (payload: LetterData) => {
    setIsLoading(true);

    try {
      const blob = await requestLetterPdf(payload);

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      downloadPdf(blob);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, generatePdf };
}
