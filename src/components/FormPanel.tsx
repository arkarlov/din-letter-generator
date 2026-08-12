"use client";

import { useState } from "react";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { AddressField } from "./AddressField";
import { Input } from "./form/Input";
import { Textarea } from "./form/Textarea";
import { parseFormData } from "./FormPanel.helper";

export default function FormPanel() {
  const { isLoading, error, generatePdf } = usePdfGenerator();
  const [useReadyStamp, setUseReadyStamp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setFormError(null);
      const payload = parseFormData(formData);
      await generatePdf(payload);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
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

      {formError && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-red-700 text-sm">{formError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="useReadyStamp" className="inline-flex items-center gap-2">
              <input
                id="useReadyStamp"
                name="useReadyStamp"
                type="checkbox"
                className="h-4 w-4"
                checked={useReadyStamp}
                onChange={(e) => setUseReadyStamp(e.currentTarget.checked)}
              />
              <span className="text-sm">Use Deutsche Post ready stamp (contains recipient address)</span>
            </label>
          </div>

          {!useReadyStamp && (
            <AddressField
              label="Recipient address"
              name="recipientAddress"
              placeholder={`Musterfirma GmbH
Musterstraße 1
12345 Musterstadt`}
            />
          )}

          <Textarea
            className="resize-none"
            label="Return information"
            name="returnInfo"
            rows={3}
            placeholder={`Max Mustermann, Musterstraße 12, 12345 Berlin`}
          />
        </div>
        <div className="space-y-4">
          <AddressField
            label="Sender information"
            name="senderAddress"
            placeholder={`Max Mustermann
Musterstraße 12
12345 Berlin`}
            required
          />
          <Input
            label="Date"
            name="date"
            type="date"
            className="max-w-xs"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
          />
        </div>
      </div>

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
