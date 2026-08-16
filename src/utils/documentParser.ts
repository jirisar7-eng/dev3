import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up pdf.js worker URL for browser
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Extracts raw text from PDF, DOCX, or TXT File objects in the browser.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 1. PDF files
  if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdfDoc = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' ');
        if (pageText.trim()) {
          fullText += (fullText ? '\n\n' : '') + pageText.trim();
        }
      }

      if (!fullText.trim()) {
        throw new Error('Z PDF souboru se nepodařilo extrahovat žádný text. Pokud jde o naskenovaný dokument, převeďte jej pomocí OCR nebo vložte text ručně.');
      }
      return fullText;
    } catch (err: any) {
      if (err.message && err.message.includes('PDF')) {
        throw err;
      }
      throw new Error(`Chyba při čtení PDF souboru: ${err.message || 'Neplatný nebo poškozený formát'}`);
    }
  }

  // 2. DOCX files
  if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml') || fileType.includes('officedocument')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extracted = result.value.trim();
      if (!extracted) {
        throw new Error('Z DOCX dokumentu se nepodařilo načíst žádný text.');
      }
      return extracted;
    } catch (err: any) {
      throw new Error(`Chyba při čtení DOCX dokumentu: ${err.message || 'Neplatný nebo poškozený formát'}`);
    }
  }

  // 3. Fallback for TXT and plain text files
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Nepodařilo se načíst textový soubor.'));
    reader.readAsText(file, 'utf-8');
  });
}
