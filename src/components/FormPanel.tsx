"use client";

import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { AddressField } from "./AddressField";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

export default function FormPanel() {
  const { isLoading, error, generatePdf } = usePdfGenerator();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await generatePdf(formData);
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
          />
          <Textarea
            className="resize-none"
            label="Return information"
            name="returnInfo"
            rows={3}
            placeholder={`John Doe, Example Street 12, 12345 Berlin`}
          />
        </div>
        <div className="space-y-4">
          <AddressField
            label="Sender address"
            name="senderAddress"
            placeholder={`John Doe
Example Street 12
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
