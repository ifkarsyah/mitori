function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n')
}

/** Triggers a browser download of the given rows as a UTF-8 CSV file (BOM included for Excel/Numbers compatibility with Japanese text). */
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const csv = '﻿' + buildCsv(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
