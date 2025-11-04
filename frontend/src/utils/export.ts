import { VideoSearchResult } from "../types/video";

function escapeCsvValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return "";
  }

  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(",") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildCsv(results: VideoSearchResult[]): string {
  const headers = [
    "Title",
    "URL",
    "Uploader",
    "Duration (seconds)",
    "Category",
    "Resolution",
    "Upload date",
    "Tags",
    "View count",
    "Description"
  ];

  const rows = results.map((item) => {
    const { video } = item;
    return [
      escapeCsvValue(video.title),
      escapeCsvValue(video.url),
      escapeCsvValue(video.uploaderName),
      escapeCsvValue(video.duration),
      escapeCsvValue(video.category),
      escapeCsvValue(video.resolution),
      escapeCsvValue(video.uploadDate),
      escapeCsvValue(video.tags.join("; ")),
      escapeCsvValue(video.viewCount),
      escapeCsvValue(video.description ?? "")
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function buildM3u(results: VideoSearchResult[]): string {
  const lines: string[] = ["#EXTM3U"];
  results.forEach((item) => {
    const { video } = item;
    const duration = Number.isFinite(video.duration) ? Math.max(0, Math.round(video.duration)) : -1;
    lines.push(`#EXTINF:${duration},${video.title}`);
    lines.push(video.url);
  });
  return lines.join("\n");
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
