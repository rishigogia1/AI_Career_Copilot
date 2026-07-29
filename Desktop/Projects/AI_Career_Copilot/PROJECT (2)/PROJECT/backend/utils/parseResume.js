import fs from "fs";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const parseResume = async (filePath) => {
  try {
    // 🔹 Validate file path
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = filePath.split(".").pop().toLowerCase();

    let text = "";

    if (ext === "pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfParser = new PDFParse({ data: dataBuffer });
      const result = await pdfParser.getText();
      text = result.text;
      await pdfParser.destroy();

    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;

    } else {
      throw new Error(`Unsupported file format: .${ext}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Resume is empty or unreadable");
    }

    return text;

  } catch (error) {
    console.error("❌ Parse resume error:", error.message);
    throw error;
  }
};