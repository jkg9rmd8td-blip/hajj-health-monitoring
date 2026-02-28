export function classifyRisk({ heartRate, temperature, oxygen }) {
  let score = 0

  if (heartRate > 120) score += 2
  if (temperature > 39) score += 2
  if (oxygen && oxygen < 90) score += 3

  if (score >= 4) return "CRITICAL"
  if (score >= 2) return "WARNING"
  return "STABLE"
}
