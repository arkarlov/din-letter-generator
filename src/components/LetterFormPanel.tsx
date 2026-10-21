"use client";

import { useState } from "react";
import { useGenerateLetterPdf } from "@/hooks/usePdfGenerator";
import { InputField } from "./form/InputField";
import { TextareaField } from "./form/TextareaField";
import { Switch } from "./form/Switch";
import { StampInfo } from "./StampInfo";
import { letterSchema, type LetterData } from "@/lib/letter/schema";
import { formatDateInputValue } from "@/lib/letter/date";
import {
  getLetterFieldErrors,
  type LetterFieldErrors,
} from "@/lib/letter/field-errors";

export function LetterFormPanel() {
  const [useReadyStamp, setUseReadyStamp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LetterFieldErrors>({});
  const { isLoading, generatePdf } = useGenerateLetterPdf();

  const clearFieldError = (field: keyof LetterData) => {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    try {
      const result = letterSchema.safeParse(formData);

      if (!result.success) {
        setFieldErrors(getLetterFieldErrors(result.error));
        return;
      }

      setFieldErrors({});
      await generatePdf(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "An unexpected error occurred",
      );
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form id="letter-form" onSubmit={submit} noValidate>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <Switch
                checked={useReadyStamp}
                name="useReadyStamp"
                onChange={(checked) => {
                  setUseReadyStamp(checked);
                  clearFieldError("recipientAddress");
                }}
                label="Use Deutsche Post ready stamp (contains recipient address)"
              />

              {useReadyStamp ? (
                <StampInfo />
              ) : (
                <>
                  <TextareaField
                    className="resize-none"
                    label="Recipient address"
                    name="recipientAddress"
                    rows={5}
                    placeholder={
                      "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt"
                    }
                    required
                    error={fieldErrors.recipientAddress}
                    onChange={() => clearFieldError("recipientAddress")}
                  />
                  <TextareaField
                    className="resize-none"
                    label="Return address"
                    name="returnAddress"
                    rows={3}
                    placeholder={
                      "Max Mustermann, Musterstraße 12, 12345 Berlin"
                    }
                  />
                </>
              )}
            </div>
            <div className="space-y-4">
              <TextareaField
                className="resize-none"
                label="Info block"
                name="infoBlock"
                rows={5}
                placeholder={"Max Mustermann\nMusterstraße 12\n12345 Berlin"}
                required
                error={fieldErrors.infoBlock}
                onChange={() => clearFieldError("infoBlock")}
              />
              <InputField
                label="Date"
                name="date"
                type="date"
                className="max-w-xs"
                defaultValue={formatDateInputValue(new Date())}
                required
                error={fieldErrors.date}
                onChange={() => clearFieldError("date")}
              />
            </div>
          </div>
          <TextareaField
            label="Subject"
            name="subject"
            rows={1}
            required
            error={fieldErrors.subject}
            onChange={() => clearFieldError("subject")}
          />
          <TextareaField
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
        className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
      >
        {isLoading ? "Generating PDF..." : "Generate PDF"}
      </button>
    </div>
  );
}
