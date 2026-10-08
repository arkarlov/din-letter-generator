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
  link.click();

  URL.revokeObjectURL(url);
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
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, generatePdf };
}
