"use client";

import { useState } from "react";
import { EnvelopeFormPanel } from "./EnvelopeFormPanel";
import { LetterFormPanel } from "./LetterFormPanel";

export default function FormPanel() {
  const [activeTab, setActiveTab] = useState<"letter" | "envelope">("letter");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        {activeTab === "letter" ? "Create Letter" : "Create Envelope"}
      </h1>

      <div
        role="tablist"
        aria-label="Document type"
        className="flex gap-6 border-b border-gray-200"
      >
        <button
          id="letter-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "letter"}
          aria-controls="letter-panel"
          onClick={() => setActiveTab("letter")}
          className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium ${activeTab === "letter" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
        >
          Letter
        </button>
        <button
          id="envelope-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "envelope"}
          aria-controls="envelope-panel"
          onClick={() => setActiveTab("envelope")}
          className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium ${activeTab === "envelope" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
        >
          Envelope
        </button>
      </div>

      <section
        id="letter-panel"
        role="tabpanel"
        aria-labelledby="letter-tab"
        hidden={activeTab !== "letter"}
      >
        {activeTab === "letter" && <LetterFormPanel />}
      </section>

      <section
        id="envelope-panel"
        role="tabpanel"
        aria-labelledby="envelope-tab"
        hidden={activeTab !== "envelope"}
      >
        {activeTab === "envelope" && <EnvelopeFormPanel />}
      </section>
    </div>
  );
}
