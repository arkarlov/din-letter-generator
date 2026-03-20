export const createPdf = async (payload: Record<string, unknown>) => {
  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let errorMessage = "Failed to generate PDF";
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const blob = await res.blob();

  return blob;
};
