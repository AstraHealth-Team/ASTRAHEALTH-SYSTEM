/** Synthetic ECG (PQRST) generator, post Wavelet-LMS denoising look. */
function gauss(x: number, mu: number, sigma: number, amp: number) {
  return amp * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
}

/** phase in [0,1) of one beat. ectopic = PVC morphology (wide QRS, no P wave) */
export function beatSample(phase: number, ectopic: boolean): number {
  if (ectopic) {
    return (
      gauss(phase, 0.3, 0.04, -0.35) +
      gauss(phase, 0.38, 0.05, 1.35) +
      gauss(phase, 0.48, 0.06, -0.6) +
      gauss(phase, 0.7, 0.07, -0.25)
    );
  }
  return (
    gauss(phase, 0.16, 0.025, 0.12) + // P
    gauss(phase, 0.3, 0.008, -0.12) + // Q
    gauss(phase, 0.33, 0.011, 1.0) + // R
    gauss(phase, 0.36, 0.01, -0.22) + // S
    gauss(phase, 0.6, 0.045, 0.28) // T
  );
}

/** Returns true if beat number n should be a PVC given the target PVC rate. */
export function isEctopicBeat(n: number, hr: number, pvcPerMin: number): boolean {
  if (pvcPerMin <= 0) return false;
  const every = Math.max(2, Math.round(hr / pvcPerMin));
  return n % every === every - 1;
}
