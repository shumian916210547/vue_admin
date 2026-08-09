const escapeCell = (value) => {
  let text = String(value ?? "");
  // Prevent spreadsheet formula injection when opened in Excel or similar apps.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export class CsvSheet {
  constructor(columns, rows) {
    this.content = [columns, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");
  }

  download(fileName) {
    const blob = new Blob(["\uFEFF", this.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
