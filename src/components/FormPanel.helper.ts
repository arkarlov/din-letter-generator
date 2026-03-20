const DEBUG_RECIPIENT_ADDRESS = `Frau Schmidt
Company Ltd.
Business Street 5
54321 Munich`;

const DEBUG_SENDER_ADDRESS = `Personal N:
8837789

John Doe
Example Street 12
4 OG, links,
12345 Berlin

Tel: +492341232515
e-mail: john@example.com`;

const DEBUG_RETURN_INFO = "John Doe, Example Street 12, 12345 Berlin";

export const parseFormData = (formData: FormData) => {
  const subject = formData.get("subject");
  const message = formData.get("message");
  const date = formData.get("date");

  if (!subject) {
    throw new Error("Subject is required");
  }
  if (!message) {
    throw new Error("Message is required");
  }
  if (!date) {
    throw new Error("Date is required");
  }
  console.log("Parsed form data:", [...formData]);
  const payload = {
    recipientAddress:
      formData.get("recipientAddress") || DEBUG_RECIPIENT_ADDRESS,
    senderAddress: formData.get("senderAddress") || DEBUG_SENDER_ADDRESS,
    subject,
    message,
    date,
    returnInfo: formData.get("returnInfo") || DEBUG_RETURN_INFO,
  };

  return payload;
};
