import { Document, Packer, Paragraph, TextRun } from 'docx';

export class DocumentExportService {
  /**
   * Zkopíruje text do schránky (clipboard)
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      return false;
    }
  }

  /**
   * Stáhne text jako prostý .txt soubor
   */
  static downloadTxt(text: string, filename: string): void {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Otevře nové okno a vyvolá tiskový dialog (lze Uložit jako PDF)
   */
  static printPdf(text: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="cs">
        <head>
          <meta charset="utf-8" />
          <title>Tisk dokumentu</title>
          <style>
            @page {
              size: A4;
              margin: 25mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .document-body {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              body {
                background: #fff;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-body">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  }

  /**
   * Vygeneruje a stáhne .docx dokument zachovávající odstavce
   */
  static async downloadDocx(text: string, filename: string): Promise<void> {
    // Rozdělíme text na odstavce (prázdný řádek odděluje odstavce)
    const paragraphs = text.split('\n');

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs.map((line) => {
            return new Paragraph({
              children: [new TextRun(line)],
              spacing: { after: 200 } // Mezera za odstavcem pro zachování čitelnosti
            });
          }),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
