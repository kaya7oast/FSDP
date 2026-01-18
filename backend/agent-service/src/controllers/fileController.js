import fs from "fs";
import { createRequire } from "module";
import { Document, Packer, Paragraph } from "docx";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js"); // Node-safe import

export const uploadAndConvertToWord = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Read uploaded file
    const buffer = fs.readFileSync(req.file.path);

    // Only handle PDFs
    if (!req.file.originalname.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Only PDF files supported" });
    }

    const pdfData = await pdfParse(buffer);

    const doc = new Document({
      sections: [
        {
          children: pdfData.text
            .split("\n")
            .map(line => new Paragraph(line)),
        },
      ],
    });

    const outputPath = `uploads/converted-${Date.now()}.docx`;
    const wordBuffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, wordBuffer);

    res.json({ message: "PDF converted successfully", wordFile: outputPath });
  } catch (err) {
    console.error("PDF convert error:", err);
    res.status(500).json({ error: err.message });
  }
};
