export function formDataToObject(formData: FormData) {
  const result: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    const path = key.split(".");
    const field = path.pop();

    if (!field) return;
    // An empty input inside an address means that optional part is absent.
    if (path.length > 0 && value === "") return;

    let target = result;
    for (const segment of path) {
      target = (target[segment] ??= {}) as Record<string, unknown>;
    }

    target[field] = value;
  });

  return result;
}

export function formDataToLetterInput(formData: FormData) {
  return {
    ...formDataToObject(formData),
    useReadyStamp: formData.has("useReadyStamp"),
    showGuides: formData.has("showGuides"),
  };
}
