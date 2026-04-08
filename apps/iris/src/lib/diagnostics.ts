type ChildDiagnosticSnapshot = {
  title?: string | null;
  bodyText?: string | null;
  mediaSummary?: string | null;
  error?: string | null;
};

export function hasMeaningfulMediaSummary(mediaSummary?: string | null): boolean {
  const trimmed = mediaSummary?.trim();
  if (!trimmed) {
    return false;
  }

  const metrics = [...trimmed.matchAll(/=(\d+)/g)];
  if (metrics.length === 0) {
    return true;
  }

  return metrics.some((match) => Number.parseInt(match[1] ?? '0', 10) > 0);
}

export function hasMeaningfulChildDiagnosticsSnapshot(snapshot: ChildDiagnosticSnapshot): boolean {
  return !!snapshot.title?.trim() ||
    !!snapshot.bodyText?.trim() ||
    !!snapshot.error?.trim() ||
    hasMeaningfulMediaSummary(snapshot.mediaSummary);
}
