export type ProgressAttempt = { topic: string; correct: boolean; t: number }

export type TopicEvidence = {
  topic: string
  attempts: number
  correct: number
  accuracy: number
  lastAttemptAt: number
  evidenceStatus: 'insufficient-sample' | 'developing' | 'steady'
}

export type ProgressInsight = {
  topics: TopicEvidence[]
  recommendedTopic: TopicEvidence | null
  recentAccuracy: number | null
  recentAttempts: number
  previousAccuracy: number | null
  previousAttempts: number
  trend: 'improving' | 'declining' | 'steady' | 'insufficient-data'
  explanation: string
}

function accuracyOf(rows: ProgressAttempt[]): number | null {
  return rows.length ? Math.round(rows.filter(row => row.correct).length * 100 / rows.length) : null
}

export function analyseProgress(
  attempts: ProgressAttempt[],
  topicNames: string[],
  now = Date.now(),
): ProgressInsight {
  const topics = topicNames.map(topic => {
    const rows = attempts.filter(row => row.topic === topic).sort((a, b) => a.t - b.t).slice(-20)
    const accuracy = accuracyOf(rows) ?? 0
    return {
      topic,
      attempts: rows.length,
      correct: rows.filter(row => row.correct).length,
      accuracy,
      lastAttemptAt: rows.length ? rows[rows.length - 1].t : 0,
      evidenceStatus: rows.length < 3 ? 'insufficient-sample' as const : accuracy < 80 ? 'developing' as const : 'steady' as const,
    }
  })
  const eligible = topics.filter(topic => topic.attempts >= 3)
  const recommendedTopic = eligible.sort((a, b) =>
    a.accuracy - b.accuracy || b.attempts - a.attempts || b.lastAttemptAt - a.lastAttemptAt
  )[0] ?? null

  const recentStart = now - 7 * 24 * 60 * 60 * 1000
  const previousStart = now - 14 * 24 * 60 * 60 * 1000
  const recent = attempts.filter(row => row.t >= recentStart && row.t <= now)
  const previous = attempts.filter(row => row.t >= previousStart && row.t < recentStart)
  const recentAccuracy = accuracyOf(recent)
  const previousAccuracy = accuracyOf(previous)
  let trend: ProgressInsight['trend'] = 'insufficient-data'
  if (recentAccuracy !== null && previousAccuracy !== null) {
    const difference = recentAccuracy - previousAccuracy
    trend = difference >= 5 ? 'improving' : difference <= -5 ? 'declining' : 'steady'
  }

  const explanation = recommendedTopic
    ? `${recommendedTopic.topic} has the lowest recent accuracy among topics with at least three recorded attempts (${recommendedTopic.accuracy}% from ${recommendedTopic.attempts} attempts). You can choose a different subject or topic at any time.`
    : 'There are not yet three recorded attempts in any topic. Keep practising; a topic recommendation will appear when there is enough evidence.'

  return {
    topics,
    recommendedTopic,
    recentAccuracy,
    recentAttempts: recent.length,
    previousAccuracy,
    previousAttempts: previous.length,
    trend,
    explanation,
  }
}
