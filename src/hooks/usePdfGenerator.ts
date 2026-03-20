"use client";

import { createPdf } from "@/api/pdf";
import { useState } from "react";

interface UsePdfGeneratorReturn {
  isLoading: boolean;
  error: string | null;
  generatePdf: (formData: Record<string, unknown>) => Promise<void>;
  clearError: () => void;
}

const downloadPdf = (blob: Blob, filename = "letter.pdf") => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  window.URL.revokeObjectURL(url);
};

export function usePdfGenerator(): UsePdfGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const generatePdf = async (payload: Record<string, unknown>) => {
    clearError();
    setIsLoading(true);

    try {
      const blob = await createPdf(payload);

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      downloadPdf(blob);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("PDF generation error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, generatePdf, clearError };
}
