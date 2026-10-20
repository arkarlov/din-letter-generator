export function formDataToLetterInput(formData: FormData) {
  const values: Record<string, FormDataEntryValue> = {};

  formData.forEach((value, key) => {
    values[key] = value;
  });

  return {
    ...values,
    useReadyStamp: formData.has("useReadyStamp"),
  };
}
