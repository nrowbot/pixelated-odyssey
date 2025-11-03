export function resolveDurationRange(duration?: string) {
  switch (duration) {
    case "short":
      return { min: 0, max: 5 * 60 };
    case "medium":
      return { min: 5 * 60, max: 20 * 60 };
    case "long":
      return { min: 20 * 60, max: undefined };
    default:
      return { min: undefined, max: undefined };
  }
}
