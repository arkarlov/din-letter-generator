"use client";

import { useState } from "react";
import { useGenerateEnvelopePdf } from "@/hooks/usePdfGenerator";
import {
  envelopeFormatSchema,
  envelopeSchema,
  type EnvelopeData,
} from "@/lib/letter/envelope-schema";
import { Field } from "./form/Field";
import { TextareaField } from "./form/TextareaField";

const envelopeFormatLabels = {
  DL: "DL (110 × 220 mm)",
  C6: "C6 (114 × 162 mm)",
} satisfies Record<EnvelopeData["format"], string>;

export function EnvelopeFormPanel() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof EnvelopeData, string>>
  >({});
  const { isLoading, generatePdf } = useGenerateEnvelopePdf();

  const clearFieldError = (field: keyof EnvelopeData) => {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = envelopeSchema.safeParse(
      Object.fromEntries(formData.entries()),
    );

    if (!result.success) {
      const nextErrors: Partial<Record<keyof EnvelopeData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          (field === "sender" || field === "recipient") &&
          !nextErrors[field]
        ) {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
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

      <form id="envelope-form" onSubmit={submit} noValidate>
        <div className="space-y-5">
          <Field label="Envelope format" name="envelope-format">
            <select
              id="envelope-format"
              name="format"
              defaultValue="DL"
              className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
            >
              {envelopeFormatSchema.options.map((format) => (
                <option key={format} value={format}>
                  {envelopeFormatLabels[format]}
                </option>
              ))}
              {/* Add after format support and printer-size research:
              <option value="C5">C5 (162 × 229 mm)</option>
              <option value="C4">C4 (229 × 324 mm)</option>
              <option value="C3">C3 (324 × 458 mm)</option>
              */}
            </select>
          </Field>
          <TextareaField
            className="resize-y"
            label="Sender address"
            name="sender"
            rows={4}
            placeholder={"Max Mustermann\nMusterstraße 12\n12345 Berlin"}
            required
            error={fieldErrors.sender}
            onChange={() => clearFieldError("sender")}
          />
          <TextareaField
            className="resize-y"
            label="Recipient address"
            name="recipient"
            rows={5}
            placeholder={"Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt"}
            required
            error={fieldErrors.recipient}
            onChange={() => clearFieldError("recipient")}
          />
        </div>
      </form>

      <aside className="space-y-2 text-sm text-gray-600">
        <p>
          For international mail, write the address in Latin characters without
          blank lines. Put the destination country on the last line in uppercase
          (German, French, or English). Write the city in uppercase, preferably
          using its local spelling. If the destination uses another script, you
          may add that version below the Latin address.
        </p>
        <p className="whitespace-pre-line font-mono text-xs text-gray-500">
          {"Bruno Bertoni\nVia Italia 212\n20100 MILANO\nITALIEN"}
        </p>
      </aside>

      <button
        form="envelope-form"
        type="submit"
        disabled={isLoading}
        className="cursor-pointer rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
      >
        {isLoading ? "Generating PDF..." : "Generate envelope PDF"}
      </button>
    </div>
  );
}
