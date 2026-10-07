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
