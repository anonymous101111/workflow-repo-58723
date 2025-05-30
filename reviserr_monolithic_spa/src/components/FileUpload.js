import React, { useState } from 'react';

/*
  PUBLIC_INTERFACE
  FileUpload: Handles file upload and client-side extraction for PDF/DOCX.
  onExtracted(text), onError(msg), onCancel()
*/

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

function FileUpload({ onExtracted, onError, onCancel }) {
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);

  // PUBLIC_INTERFACE
  // Extracts text client-side for PDF/DOCX
  const handleExtract = async () => {
    if (!file) {
      onError("No file selected.");
      return;
    }
    setExtracting(true);
    try {
      let text = '';
      if (file.type === "application/pdf") {
        text = await extractPDF(file);
      } else if (file.type.indexOf("word") !== -1 || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        text = await extractDocx(file);
      } else {
        throw new Error('Unsupported file type.');
      }
      if (!text || text.trim().length < 20) throw new Error("Unable to extract meaningful text. Is your file a valid document?");
      onExtracted(text.trim());
    } catch (e) {
      onError('Extraction failed: ' + e.message);
    } finally {
      setExtracting(false);
    }
  };

  // PDF extraction using PDF.js (client-side only!)
  // PUBLIC_INTERFACE
  async function extractPDF(file) {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
    // load worker code as needed
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";
    }
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function (e) {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const doc = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let textContent = '';
          for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            const page = await doc.getPage(pageNum);
            const txt = await page.getTextContent();
            textContent += txt.items.map(item => item.str).join(' ') + '\n\n';
          }
          resolve(textContent);
        } catch (err) {
          reject(new Error('PDF parsing error: ' + err.message));
        }
      };
      fileReader.onerror = (e) => reject(new Error("File read error."));
      fileReader.readAsArrayBuffer(file);
    });
  }

  // DOCX extraction using mammoth.js
  // PUBLIC_INTERFACE
  async function extractDocx(file) {
    // dynamic import from package root
    const mammoth = await import('mammoth');
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const { value: text } = await mammoth.extractRawText({ arrayBuffer });
          resolve(text);
        } catch (e) {
          reject(new Error('DOCX extract failed: ' + e.message));
        }
      };
      fileReader.onerror = () => reject(new Error("File read error."));
      fileReader.readAsArrayBuffer(file);
    });
  }

  // PUBLIC_INTERFACE
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|docx?)$/i)) {
      onError("Only PDF and Word files are supported.");
      return;
    }
    setFile(f);
    onError(""); // Clear error
  };

  // PUBLIC_INTERFACE
  const removeFile = () => setFile(null);

  return (
    <section className="hero" aria-label="Upload Study Material">
      <div style={{marginBottom:16}}>
        <div className="subtitle">1. Upload Study Material</div>
      </div>
      <label htmlFor="file-input" style={{display:'block'}} className="btn btn-large">
        {file ? "Change File" : "Choose PDF or Word File"}
        <input
          id="file-input"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={extracting}
          style={{ display: 'none' }}
          aria-label="Select study material file"
        />
      </label>
      <div style={{marginTop:8, color:'var(--text-secondary)'}}>
        {file && <span>Selected: {file.name} <button className="btn" style={{fontSize:'0.95em', padding:2, marginLeft:8}} onClick={removeFile} disabled={extracting}>Remove</button></span>}
      </div>
      <div style={{display:'flex', gap:12, justifyContent:'center', margin:'30px 0 8px 0'}}>
        <button className="btn btn-large" onClick={handleExtract} disabled={!file || extracting}>
          {extracting ? "Extracting..." : "Extract Text & Continue"}
        </button>
        <button className="btn" style={{background:'var(--border-color)', color:'var(--kavia-dark)'}} onClick={onCancel} disabled={extracting}>
          Cancel
        </button>
      </div>
      <ul style={{fontSize:'0.92em', color:'var(--text-secondary)', maxWidth:350, margin:'20px auto', textAlign:'left'}}>
        <li>Supported: PDF (.pdf), Word (.docx, .doc)</li>
        <li>File never leaves your computer; all processing is local</li>
        <li>For best results, use clean text documents</li>
      </ul>
    </section>
  );
}

export default FileUpload;
