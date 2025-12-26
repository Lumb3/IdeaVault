class Formatter {
    constructor() {

    }
    htmlToPlainText(html) {
        const temp = document.createElement("div");
        temp.innerHTML = html;

        // Remove images entirely
        temp.querySelectorAll("img").forEach(img => img.remove());

        // Convert <br> to newline
        temp.querySelectorAll("br").forEach(br => br.replaceWith("\n"));

        // Convert block elements to newlines
        temp.querySelectorAll("div, p").forEach(el => {
            el.insertAdjacentText("afterend", "\n");
        });

        return temp.innerText.trim();
    }

    // Download as TXT
    downloadTXT(note, fileName) {
        const plainText = this.htmlToPlainText(note.content);

        const content =
            `${note.title}
${"=".repeat(note.title.length)}

${plainText}

---
Created: ${new Date(note.createdAt).toLocaleString()}
Last Updated: ${new Date(note.updatedAt).toLocaleString()}
`;

        this.downloadFileAsTxt(content, `${fileName}.txt`);
    }

    // Save TXT file
    downloadFileAsTxt(content, filename) {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }


    // Download as PDF
    downloadPDF(note, fileName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Title
        doc.setFontSize(20);
        doc.setFont(undefined, "bold");
        const titleLines = doc.splitTextToSize(note.title, maxWidth);
        doc.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 10 + 10;

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Content
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        const plainText = this.htmlToPlainText(note.content);
        const contentLines = doc.splitTextToSize(plainText, maxWidth);

        contentLines.forEach((line) => {
            if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 7;
        });

        // Metadata
        yPosition += 10;
        if (yPosition > pageHeight - margin - 20) {
            doc.addPage();
            yPosition = margin;
        }

        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Created: ${new Date(note.createdAt).toLocaleString()}`,
            margin,
            yPosition
        );
        yPosition += 5;
        doc.text(
            `Last Updated: ${new Date(note.updatedAt).toLocaleString()}`,
            margin,
            yPosition
        );

        doc.save(`${fileName}.pdf`);
    }


    // Download as DOCX
    async downloadDOCX(note, fileName) {
        try {
            console.log("Starting DOCX download for:", note.title);

            // Call the main process to generate DOCX
            const bufferArray = await window.authAPI.generateDocx({
                title: note.title,
                content: this.htmlToPlainText(note.content),
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            });

            console.log("Received buffer array, size:", bufferArray.length);

            // Convert array back to Uint8Array
            const buffer = new Uint8Array(bufferArray);

            // Create blob and download
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("DOCX downloaded successfully");
        } catch (error) {
            console.error("Error generating DOCX:", error);
            throw error;
        }
    }

}

export const formatter = new Formatter();