import pdf from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extract text from file buffer
 */
export async function extractText(fileBuffer, mimeType) {
  if (!fileBuffer) throw new Error("No file buffer provided");

  if (mimeType === "application/pdf") {
    const data = await pdf(fileBuffer);
    return data.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  throw new Error("Unsupported file type");
}
