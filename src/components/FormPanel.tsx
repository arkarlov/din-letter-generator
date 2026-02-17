"use client";

import { AddressField } from "./AddressField";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

export default function FormPanel() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      recipientAddress:
        formData.get("recipientAddress") ||
        `Company Ltd.
Business Street 5
54321 Munich`,
      senderAddress:
        formData.get("senderAddress") ||
        `John Doe
Example Street 12
12345 Berlin`,
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "letter.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Letter</h1>

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

      <Input label="Subject" name="subject" required />

      <Textarea label="Message" name="message" rows={8} required />

      <button
        type="submit"
        className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 hover:cursor-pointer"
      >
        Generate PDF
      </button>
    </form>
  );
}
