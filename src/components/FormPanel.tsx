"use client";

import { useState } from "react";

export type FormPanelData = {
  recipientName: string;
  message: string;
  title: string;
};

export default function FormPanel() {
  const [formData, setFormData] = useState<FormPanelData>({} as FormPanelData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const print = () => {
    window.print();
  };

  return (
    <div className="bg-white p-4 space-y-4">
      <h2 className="text-lg font-bold">Form</h2>
      <label htmlFor="recipientName">Name</label>
      <input
        type="text"
        id="recipientName"
        name="recipientName"
        value={formData?.recipientName ?? ""}
        onChange={handleChange}
        placeholder="Name"
        className="w-full border p-2 rounded"
      />
      <label htmlFor="recipientName">Title</label>
      <input
        type="text"
        id="title"
        name="title"
        value={formData?.title ?? ""}
        onChange={handleChange}
        placeholder="Title"
        className="w-full border p-2 rounded"
      />
      <label htmlFor="message">message</label>
      <textarea
        id="message"
        name="message"
        value={formData?.message ?? ""}
        onChange={handleChange}
        placeholder="Message"
        className="w-full border p-2 rounded h-32"
      />

      <button
        className="bg-blue-400 text-white px-4 py-2 cursor-pointer"
        type="button"
        onClick={print}
      >
        Submit
      </button>
    </div>
  );
}
