"use client";

import { useState } from "react";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { pdfDataSchema, type PdfData } from "./pdf/types";
import { Input } from "./form/Input";
import { Textarea } from "./form/Textarea";
import { Switch } from "./form/Switch";
import { StampInfo } from "./StampInfo";

export default function FormPanel() {
  const { isLoading, error, generatePdf } = usePdfGenerator();
  const [useReadyStamp, setUseReadyStamp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof PdfData, string>>
  >({});

  const clearFieldError = (field: keyof PdfData) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setFormError(null);
      const result = pdfDataSchema.safeParse(formData);
      if (!result.success) {
        const errors: Partial<Record<keyof PdfData, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && !errors[field as keyof PdfData]) {
            errors[field as keyof PdfData] = issue.message;
          }
        }
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      await generatePdf(result.data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
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

      <form id="letter-form" onSubmit={submit} noValidate>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <Switch
                checked={useReadyStamp}
                onChange={(checked) => {
                  setUseReadyStamp(checked);
                  clearFieldError("recipientAddress");
                }}
                label="Use Deutsche Post ready stamp (contains recipient address)"
              />

              {useReadyStamp ? (
                <>
                  <StampInfo />
                  <input type="hidden" name="useReadyStamp" value="on" />
                </>
              ) : (
                <>
                  <Textarea
                    className="resize-none"
                    label="Recipient address"
                    name="recipientAddress"
                    rows={5}
                    placeholder={`Musterfirma GmbH
Musterstraße 1
12345 Musterstadt`}
                    required
                    error={fieldErrors.recipientAddress}
                    onChange={() => clearFieldError("recipientAddress")}
                  />
                  <Textarea
                    className="resize-none"
                    label="Return address"
                    name="returnAddress"
                    rows={3}
                    placeholder={`Max Mustermann, Musterstraße 12, 12345 Berlin`}
                  />
                </>
              )}
            </div>
            <div className="space-y-4">
              <Textarea
                className="resize-none"
                label="Info block"
                name="infoBlock"
                rows={5}
                placeholder={`Max Mustermann
Musterstraße 12
12345 Berlin`}
                required
                error={fieldErrors.infoBlock}
                onChange={() => clearFieldError("infoBlock")}
              />
              <Input
                label="Date"
                name="date"
                type="date"
                className="max-w-xs"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                error={fieldErrors.date}
                onChange={() => clearFieldError("date")}
              />
            </div>
          </div>
          <Textarea
            label="Subject"
            name="subject"
            rows={1}
            required
            error={fieldErrors.subject}
            onChange={() => clearFieldError("subject")}
          />
          <Textarea
            label="Message"
            name="message"
            rows={16}
            required
            error={fieldErrors.message}
            onChange={() => clearFieldError("message")}
          />
        </div>
      </form>

      <button
        form="letter-form"
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating PDF..." : "Generate PDF"}
      </button>
    </div>
  );
}
