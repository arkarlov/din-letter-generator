"use client";

import { useState } from "react";
import { useGenerateLetterPdf } from "@/hooks/usePdfGenerator";
import { AddressFields } from "./form/AddressFields";
import { Field } from "./form/Field";
import { InputField } from "./form/InputField";
import { TextareaField } from "./form/TextareaField";
import { Switch } from "./form/Switch";
import { StampInfo } from "./StampInfo";
import { PdfRequestError } from "@/lib/api/pdf";
import { letterSchema, type LetterType } from "@/lib/letter/schema";
import { formatDateInputValue } from "@/lib/letter/date";
import { getFieldErrors, type FieldErrors } from "@/lib/letter/field-errors";

/** Form B first: it is the default and the more common layout. */
const LETTER_TYPE_LABELS = {
  B: "Form B (Standard)",
  A: "Form A (Hochgestellt)",
} satisfies Record<LetterType, string>;

const POSTAL_NOTES = [
  "Einschreiben",
  "Einschreiben Einwurf",
  "Einschreiben Rückschein",
  "Persönlich",
  "Vertraulich",
  "Persönlich/Vertraulich",
  "Bitte nachsenden",
  "Nicht nachsenden",
  "Wenn unzustellbar zurück",
  "Bei Umzug mit neuer Anschrift zurück",
];

export function LetterFormPanel() {
  const [useReadyStamp, setUseReadyStamp] = useState(false);
  const [useCustomInfoBlock, setUseCustomInfoBlock] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { isLoading, generatePdf } = useGenerateLetterPdf();

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
    const formData = new FormData(event.currentTarget);
    setError(null);

    try {
      const result = letterSchema.safeParse(formData);

      if (!result.success) {
        setFieldErrors(getFieldErrors(result.error));
        return;
      }

      setFieldErrors({});
      await generatePdf(result.data);
    } catch (caught) {
      if (caught instanceof PdfRequestError && caught.field) {
        const { field, message } = caught;
        setFieldErrors((previous) => ({ ...previous, [field]: message }));
        return;
      }

      setError(
        caught instanceof Error
          ? caught.message
          : "An unexpected error occurred",
      );
    }
  };

  return (
    <div className="space-y-5">
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
        <div className="space-y-5">
          <Field label="Letter format (DIN 5008)" id="letter-type">
            <select
              id="letter-type"
              name="letterType"
              defaultValue="B"
              className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
            >
              {Object.entries(LETTER_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <AddressFields
                variant="sender"
                legend="Sender"
                name="sender"
                id="letter-sender"
                errors={fieldErrors}
                onFieldChange={clearFieldError}
              />
              <Switch
                checked={useCustomInfoBlock}
                onChange={(checked) => {
                  setUseCustomInfoBlock(checked);
                  clearFieldError("customInfoBlock");
                }}
                label="Write the info block myself (default: sender address)"
              />
              {useCustomInfoBlock && (
                <TextareaField
                  className="resize-none"
                  label="Info block"
                  name="customInfoBlock"
                  rows={5}
                  placeholder={[
                    "Max Mustermann",
                    "Musterstraße 12",
                    "12345 Berlin",
                    "Telefon: 030 1234567",
                    "E-Mail: max@example.de",
                  ].join("\n")}
                  required
                  error={fieldErrors.customInfoBlock}
                  onChange={() => clearFieldError("customInfoBlock")}
                />
              )}
            </div>
            <div className="space-y-3">
              <Switch
                checked={useReadyStamp}
                name="useReadyStamp"
                onChange={(checked) => {
                  setUseReadyStamp(checked);
                  clearFieldError("recipient");
                }}
                label="Use Deutsche Post ready stamp (contains recipient address)"
              />

              {useReadyStamp ? (
                <StampInfo />
              ) : (
                <AddressFields
                  variant="recipient"
                  legend="Recipient"
                  name="recipient"
                  id="letter-recipient"
                  errors={fieldErrors}
                  onFieldChange={clearFieldError}
                />
              )}
            </div>
          </div>

          {!useReadyStamp && (
            <div className="space-y-3">
              <InputField
                label="Return line"
                name="returnLineOverride"
                placeholder="Leave empty to build it from the sender address"
                error={fieldErrors.returnLineOverride}
                onChange={() => clearFieldError("returnLineOverride")}
              />
              <InputField
                label="Postal note (Vermerk)"
                name="note"
                list="postal-notes"
                placeholder="For example Einschreiben"
                error={fieldErrors.note}
                onChange={() => clearFieldError("note")}
              />
              <datalist id="postal-notes">
                {POSTAL_NOTES.map((note) => (
                  <option key={note} value={note} />
                ))}
              </datalist>
            </div>
          )}

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
          {process.env.NODE_ENV !== "production" && (
            <Switch
              checked={showGuides}
              name="showGuides"
              onChange={setShowGuides}
              label="Show layout grid and zones in the PDF (debug)"
            />
          )}
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
