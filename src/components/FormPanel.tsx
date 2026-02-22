"use client";

import { useState } from "react";
import { AddressField } from "./AddressField";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

export default function FormPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const subject = formData.get("subject") as string;
      const message = formData.get("message") as string;
      const date = formData.get("date") as string;

      // Validate required fields
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
          formData.get("recipientAddress") ||
          `Frau Schmidt
Company Ltd.
Business Street 5
54321 Munich`,
        senderAddress:
          formData.get("senderAddress") ||
          `Personal N:
8837789

John Doe
Example Street 12
4 OG, links,
12345 Berlin

Tel: +492341232515
e-mail: john@example.com`,
        subject,
        message,
        date,
        returnInfo: String(
          formData.get("returnInfo") ||
            "John Doe, Example Street 12, 12345 Berlin",
        ),
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
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await res.blob();

      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "letter.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("PDF generation error:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Letter</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <AddressField
            label="Recipient address"
            name="recipientAddress"
            placeholder={`Company Ltd.
Business Street 5
54321 Munich`}
            // required
          />
        </div>
        <div className="space-y-4">
          <AddressField
            label="Sender address"
            name="senderAddress"
            placeholder={`John Doe
Example Street 12
12345 Berlin`}
          />
        </div>
      </div>

      <Textarea
        label="Return information"
        name="returnInfo"
        rows={3}
        placeholder={`Company Ltd.
Do not forward!
Registered mail`}
      />

      <Input
        label="Date"
        name="date"
        type="date"
        className="max-w-xs"
        defaultValue={new Date().toISOString().split("T")[0]}
        required
      />

      <Input label="Subject" name="subject" required />

      <Textarea label="Message" name="message" rows={8} required />

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating PDF..." : "Generate PDF"}
      </button>
    </form>
  );
}
