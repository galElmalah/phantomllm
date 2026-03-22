export interface TimingResult {
  label: string;
  samples: number[];
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
}

export function computeStats(label: string, samples: number[]): TimingResult {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const len = sorted.length;

  return {
    label,
    samples: sorted,
    min: sorted[0]!,
    max: sorted[len - 1]!,
    mean: sum / len,
    median: sorted[Math.floor(len / 2)]!,
    p95: sorted[Math.floor(len * 0.95)]!,
    p99: sorted[Math.floor(len * 0.99)]!,
  };
}

export function formatResult(r: TimingResult): string {
  return [
    `  ${r.label}`,
    `    samples: ${r.samples.length}`,
    `    min:     ${r.min.toFixed(2)}ms`,
    `    mean:    ${r.mean.toFixed(2)}ms`,
    `    median:  ${r.median.toFixed(2)}ms`,
    `    p95:     ${r.p95.toFixed(2)}ms`,
    `    p99:     ${r.p99.toFixed(2)}ms`,
    `    max:     ${r.max.toFixed(2)}ms`,
  ].join("\n");
}
