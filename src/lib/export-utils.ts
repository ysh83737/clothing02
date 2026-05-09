"use client";

export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number;
}

export async function fetchAllForExport<T>(
  baseUrl: string,
  params: Record<string, string>
): Promise<T[]> {
  const searchParams = new URLSearchParams(params);
  searchParams.set("export", "1");

  const res = await fetch(`${baseUrl}?${searchParams.toString()}`);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "导出失败");
  }
  return json.data as T[];
}

export function downloadExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  import("xlsx").then((XLSX) => {
    const headerRow = columns.map((c) => c.header);
    const dataRows = data.map((item) => columns.map((c) => c.accessor(item)));

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  });
}
