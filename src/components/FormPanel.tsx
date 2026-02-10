"use client";

import { useState } from "react";

type LetterData = {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  subject: string;
  message: string;
};

export type FormPanelData = {
  recipientName: string;
  message: string;
  title: string;
};

export default function FormPanel() {
  const [formData, setFormData] = useState<LetterData>({
    recipientName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleDownload = async () => {
    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "letter.pdf";
    a.click();
  };

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Создание письма</h1>

      <input
        className="border p-2 w-full"
        name="recipientName"
        placeholder="Имя получателя"
        value={formData.recipientName}
        onChange={handleChange}
      />

      <input
        className="border p-2 w-full"
        name="addressLine1"
        placeholder="Адрес, строка 1"
        value={formData.addressLine1}
        onChange={handleChange}
      />

      <input
        className="border p-2 w-full"
        name="addressLine2"
        placeholder="Адрес, строка 2"
        value={formData.addressLine2}
        onChange={handleChange}
      />

      <input
        className="border p-2 w-full"
        name="subject"
        placeholder="Subject"
        value={formData.addressLine2}
        onChange={handleChange}
      />

      <textarea
        className="border p-2 w-full h-40"
        name="message"
        placeholder="Сообщение..."
        value={formData.message}
        onChange={handleChange}
      />

      <button
        onClick={handleDownload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Скачать PDF
      </button>
    </main>
  );
}
