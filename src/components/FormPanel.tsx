"use client";

import { useState } from "react";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { AddressField } from "./AddressField";
import { Input } from "./form/Input";
import { Textarea } from "./form/Textarea";
import { parseFormData } from "./FormPanel.helper";
import { Switch } from "./form/Switch";

export function StampInfo() {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h2 className="text-lg font-semibold">
        How to use an online stamp (Deutsche Post)
      </h2>

      <ol className="list-decimal pl-5 space-y-2">
        <li>
          Go to the{" "}
          <a
            href="https://shop.deutschepost.de/internetmarke"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Internetmarke drucken | Shop Deutsche Post
          </a>
        </li>
        <li>
          Select <strong>Standardbrief</strong>.
        </li>
        <li>
          Click <strong>Absender und Empfänger hinzufügen</strong> to add
          addresses.
        </li>
        <li>
          In <strong>Ausdruck auf</strong> select{" "}
          <strong>DIN A4 Normalpapier (Einlegeblatt)</strong>.
        </li>
        <li>Buy, Download and print the stamp PDF on an A4 sheet.</li>
        <li>
          Then print your letter on the same sheet, aligning it with the stamp.
        </li>
      </ol>

      <p className="text-xs text-gray-500">
        Tip: Make sure your printer settings are set to 100% scale (no
        resizing).
      </p>
    </div>
  );
}

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
          <Switch
            checked={useReadyStamp}
            onChange={setUseReadyStamp}
            label="Use Deutsche Post ready stamp (contains recipient address)"
          />

          {useReadyStamp ? (
            <>
              <StampInfo />
              <input type="hidden" name="useReadyStamp" value="on" />
            </>
          ) : (
            <>
              <AddressField
                label="Recipient address"
                name="recipientAddress"
                placeholder={`Musterfirma GmbH
Musterstraße 1
12345 Musterstadt`}
                required
              />
              <Textarea
                className="resize-none"
                label="Sender address"
                name="senderAddress"
                rows={3}
                placeholder={`Max Mustermann, Musterstraße 12, 12345 Berlin`}
              />
            </>
          )}
        </div>
        <div className="space-y-4">
          <AddressField
            label="Sender information"
            name="senderInfo"
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

      <Textarea label="Subject" name="subject" rows={1} required />
      <Textarea label="Message" name="message" rows={16} required />

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
