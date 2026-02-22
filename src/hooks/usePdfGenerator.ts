"use client";

import { useState } from "react";

interface UsePdfGeneratorReturn {
  isLoading: boolean;
  error: string | null;
  generatePdf: (formData: FormData) => Promise<void>;
  clearError: () => void;
}

const DEBUG_RECIPIENT_ADDRESS = `Frau Schmidt
Company Ltd.
Business Street 5
54321 Munich`;

const DEBUG_SENDER_ADDRESS = `Personal N:
8837789

John Doe
Example Street 12
4 OG, links,
12345 Berlin

Tel: +492341232515
e-mail: john@example.com`;

const DEBUG_RETURN_INFO = "John Doe, Example Street 12, 12345 Berlin";

export function usePdfGenerator(): UsePdfGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const generatePdf = async (formData: FormData) => {
    clearError();
    setIsLoading(true);

    try {
      const subject = formData.get("subject") as string;
      const message = formData.get("message") as string;
      const date = formData.get("date") as string;

      if (!subject?.trim()) {
        throw new Error("Subject is required");
      }
      if (!message?.trim()) {
        throw new Error("Message is required");
      }
      if (!date) {
        throw new Error("Date is required");
      }

      const payload = {
        recipientAddress:
          (formData.get("recipientAddress") as string) ||
          DEBUG_RECIPIENT_ADDRESS,
        senderAddress:
          (formData.get("senderAddress") as string) || DEBUG_SENDER_ADDRESS,
        subject,
        message,
        date,
        returnInfo: (formData.get("returnInfo") as string) || DEBUG_RETURN_INFO,
      };

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorMessage = "Failed to generate PDF";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Process response
      const blob = await res.blob();

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      // Download PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "letter.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
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
