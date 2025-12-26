class Formatter {
    constructor() {}

    // Extract images with their base64 data
    extractImages(html) {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const images = [];
        
        temp.querySelectorAll("img").forEach((img, index) => {
            const src = img.src;
            // Check if it's a base64 image
            if (src.startsWith('data:image/')) {
                images.push({
                    index: index,
                    src: src,
                    alt: img.alt || `Image ${index + 1}`,
                    width: img.style.width || img.width,
                    height: img.style.height || img.height
                });
            }
        });
        
        return images;
    }

    // Convert HTML to plain text with proper newline handling
    htmlToPlainText(html, includeImagePlaceholders = true) {
        const temp = document.createElement("div");
        temp.innerHTML = html;

        // Replace images with placeholders if needed
        if (includeImagePlaceholders) {
            temp.querySelectorAll("img").forEach((img, index) => {
                const placeholder = document.createTextNode(`[Image ${index + 1}: ${img.alt || 'Untitled'}]`);
                img.replaceWith(placeholder);
            });
        } else {
            temp.querySelectorAll("img").forEach(img => img.remove());
        }

        // Convert <br> to newline
        temp.querySelectorAll("br").forEach(br => {
            br.replaceWith(document.createTextNode("\n"));
        });

        // Convert block elements to newlines
        temp.querySelectorAll("div, p, h1, h2, h3, h4, h5, h6").forEach(el => {
            const textNode = document.createTextNode("\n");
            el.appendChild(textNode);
        });

        // Get text and normalize line breaks
        let text = temp.textContent || temp.innerText;
        
        // Normalize multiple newlines to max 2
        text = text.replace(/\n{3,}/g, "\n\n");
        
        return text.trim();
    }

    // Download as TXT
    downloadTXT(note, fileName) {
        const plainText = this.htmlToPlainText(note.content, true);

        const content = `${note.title}
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

    // Download as PDF with image support
    async downloadPDF(note, fileName) {
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

        // Extract images
        const images = this.extractImages(note.content);
        
        // Content
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        
        // Parse HTML content with images
        const temp = document.createElement("div");
        temp.innerHTML = note.content;
        
        let imageIndex = 0;
        
        // Process content nodes
        const processNode = async (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    const lines = text.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            const textLines = doc.splitTextToSize(line, maxWidth);
                            textLines.forEach((textLine) => {
                                if (yPosition > pageHeight - margin) {
                                    doc.addPage();
                                    yPosition = margin;
                                }
                                doc.text(textLine, margin, yPosition);
                                yPosition += 7;
                            });
                        } else {
                            yPosition += 7; // Empty line spacing
                        }
                    });
                }
            } else if (node.nodeName === 'IMG') {
                const img = node;
                const src = img.src;
                
                if (src.startsWith('data:image/')) {
                    try {
                        // Add image to PDF
                        const imgWidth = Math.min(maxWidth, 150);
                        const imgHeight = imgWidth * 0.75; // Maintain aspect ratio
                        
                        if (yPosition + imgHeight > pageHeight - margin) {
                            doc.addPage();
                            yPosition = margin;
                        }
                        
                        doc.addImage(src, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + 10;
                        imageIndex++;
                    } catch (error) {
                        console.error("Error adding image to PDF:", error);
                        // Add placeholder text if image fails
                        doc.text(`[Image ${imageIndex + 1}]`, margin, yPosition);
                        yPosition += 7;
                        imageIndex++;
                    }
                }
            } else if (node.nodeName === 'BR') {
                yPosition += 7;
            } else if (node.childNodes) {
                for (let child of node.childNodes) {
                    await processNode(child);
                }
            }
        };
        
        for (let child of temp.childNodes) {
            await processNode(child);
        }

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

    // Download as DOCX with image support
    async downloadDOCX(note, fileName) {
        try {
            console.log("Starting DOCX download for:", note.title);

            // Extract images
            const images = this.extractImages(note.content);
            console.log("Extracted images:", images.length);
            console.log("First image data (if exists):", images[0]?.src?.substring(0, 50));
            
            // Get plain text content
            const plainText = this.htmlToPlainText(note.content, false);

            // Call the main process to generate DOCX
            const bufferArray = await window.authAPI.generateDocx({
                title: note.title,
                content: plainText,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                images: images // Pass images to main process
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