"use client";

import { useState } from "react";
import { useGenerateEnvelopePdf } from "@/hooks/usePdfGenerator";
import {
  envelopeFormatSchema,
  envelopeSchema,
  type EnvelopeData,
} from "@/lib/envelope/schema";
import { formDataToObject } from "@/lib/letter/form-data";
import { getFieldErrors, type FieldErrors } from "@/lib/letter/field-errors";
import { AddressFields } from "./form/AddressFields";
import { Field } from "./form/Field";

const envelopeFormatLabels = {
  DL: "DL (110 × 220 mm)",
  C6: "C6 (114 × 162 mm)",
} satisfies Record<EnvelopeData["format"], string>;

export function EnvelopeFormPanel() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { isLoading, generatePdf } = useGenerateEnvelopePdf();

  const clearFieldError = (field: string) => {
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
    const result = envelopeSchema.safeParse(formDataToObject(formData));

    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
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
    <div className="space-y-6">
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
        <div className="space-y-4">
          <Field label="Envelope format" id="envelope-format">
            <select
              id="envelope-format"
              name="format"
              defaultValue="DL"
              className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <AddressFields
              variant="sender"
              legend="Sender address"
              name="sender"
              id="envelope-sender"
              errors={fieldErrors}
              onFieldChange={clearFieldError}
            />
            <AddressFields
              variant="recipient"
              legend="Recipient address"
              name="recipient"
              id="envelope-recipient"
              errors={fieldErrors}
              onFieldChange={clearFieldError}
            />
          </div>
        </div>
      </form>

      <aside className="max-w-prose space-y-2 text-sm text-gray-600">
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
