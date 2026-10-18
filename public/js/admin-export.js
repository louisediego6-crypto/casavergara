

(function () {
  function getReservations() {
    return typeof window.getStoredReservations === "function" ? window.getStoredReservations() : [];
  }

  function toIsoDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw).slice(0, 10) : d.toISOString().slice(0, 10);
  }

  function recordDateIso(r) {
    return toIsoDate(r.checkIn || r.checkInDate || r.preferredDate || r.eventDate || "");
  }

  function filterRecords(records, { from = "", to = "", status = "all", room = "all" } = {}) {
    return records.filter((r) => {
      const iso = recordDateIso(r);
      if (from && iso && iso < from) return false;
      if (to && iso && iso > to) return false;
      if (status !== "all" && (r.paymentStatus || "") !== status) return false;
      if (room !== "all" && (r.roomName || r.eventType || "") !== room) return false;
      return true;
    });
  }

  function fmtDate(raw) {
    if (!raw) return "\u2014";
    const d = new Date(raw);
    return Number.isNaN(d.getTime())
      ? String(raw)
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  const REPORT_COLUMNS = {
    reservation: [
      ["id", "Reservation ID"],
      ["customerName", "Guest"],
      ["roomOrEvent", "Room / Event"],
      ["checkIn", "Check-in"],
      ["checkOut", "Check-out"],
      ["guests", "Guests"],
      ["totalAmount", "Amount"],
      ["paymentStatus", "Payment Status"],
      ["quoteStatus", "Quotation"],
    ],
    booking: [
      ["id", "Booking ID"],
      ["customerName", "Guest"],
      ["roomOrEvent", "Room / Event"],
      ["checkIn", "Check-in"],
      ["checkOut", "Check-out"],
      ["guests", "Guests"],
      ["totalAmount", "Amount"],
      ["paymentStatus", "Status"],
    ],
    payment: [
      ["id", "Reservation ID"],
      ["customerName", "Customer Name"],
      ["dateReserved", "Date Reserved"],
      ["totalAmount", "Amount"],
      ["proofRef", "Proof of Payment"],
      ["paymentStatus", "Payment Status"],
    ],
    schedule: [
      ["id", "Reservation ID"],
      ["customerName", "Guest"],
      ["roomOrEvent", "Room / Event"],
      ["checkIn", "Check-in / Event date"],
      ["checkOut", "Check-out"],
      ["guests", "Guests"],
    ],
  };

  function toRow(r) {
    return {
      id: r.id || "",
      customerName: r.customerName || "",
      roomOrEvent: r.roomName || r.eventType || "",
      checkIn: fmtDate(r.checkIn || r.preferredDate),
      checkOut: fmtDate(r.checkOut || r.preferredDate),
      guests: String(r.guests || r.guestsLabel || r.eventGuests || ""),
      totalAmount: r.totalAmount || "",
      paymentStatus: r.paymentStatus || "",
      quoteStatus: r.quotation?.status || "\u2014",
      dateReserved: fmtDate(r.createdAt || r.reservedAt || r.checkIn || r.preferredDate),
      proofRef: r.proofOfPayment?.filename || r.proofOfPayment?.storageRef || "\u2014",
    };
  }

  function buildDataset(records, reportType) {
    const columns = REPORT_COLUMNS[reportType] || REPORT_COLUMNS.reservation;
    return { columns, rows: records.map(toRow) };
  }

  function toCsv({ columns, rows }) {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map(([, label]) => esc(label)).join(",")];
    rows.forEach((row) => lines.push(columns.map(([key]) => esc(row[key])).join(",")));
    return lines.join("\r\n");
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function safeStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ---------- System logo (images/logo.png) ---------- */
  let cachedLogo = null;
  let logoPromise = null;

  function loadLogo() {
    if (logoPromise) return logoPromise;
    logoPromise = new Promise((resolve) => {
      let url = "../../images/logo.png";
      try {
        if (typeof window.assetUrl === "function") url = window.assetUrl("images/logo.png");
        else if (typeof assetUrl === "function") url = assetUrl("images/logo.png");
      } catch (e) { /* keep default */ }
      const img = new Image();
      img.onload = () => {
        const out = { url: img.src, ratio: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1 };
        try {
          const h = 256;
          const w = Math.round(h * out.ratio);
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          const dataUrl = c.toDataURL("image/png");
          const bin = atob(dataUrl.split(",")[1]);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          out.dataUrl = dataUrl;
          out.bytes = bytes;
        } catch (e) { /* embedding unavailable; preview/print still use the URL */ }
        cachedLogo = out;
        resolve(out);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
    return logoPromise;
  }

  function setLogo(logo) {
    cachedLogo = logo;
    logoPromise = Promise.resolve(logo);
  }

  setTimeout(loadLogo, 0);

  function exportCsv(dataset, baseName) {

    downloadBlob("\ufeff" + toCsv(dataset), `${baseName}-${safeStamp()}.csv`, "text/csv;charset=utf-8;");
  }

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function zipStore(files, mime) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;

    const num = (value, size) => {
      const out = new Uint8Array(size);
      let v = value;
      for (let i = 0; i < size; i++) {
        out[i] = v & 0xff;
        v = Math.floor(v / 256);
      }
      return out;
    };
    const push = (arr, target) => {
      target.push(arr);
      return arr.length;
    };

    files.forEach(({ name, content }) => {
      const nameBytes = enc.encode(name);
      const data = content instanceof Uint8Array ? content : enc.encode(content);
      const crc = crc32(data);
      const local = [];
      push(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), local);
      push(num(20, 2), local);
      push(num(0, 2), local);
      push(num(0, 2), local);
      push(num(0, 2), local);
      push(num(0, 2), local);
      push(num(crc, 4), local);
      push(num(data.length, 4), local);
      push(num(data.length, 4), local);
      push(num(nameBytes.length, 2), local);
      push(num(0, 2), local);
      push(nameBytes, local);
      push(data, local);
      const localSize = local.reduce((sum, a) => sum + a.length, 0);

      const cd = [];
      push(new Uint8Array([0x50, 0x4b, 0x01, 0x02]), cd);
      push(num(20, 2), cd);
      push(num(20, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 2), cd);
      push(num(crc, 4), cd);
      push(num(data.length, 4), cd);
      push(num(data.length, 4), cd);
      push(num(nameBytes.length, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 2), cd);
      push(num(0, 4), cd);
      push(num(offset, 4), cd);
      push(nameBytes, cd);

      chunks.push(...local);
      central.push(...cd);
      offset += localSize;
    });

    const centralSize = central.reduce((sum, a) => sum + a.length, 0);
    const end = [
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
      num(0, 2),
      num(0, 2),
      num(files.length, 2),
      num(files.length, 2),
      num(centralSize, 4),
      num(offset, 4),
      num(0, 2),
    ];

    return new Blob([...chunks, ...central, ...end], {
      type: mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  }

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function docxParagraph(text, { bold = false, size = 22, color = "333333", italic = false } = {}) {
    return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}${
      italic ? "<w:i/>" : ""
    }<w:color w:val="${color}"/><w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
  }

  function docxCell(text, width, { header = false } = {}) {
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${
      header ? '<w:shd w:val="clear" w:color="auto" w:fill="0C3B5D"/>' : ""
    }</w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr>${header ? "<w:b/>" : ""}<w:color w:val="${
      header ? "FFFFFF" : "333333"
    }"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p></w:tc>`;
  }

  function exportDocx(dataset, title, baseName) {
    const totalWidth = 14400;
    const colWidth = Math.floor(totalWidth / Math.max(dataset.columns.length, 1));
    const headerRow = `<w:tr>${dataset.columns
      .map(([, label]) => docxCell(label, colWidth, { header: true }))
      .join("")}</w:tr>`;
    const bodyRows = dataset.rows
      .map(
        (row) =>
          `<w:tr>${dataset.columns.map(([key]) => docxCell(row[key] ?? "", colWidth)).join("")}</w:tr>`,
      )
      .join("");
    const emptyRow = dataset.rows.length
      ? ""
      : `<w:tr>${docxCell("No records match the selected filters.", totalWidth)}</w:tr>`;

    const logo = cachedLogo && cachedLogo.bytes ? cachedLogo : null;
    const logoH = 594360; // 0.65 inch in EMU
    const logoW = logo ? Math.round(logoH * logo.ratio) : 0;
    const logoParagraph = logo
      ? `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${logoW}" cy="${logoH}"/><wp:docPr id="1" name="Logo"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${logoW}" cy="${logoH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
      : "";

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>
${logoParagraph}
${docxParagraph("Casa Vergara Resort", { bold: true, size: 32, color: "0C3B5D" })}
${docxParagraph(title, { bold: true, size: 24, color: "0C3B5D" })}
${docxParagraph(`Generated ${new Date().toLocaleString()} \u2014 ${dataset.rows.length} record(s)`, {
  size: 18,
  color: "5A5A5A",
})}
<w:tbl><w:tblPr><w:tblW w:w="${totalWidth}" w:type="dxa"/><w:tblBorders>
<w:top w:val="single" w:sz="4" w:color="C9D8E6"/><w:left w:val="single" w:sz="4" w:color="C9D8E6"/>
<w:bottom w:val="single" w:sz="4" w:color="C9D8E6"/><w:right w:val="single" w:sz="4" w:color="C9D8E6"/>
<w:insideH w:val="single" w:sz="4" w:color="C9D8E6"/><w:insideV w:val="single" w:sz="4" w:color="C9D8E6"/>
</w:tblBorders></w:tblPr>${headerRow}${bodyRows}${emptyRow}</w:tbl>
${docxParagraph("Generated automatically by the Casa Vergara admin portal.", { size: 16, color: "8A8A8A", italic: true })}
<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>
</w:body></w:document>`;

    const blob = zipStore([
      {
        name: "[Content_Types].xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo ? '<Default Extension="png" ContentType="image/png"/>' : ""}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
      },
      {
        name: "_rels/.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
      },
      { name: "word/document.xml", content: documentXml },
      ...(logo
        ? [
            {
              name: "word/_rels/document.xml.rels",
              content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>`,
            },
            { name: "word/media/logo.png", content: logo.bytes },
          ]
        : []),
    ]);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}-${safeStamp()}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  function exportPdf(dataset, title, baseName) {
    const jsPdfLib = window.jspdf?.jsPDF;
    if (!jsPdfLib) {
      window.alert("PDF export isn't available on this page right now. Please try again in a moment.");
      return false;
    }
    const doc = new jsPdfLib({
      unit: "pt",
      format: "a4",
      orientation: dataset.columns.length > 6 ? "landscape" : "portrait",
    });
    const marginLeft = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const bottomLimit = doc.internal.pageSize.getHeight() - 50;
    const usableWidth = pageWidth - marginLeft * 2;
    const colWidth = usableWidth / dataset.columns.length;
    const rowHeight = 20;
    let y = 50;

    doc.setFillColor(12, 59, 93);
    doc.rect(0, 0, pageWidth, 64, "F");
    let textX = marginLeft;
    if (cachedLogo && cachedLogo.dataUrl) {
      try {
        const lh = 48;
        const lw = lh * cachedLogo.ratio;
        doc.addImage(cachedLogo.dataUrl, "PNG", marginLeft, 8, lw, lh);
        textX = marginLeft + lw + 12;
      } catch (e) { /* skip logo if it can't be drawn */ }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Casa Vergara Resort", textX, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(title, textX, 48);

    y = 92;
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(9);
    doc.text(`Generated ${new Date().toLocaleString()}`, marginLeft, y);
    y += 20;

    function drawHeader() {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(12, 59, 93);
      doc.setDrawColor(220, 230, 240);
      doc.line(marginLeft, y, pageWidth - marginLeft, y);
      y += 14;
      dataset.columns.forEach(([, label], i) => doc.text(String(label), marginLeft + i * colWidth, y));
      y += 8;
      doc.line(marginLeft, y, pageWidth - marginLeft, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
    }

    drawHeader();
    dataset.rows.forEach((row) => {
      if (y > bottomLimit) {
        doc.addPage();
        y = 50;
        drawHeader();
      }
      dataset.columns.forEach(([key], i) => {
        const text = String(row[key] ?? "");
        doc.text(text.length > 30 ? text.slice(0, 29) + "\u2026" : text, marginLeft + i * colWidth, y);
      });
      y += rowHeight;
    });

    if (!dataset.rows.length) {
      doc.setFont("helvetica", "italic");
      doc.text("No records match the selected filters.", marginLeft, y);
    }

    doc.save(`${baseName}-${safeStamp()}.pdf`);
    return true;
  }


  /* ---------- Excel (.xlsx) export + print preview ---------- */

  function colLetter(i) {
    let n = i + 1, out = "";
    while (n > 0) {
      const r = (n - 1) % 26;
      out = String.fromCharCode(65 + r) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out;
  }

  function xlsxCell(ref, text, style) {
    return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
  }

  function buildXlsxBlob(dataset, title) {
    const cols = dataset.columns;
    const widths = cols.map(([key, label]) => {
      let max = String(label).length;
      dataset.rows.forEach((r) => { max = Math.max(max, String(r[key] ?? "").length); });
      return Math.min(Math.max(max + 3, 12), 45);
    });
    const lastCol = colLetter(Math.max(cols.length - 1, 0));
    const logo = cachedLogo && cachedLogo.bytes && cols.length > 1 ? cachedLogo : null;
    if (logo) widths[0] = Math.max(widths[0], 14);
    const tc = logo ? "B" : "A";
    const rowsXml = [];
    const rowAttr = (n, ht) => (logo ? ` ht="${ht}" customHeight="1"` : "");
    rowsXml.push(`<row r="1"${rowAttr(1, 26)}>${xlsxCell(tc + "1", "Casa Vergara Resort", 1)}</row>`);
    rowsXml.push(`<row r="2"${rowAttr(2, 20)}>${xlsxCell(tc + "2", title, 2)}</row>`);
    rowsXml.push(
      `<row r="3"${rowAttr(3, 18)}>${xlsxCell(tc + "3", `Generated ${new Date().toLocaleString()} \u2014 ${dataset.rows.length} record(s)`, 4)}</row>`,
    );
    rowsXml.push(`<row r="5">${cols.map(([, label], i) => xlsxCell(colLetter(i) + "5", label, 3)).join("")}</row>`);
    dataset.rows.forEach((row, ri) => {
      const rn = 6 + ri;
      rowsXml.push(
        `<row r="${rn}">${cols.map(([key], i) => xlsxCell(colLetter(i) + rn, row[key] ?? "", 5)).join("")}</row>`,
      );
    });
    if (!dataset.rows.length) {
      rowsXml.push(`<row r="6">${xlsxCell("A6", "No records match the selected filters.", 4)}</row>`);
    }
    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols>${widths
      .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
      .join("")}</cols><sheetData>${rowsXml.join("")}</sheetData><pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>${logo ? '<drawing r:id="rId1"/>' : ""}</worksheet>`;
    void lastCol;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF0C3B5D"/><name val="Calibri"/></font><font><b/><sz val="12"/><color rgb="FF0C3B5D"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF5A5A5A"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0C3B5D"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFC9D8E6"/></left><right style="thin"><color rgb="FFC9D8E6"/></right><top style="thin"><color rgb="FFC9D8E6"/></top><bottom style="thin"><color rgb="FFC9D8E6"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs>
</styleSheet>`;

    const logoPx = 64;
    const logoEmuH = logoPx * 9525;
    const logoEmuW = logo ? Math.round(logoEmuH * logo.ratio) : 0;
    const drawingXml = logo
      ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>47625</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>47625</xdr:rowOff></xdr:from><xdr:ext cx="${logoEmuW}" cy="${logoEmuH}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Logo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${logoEmuW}" cy="${logoEmuH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`
      : "";
    const logoParts = logo
      ? [
          { name: "xl/drawings/drawing1.xml", content: drawingXml },
          {
            name: "xl/drawings/_rels/drawing1.xml.rels",
            content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo.png"/></Relationships>`,
          },
          {
            name: "xl/worksheets/_rels/sheet1.xml.rels",
            content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`,
          },
          { name: "xl/media/logo.png", content: logo.bytes },
        ]
      : [];

    return zipStore(
      [
        {
          name: "[Content_Types].xml",
          content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo ? '<Default Extension="png" ContentType="image/png"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ""}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
        },
        {
          name: "_rels/.rels",
          content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        },
        {
          name: "xl/workbook.xml",
          content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        },
        {
          name: "xl/_rels/workbook.xml.rels",
          content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
        },
        { name: "xl/styles.xml", content: stylesXml },
        { name: "xl/worksheets/sheet1.xml", content: sheetXml },
        ...logoParts,
      ],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }

  function exportXlsx(dataset, title, baseName) {
    const blob = buildXlsxBlob(dataset, title);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}-${safeStamp()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  function buildPrintableHtml(dataset, title) {
    const logoSrc = cachedLogo ? cachedLogo.dataUrl || cachedLogo.url || "" : "";
    const head = dataset.columns.map(([, label]) => `<th>${xmlEscape(label)}</th>`).join("");
    const body = dataset.rows.length
      ? dataset.rows
          .map((r) => `<tr>${dataset.columns.map(([key]) => `<td>${xmlEscape(r[key] ?? "")}</td>`).join("")}</tr>`)
          .join("")
      : `<tr><td colspan="${dataset.columns.length}" class="empty">No records match the selected filters.</td></tr>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${xmlEscape(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 0; }
  h1 { font-size: 20px; color: #0c3b5d; margin: 0 0 2px; }
  h2 { font-size: 14px; color: #0c3b5d; margin: 0 0 4px; }
  .meta { font-size: 11px; color: #666; }
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #0c3b5d; }
  .logo { height: 64px; width: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #0c3b5d; color: #fff; text-align: left; padding: 6px 8px; border: 1px solid #0c3b5d; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  td { padding: 5px 8px; border: 1px solid #c9d8e6; }
  tr:nth-child(even) td { background: #f5f9fc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead { display: table-header-group; } tr { page-break-inside: avoid; }
  .empty { text-align: center; color: #777; padding: 18px; font-style: italic; }
</style></head><body>
<div class="brand">${logoSrc ? `<img class="logo" src="${xmlEscape(logoSrc)}" alt="Casa Vergara">` : ""}<div><h1>Casa Vergara Resort</h1><h2>${xmlEscape(title)}</h2>
<div class="meta">Generated ${xmlEscape(new Date().toLocaleString())} &mdash; ${dataset.rows.length} record(s)</div>${dataset.subtitle ? `<div class="meta">${xmlEscape(dataset.subtitle)}</div>` : ""}</div></div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  }

  function printDataset(dataset, title) {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(buildPrintableHtml(dataset, title));
    doc.close();
    let printed = false;
    const go = () => {
      if (printed) return;
      printed = true;
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } finally {
        setTimeout(() => frame.remove(), 2000);
      }
    };
    const imgs = Array.from(doc.images);
    if (imgs.length && !imgs.every((i) => i.complete)) {
      let pending = imgs.filter((i) => !i.complete).length;
      const done = () => { if (--pending <= 0) setTimeout(go, 100); };
      imgs.filter((i) => !i.complete).forEach((i) => { i.addEventListener("load", done); i.addEventListener("error", done); });
      setTimeout(go, 2500);
    } else {
      setTimeout(go, 250);
    }
  }

  /* ---------- Excel-style spreadsheet preview ---------- */

  const ALL_FIELDS = [
    ["id", "Reservation ID"],
    ["customerName", "Guest"],
    ["roomOrEvent", "Room / Event"],
    ["checkIn", "Check-in"],
    ["checkOut", "Check-out"],
    ["guests", "Guests"],
    ["totalAmount", "Amount"],
    ["paymentStatus", "Payment Status"],
    ["quoteStatus", "Quotation"],
    ["dateReserved", "Date Reserved"],
    ["proofRef", "Proof of Payment"],
  ];
  const REPORT_TYPES = [
    ["reservation", "Reservation"],
    ["booking", "Booking"],
    ["payment", "Payment"],
    ["schedule", "Schedule"],
  ];
  const MIN_SHEET_ROWS = 20;

  function injectSheetStyles() {
    if (document.getElementById("cvrSheetStyles")) return;
    const st = document.createElement("style");
    st.id = "cvrSheetStyles";
    st.textContent = `
.cvr-sheet{font-family:"Inter","Segoe UI",sans-serif;color:var(--text,#3d4963)}
.cvr-sheet .cvr-sheet-fields{display:flex;flex-wrap:wrap;gap:.45rem 1.1rem;align-items:center;border:1px solid var(--ui-border,#e6edf3);border-radius:var(--ui-radius-md,.9rem);padding:.7rem .95rem;background:#f8fbfe}
.cvr-sheet .cvr-sheet-fields label{font-size:.82rem;display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;margin:0;white-space:nowrap;color:var(--text,#3d4963)}
.cvr-sheet .cvr-paper{border:1px solid var(--ui-border-strong,#dce6ee);border-radius:var(--ui-radius-md,.9rem);overflow:hidden;background:#fff;box-shadow:var(--ui-shadow-soft,0 6px 20px rgba(15,35,52,.07))}
.cvr-sheet .cvr-report-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.3rem;background:linear-gradient(180deg,#fff 0%,#f8fbfe 100%);border-bottom:3px solid var(--accent,#d9b312)}
.cvr-sheet .cvr-report-brand{display:flex;align-items:center;gap:.95rem}
.cvr-sheet .cvr-report-brand img{height:58px;width:auto;border-radius:.7rem;border:1px solid var(--ui-border,#e6edf3);padding:3px;background:#fff}
.cvr-sheet .cvr-report-brand .rn{font-family:"Playfair Display",Georgia,serif;font-weight:700;font-size:1.3rem;line-height:1.15;color:var(--primary,#0c3b5d)}
.cvr-sheet .cvr-report-brand .rt{margin-top:.2rem;font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary,#328bc3)}
.cvr-sheet .cvr-report-meta{text-align:right;font-size:.78rem;line-height:1.6;color:var(--text,#3d4963)}
.cvr-sheet .cvr-report-meta strong{color:var(--primary,#0c3b5d);font-weight:600}
.cvr-sheet .cvr-formula{display:flex;align-items:stretch;border-bottom:1px solid var(--ui-border-strong,#dce6ee);background:#fff;font-size:.8rem;overflow:hidden}
.cvr-sheet .cvr-formula .nm{width:72px;text-align:center;padding:.35rem .4rem;border-right:1px solid var(--ui-border-strong,#dce6ee);font-weight:700;background:#f8fbfe;color:var(--primary,#0c3b5d)}
.cvr-sheet .cvr-formula .fx{padding:.35rem .65rem;border-right:1px solid var(--ui-border-strong,#dce6ee);font-style:italic;color:var(--secondary,#328bc3);font-weight:700}
.cvr-sheet .cvr-formula .val{flex:1;padding:.35rem .7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:1.95rem}
.cvr-sheet .cvr-sheet-scroll{max-height:440px;overflow:auto;background:#fff}
.cvr-sheet table.cvr-grid{border-collapse:separate;border-spacing:0;font-size:13px;min-width:100%}
.cvr-sheet table.cvr-grid th,.cvr-sheet table.cvr-grid td{border-right:1px solid var(--ui-border,#e6edf3);border-bottom:1px solid var(--ui-border,#e6edf3);padding:3px 10px;height:30px;white-space:nowrap;max-width:260px;overflow:hidden;text-overflow:ellipsis}
.cvr-sheet table.cvr-grid thead tr:first-child th{position:sticky;top:0;z-index:4;background:#f8fbfe;color:#8794a1;font-weight:600;text-align:center;font-size:11px;height:24px;padding:0 8px}
.cvr-sheet table.cvr-grid thead tr:nth-child(2) td,.cvr-sheet table.cvr-grid thead tr:nth-child(2) th{position:sticky;top:24px;z-index:3}
.cvr-sheet table.cvr-grid th.corner{left:0;z-index:5;width:46px;min-width:46px}
.cvr-sheet table.cvr-grid th.rowhead{position:sticky;left:0;z-index:2;background:#f8fbfe;color:#8794a1;font-weight:600;text-align:center;font-size:11px;width:46px;min-width:46px;padding:0 6px}
.cvr-sheet table.cvr-grid thead tr:nth-child(2) th.rowhead{z-index:5;top:24px}
.cvr-sheet table.cvr-grid th.colhead{min-width:150px}
.cvr-sheet table.cvr-grid td.hdr{background:var(--primary,#0c3b5d);color:#fff;font-weight:700;font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;border-right:1px solid rgba(255,255,255,.14);border-bottom:1px solid var(--primary,#0c3b5d)}
.cvr-sheet table.cvr-grid td{cursor:cell;background:#fff;color:var(--dark,#242f38)}
.cvr-sheet table.cvr-grid tbody tr:nth-child(even) td{background:#fbfdff}
.cvr-sheet table.cvr-grid tbody tr:hover td{background:#f1f8fd}
.cvr-sheet table.cvr-grid td.sel{outline:2px solid var(--secondary,#328bc3);outline-offset:-2px;background:#eaf4fb !important}
.cvr-sheet table.cvr-grid th.active{background:#e3f0f9 !important;color:var(--primary,#0c3b5d);font-weight:700}
.cvr-sheet .cvr-sheet-foot{display:flex;justify-content:space-between;align-items:center;background:#f8fbfe;border-top:1px solid var(--ui-border-strong,#dce6ee);padding:0 1rem;font-size:.78rem;color:var(--text,#3d4963)}
.cvr-sheet .cvr-sheet-foot .tab{background:#fff;color:var(--primary,#0c3b5d);font-weight:600;padding:.4rem 1.1rem;border-bottom:3px solid var(--secondary,#328bc3);border-left:1px solid var(--ui-border,#e6edf3);border-right:1px solid var(--ui-border,#e6edf3)}
`;
    document.head.appendChild(st);
  }

  function createSheet(host, { getFilters, initialType = "reservation" }) {
    injectSheetStyles();
    const selected = {};
    REPORT_TYPES.forEach(([t]) => {
      selected[t] = new Set((REPORT_COLUMNS[t] || []).map(([k]) => k));
    });
    let type = REPORT_TYPES.some(([t]) => t === initialType) ? initialType : "reservation";
    let activeCell = null;

    host.classList.add("cvr-sheet");
    host.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div class="btn-group btn-group-sm" role="group" aria-label="Report type" data-role="tabs">
          ${REPORT_TYPES.map(([t, l]) => `<button type="button" class="btn btn-outline-primary" data-type="${t}">${l}</button>`).join("")}
        </div>
        <div class="d-flex flex-wrap gap-2" data-role="actions">
          <button type="button" class="btn btn-sm btn-brand" data-act="print"><i class="bi bi-printer me-1"></i>Print</button>
          <button type="button" class="btn btn-sm btn-outline-success" data-act="xlsx"><i class="bi bi-file-earmark-excel me-1"></i>Download Excel</button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-act="docx">DOCX</button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-act="pdf">PDF</button>
        </div>
      </div>
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="small fw-semibold text-brand">Fields to show</span>
          <span class="small"><a href="#" data-act="all">Select all</a> &middot; <a href="#" data-act="reset">Reset</a></span>
        </div>
        <div class="cvr-sheet-fields" data-role="fields"></div>
      </div>
      <div class="cvr-paper">
        <div class="cvr-report-head">
          <div class="cvr-report-brand">
            <img data-role="logo" alt="Casa Vergara" class="d-none">
            <div><div class="rn">Casa Vergara Resort</div><div class="rt" data-role="rtitle">Report</div></div>
          </div>
          <div class="cvr-report-meta" data-role="rmeta"></div>
        </div>
        <div class="cvr-formula"><div class="nm" data-role="nm">A1</div><div class="fx">fx</div><div class="val" data-role="val"></div></div>
        <div class="cvr-sheet-scroll"><table class="cvr-grid" data-role="grid"></table></div>
        <div class="cvr-sheet-foot"><div class="tab" data-role="tab">Report</div><div data-role="count"></div></div>
      </div>`;

    const q = (r) => host.querySelector(`[data-role="${r}"]`);
    const gridEl = q("grid");

    function title() {
      return `${REPORT_TYPES.find(([t]) => t === type)[1]} Report`;
    }
    function baseName() {
      return `CasaVergara-${REPORT_TYPES.find(([t]) => t === type)[1]}Report`;
    }

    function prettyIso(iso) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
      if (!m) return iso || "";
      return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    function filterSummary() {
      const f = getFilters() || {};
      const dates =
        f.from || f.to ? `${f.from ? prettyIso(f.from) : "Any"} \u2013 ${f.to ? prettyIso(f.to) : "Any"}` : "All dates";
      return `Check-in: ${dates} \u00b7 Payment: ${!f.status || f.status === "all" ? "All" : f.status} \u00b7 Room: ${!f.room || f.room === "all" ? "All" : f.room}`;
    }

    function currentDataset() {
      const records = filterRecords(getReservations(), getFilters());
      const columns = ALL_FIELDS.filter(([k]) => selected[type].has(k));
      return { columns, rows: records.map(toRow), subtitle: filterSummary() };
    }

    function applyLogo() {
      const img = q("logo");
      if (cachedLogo && (cachedLogo.dataUrl || cachedLogo.url)) {
        img.src = cachedLogo.dataUrl || cachedLogo.url;
        img.classList.remove("d-none");
      }
    }

    function renderHead(ds) {
      q("rtitle").textContent = title();
      q("rmeta").innerHTML =
        `<div><strong>Generated:</strong> ${xmlEscape(new Date().toLocaleString())}</div>` +
        `<div><strong>Records:</strong> ${ds.rows.length} &nbsp;&middot;&nbsp; <strong>Fields:</strong> ${ds.columns.length}</div>` +
        `<div>${xmlEscape(ds.subtitle)}</div>`;
      applyLogo();
    }

    function renderFields() {
      const box = q("fields");
      box.innerHTML = ALL_FIELDS.map(
        ([k, l]) =>
          `<label><input type="checkbox" class="form-check-input mt-0" data-field="${k}"${selected[type].has(k) ? " checked" : ""}>${xmlEscape(l)}</label>`,
      ).join("");
    }

    function renderTabs() {
      host.querySelectorAll('[data-role="tabs"] [data-type]').forEach((b) => {
        const on = b.dataset.type === type;
        b.classList.toggle("active", on);
        b.classList.toggle("btn-primary", on);
        b.classList.toggle("btn-outline-primary", !on);
      });
      q("tab").textContent = title();
    }

    function renderGrid() {
      const ds = currentDataset();
      const cols = ds.columns;
      const totalRows = Math.max(MIN_SHEET_ROWS, ds.rows.length + 1);
      let h = `<thead><tr><th class="corner"></th>${cols
        .map((_, i) => `<th class="colhead" data-col="${i}">${colLetter(i)}</th>`)
        .join("")}</tr><tr><th class="rowhead" data-row="1">1</th>${cols
        .map(([, l], i) => `<td class="hdr" data-ref="${colLetter(i)}1" data-col="${i}" data-row="1" data-v="${xmlEscape(l)}">${xmlEscape(l)}</td>`)
        .join("")}</tr></thead><tbody>`;
      for (let r = 0; r < totalRows - 1; r++) {
        const row = ds.rows[r];
        const rn = r + 2;
        h += `<tr><th class="rowhead" data-row="${rn}">${rn}</th>${cols
          .map(([k], i) => {
            const v = row ? String(row[k] ?? "") : "";
            return `<td data-ref="${colLetter(i)}${rn}" data-col="${i}" data-row="${rn}" data-v="${xmlEscape(v)}">${xmlEscape(v)}</td>`;
          })
          .join("")}</tr>`;
      }
      gridEl.innerHTML = h + "</tbody>";
      renderHead(ds);
      activeCell = null;
      q("nm").textContent = "A1";
      q("val").textContent = "";
      q("count").textContent = ds.rows.length
        ? `${ds.rows.length} record(s) \u00b7 ${cols.length} field(s)`
        : `No records match the current filters \u00b7 ${cols.length} field(s)`;
    }

    function selectCell(td) {
      gridEl.querySelectorAll(".sel").forEach((n) => n.classList.remove("sel"));
      gridEl.querySelectorAll("th.active").forEach((n) => n.classList.remove("active"));
      td.classList.add("sel");
      gridEl.querySelector(`th.colhead[data-col="${td.dataset.col}"]`)?.classList.add("active");
      gridEl.querySelector(`th.rowhead[data-row="${td.dataset.row}"]`)?.classList.add("active");
      q("nm").textContent = td.dataset.ref;
      q("val").textContent = td.dataset.v;
      activeCell = td;
    }

    function refresh() {
      renderTabs();
      renderFields();
      renderGrid();
    }

    gridEl.addEventListener("click", (e) => {
      const td = e.target.closest("td");
      if (td) selectCell(td);
    });

    host.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-type]");
      if (tab && host.contains(tab)) {
        type = tab.dataset.type;
        refresh();
        return;
      }
      const a = e.target.closest("[data-act]");
      if (!a) return;
      const act = a.dataset.act;
      if (act === "all" || act === "reset") {
        e.preventDefault();
        selected[type] = new Set(
          act === "all" ? ALL_FIELDS.map(([k]) => k) : (REPORT_COLUMNS[type] || []).map(([k]) => k),
        );
        renderFields();
        renderGrid();
        return;
      }
      const ds = currentDataset();
      loadLogo().then(() => {
        if (act === "print") printDataset(ds, title());
        else if (act === "xlsx") exportXlsx(ds, title(), baseName());
        else if (act === "docx") exportDocx(ds, title(), baseName());
        else if (act === "pdf") exportPdf(ds, title(), baseName());
      });
    });

    host.addEventListener("change", (e) => {
      const cb = e.target.closest("input[data-field]");
      if (!cb) return;
      if (cb.checked) selected[type].add(cb.dataset.field);
      else if (selected[type].size > 1) selected[type].delete(cb.dataset.field);
      else cb.checked = true; // keep at least one field
      renderGrid();
    });

    const onSynced = () => {
      if (!host.isConnected) return document.removeEventListener("cvr-reservations-synced", onSynced);
      refresh();
    };
    document.addEventListener("cvr-reservations-synced", onSynced);

    refresh();
    loadLogo().then(applyLogo);
    return {
      refresh,
      setType(t) {
        if (REPORT_TYPES.some(([x]) => x === t)) {
          type = t;
          refresh();
        }
      },
    };
  }

  let previewModalEl = null;

  function ensurePreviewModal() {
    if (previewModalEl) return previewModalEl;
    const wrap = document.createElement("div");
    wrap.className = "modal fade";
    wrap.id = "cvrReportPreviewModal";
    wrap.tabIndex = -1;
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title text-brand mb-0">Spreadsheet preview</h5>
              <div class="small text-muted-brand">Choose the fields to include, then print or download.</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body"><div id="cvrSheetHost"></div></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    previewModalEl = wrap;
    return wrap;
  }

  function showReportSheet(reportType, getFilters) {
    const el = ensurePreviewModal();
    const host = el.querySelector("#cvrSheetHost");
    host.innerHTML = "";
    createSheet(host, { getFilters, initialType: reportType });
    if (window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(el).show();
  }

  function setStatus(el, text, tone = "muted") {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("d-none", "text-success", "text-danger", "text-muted-brand");
    el.classList.add(tone === "error" ? "text-danger" : tone === "ok" ? "text-success" : "text-muted-brand");
  }

  function withBusy(btn, fn) {
    if (!btn) return fn();
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Working\u2026`;
    try {
      return fn();
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = original;
      }, 250);
    }
  }

  function downloadReservationPageExport(format, btn, statusEl) {
    withBusy(btn, () => {
      const tableBody = document.getElementById("reservationTableBody");
      if (!tableBody) return;
      const rows = Array.from(tableBody.querySelectorAll("tr[data-id]")).filter(
        (tr) => tr.id !== "reservationEmptyStateRow" && !tr.classList.contains("d-none"),
      );
      const columns = [
        ["id", "ID"],
        ["guest", "Guest"],
        ["room", "Room / Event"],
        ["checkIn", "Check-in"],
        ["checkOut", "Check-out"],
        ["guests", "Guests"],
        ["amount", "Amount"],
        ["payStatus", "Payment Status"],
        ["quoteStatus", "Quotation"],
      ];

      const dataRows = rows.map((tr) => {
        const cells = tr.querySelectorAll("td");
        const ds = tr.dataset;
        return {
          id: ds.id || cells[0]?.textContent.trim() || "",
          guest: ds.exportGuest || cells[1]?.textContent.trim() || "",
          room: ds.room || cells[2]?.textContent.trim() || "",
          checkIn: ds.exportCheckin || cells[3]?.textContent.trim() || "",
          checkOut: ds.exportCheckout || cells[4]?.textContent.trim() || "",
          guests: ds.exportGuests || cells[5]?.textContent.trim() || "",
          amount: ds.exportAmount || cells[4]?.textContent.trim() || "",
          payStatus: ds.status || cells[5]?.textContent.trim() || "",
          quoteStatus: ds.quoteStatus || cells[6]?.textContent.trim() || "",
        };
      });
      const dataset = { columns, rows: dataRows };
      if (format === "pdf") {
        if (exportPdf(dataset, "Reservations Export", "CasaVergara-Reservations")) {
          setStatus(statusEl, `Exported ${dataRows.length} reservation(s) as PDF.`, "ok");
        }
      } else {
        exportDocx(dataset, "Reservations Export", "CasaVergara-Reservations");
        setStatus(statusEl, `Exported ${dataRows.length} reservation(s) as Word (.docx).`, "ok");
      }
    });
  }

  const PAYMENT_PROOF_COLUMNS = [
    ["reservationId", "Reservation ID"],
    ["customerName", "Guest"],
    ["email", "Email"],
    ["submitted", "Date Submitted"],
    ["amount", "Amount"],
    ["paymentMethod", "Method"],
    ["status", "Payment Status"],
  ];

  function proofSubmittedIso(proof) {
    if (!proof.createdAt) return "";
    const d = new Date(String(proof.createdAt).replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  function filterProofs(proofs, { from = "", to = "", status = "all" } = {}) {
    return proofs.filter((p) => {
      const iso = proofSubmittedIso(p);
      if (from && iso && iso < from) return false;
      if (to && iso && iso > to) return false;
      if (status !== "all" && (p.status || "") !== status) return false;
      return true;
    });
  }

  function buildProofDataset(proofs) {
    const rows = proofs.map((p) => ({
      reservationId: p.reservationId || "",
      customerName: p.customerName || "Guest",
      email: p.email || "",
      submitted: p.createdAt ? new Date(String(p.createdAt).replace(" ", "T")).toLocaleString() : "\u2014",
      amount: p.amount || "\u2014",
      paymentMethod: p.paymentMethod || "\u2014",
      status: p.status || "",
    }));
    return { columns: PAYMENT_PROOF_COLUMNS, rows };
  }

  function initAdminPaymentsExport() {
    const csvBtn =
      document.getElementById("paymentExportDocxBtn") || document.getElementById("paymentExportCsvBtn");
    const pdfBtn = document.getElementById("paymentExportPdfBtn");
    const statusEl = document.getElementById("paymentExportStatus");
    const fromEl = document.getElementById("paymentExportDateFrom");
    const toEl = document.getElementById("paymentExportDateTo");
    const statusFilterEl = document.getElementById("paymentExportPayFilter");
    if (!csvBtn && !pdfBtn) return;

    function run(format, btn) {
      withBusy(btn, () => {
        const allProofs = typeof window.getAdminPaymentProofs === "function" ? window.getAdminPaymentProofs() : [];
        const proofs = filterProofs(allProofs, {
          from: fromEl?.value || "",
          to: toEl?.value || "",
          status: statusFilterEl?.value || "all",
        });
        const dataset = buildProofDataset(proofs);

        if (format === "pdf") {
          if (!exportPdf(dataset, "Payment Records", "CasaVergara-Payments")) return;
        } else {
          exportDocx(dataset, "Payment Records", "CasaVergara-Payments");
        }
        setStatus(
          statusEl,
          dataset.rows.length
            ? `Exported ${dataset.rows.length} payment record(s) as ${format === "pdf" ? "PDF" : "Word (.docx)"}.`
            : `No matching records \u2014 downloaded an empty ${format === "pdf" ? "PDF" : "Word (.docx)"} report.`,
          dataset.rows.length ? "ok" : "muted",
        );
      });
    }

    csvBtn?.addEventListener("click", () => run("docx", csvBtn));
    pdfBtn?.addEventListener("click", () => run("pdf", pdfBtn));
  }
  window.initAdminPaymentsExport = initAdminPaymentsExport;

  function initFilteredReportButtons({ buttonSelector, mainBtnId, statusId, fromId, toId, statusFilterId, roomId, sheetHostId }) {
    const statusEl = document.getElementById(statusId);
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    const statusFilterEl = document.getElementById(statusFilterId);
    const roomEl = document.getElementById(roomId);

    function populateRoomOptions() {
      if (!roomEl) return;
      const cur = roomEl.value;
      const names = new Set();
      getReservations().forEach((r) => {
        const n = (r.roomName || r.eventType || "").trim();
        if (n) names.add(n);
      });
      roomEl.innerHTML = `<option value="all">All</option>`;
      [...names]
        .sort((a, b) => a.localeCompare(b))
        .forEach((name) => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name;
          roomEl.appendChild(opt);
        });
      if ([...names].includes(cur)) roomEl.value = cur;
    }
    populateRoomOptions();

    document.addEventListener("cvr-reservations-synced", populateRoomOptions);

    function currentFilters() {
      return {
        from: fromEl?.value || "",
        to: toEl?.value || "",
        status: statusFilterEl?.value || "all",
        room: roomEl?.value || "all",
      };
    }

    const sheetHost = sheetHostId ? document.getElementById(sheetHostId) : null;
    let pageSheet = null;
    if (sheetHost) {
      pageSheet = createSheet(sheetHost, { getFilters: currentFilters, initialType: "reservation" });
      [fromEl, toEl, statusFilterEl, roomEl].forEach((el) => {
        el?.addEventListener("change", () => pageSheet.refresh());
        el?.addEventListener("input", () => pageSheet.refresh());
      });
    }

    function runReport(reportType, format, btn) {
      loadLogo().then(() => runReportNow(reportType, format, btn));
    }

    function runReportNow(reportType, format, btn) {
      withBusy(btn, () => {
        const records = filterRecords(getReservations(), currentFilters());
        const dataset = buildDataset(records, reportType);
        const label = reportType.charAt(0).toUpperCase() + reportType.slice(1);
        const formatLabel = format === "pdf" ? "PDF" : "Word (.docx)";

        if (format === "xlsx") {
          if (pageSheet) {
            pageSheet.setType(reportType);
            sheetHost.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            showReportSheet(reportType, currentFilters);
          }
          setStatus(statusEl, `Previewing ${dataset.rows.length} ${reportType} record(s) \u2014 ready to print or download as Excel.`, "ok");
          return;
        }
        if (format === "pdf") {
          if (!exportPdf(dataset, `${label} Report`, `CasaVergara-${label}Report`)) return;
        } else {
          exportDocx(dataset, `${label} Report`, `CasaVergara-${label}Report`);
        }
        setStatus(
          statusEl,
          dataset.rows.length
            ? `Exported ${dataset.rows.length} ${reportType} record(s) as ${formatLabel}.`
            : `No records matched \u2014 downloaded an empty ${formatLabel} report.`,
          dataset.rows.length ? "ok" : "muted",
        );
      });
    }

    document.querySelectorAll(buttonSelector).forEach((btn) => {
      btn.addEventListener("click", () => {
        const fmt = btn.dataset.format === "pdf" ? "pdf" : btn.dataset.format === "xlsx" ? "xlsx" : "docx";
        runReport(btn.dataset.report || "reservation", fmt, btn);
      });
    });

    if (mainBtnId) {
      const mainBtn = document.getElementById(mainBtnId);
      mainBtn?.addEventListener("click", () => runReport("reservation", "docx", mainBtn));
    }
  }

  function initReportsPageReportDownloads() {
    initFilteredReportButtons({
      buttonSelector: ".rep-report-btn",
      mainBtnId: "repReportExportMainBtn",
      statusId: "repReportStatus",
      fromId: "repReportDateFrom",
      toId: "repReportDateTo",
      statusFilterId: "repReportPayStatus",
      roomId: "repReportRoom",
      sheetHostId: "repSheetHost",
    });
  }
  window.initReportsPageReportDownloads = initReportsPageReportDownloads;

  function initDashboardReportDownloads() {
    initFilteredReportButtons({
      buttonSelector: ".dash-report-btn",
      statusId: "dashReportStatus",
      fromId: "dashReportDateFrom",
      toId: "dashReportDateTo",
      statusFilterId: "dashReportPayStatus",
      roomId: "dashReportRoom",
    });
  }
  window.initDashboardReportDownloads = initDashboardReportDownloads;

  window.CVRAdminExport = { downloadReservationPageExport, buildDataset, exportCsv, exportDocx, exportPdf, exportXlsx, showReportSheet, createSheet, printDataset, loadLogo, setLogo };
})();
