export function formDataToObject(formData: FormData) {
  const result: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    const path = key.split(".");
    const field = path.pop();

    if (!field) return;

    let target = result;
    for (const segment of path) {
      target = (target[segment] ??= {}) as Record<string, unknown>;
    }

    // An empty input inside an address leaves that optional value out. Its
    // parent object is still created: a rendered group, such as the contact
    // person behind its switch, must reach validation even when left empty.
    if (path.length > 0 && value === "") return;

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
