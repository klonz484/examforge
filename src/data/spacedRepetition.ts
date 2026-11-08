export type ReviewGrade = 0 | 1 | 2 | 3
export type FlashcardReviewState = {
  question_id: string
  interval_days: number
  ease_factor: number
  repetitions: number
  last_grade: ReviewGrade | null
  last_reviewed_at: string | null
  next_review_at: string
  updated_at: string
}

export function scheduleFlashcardReview(
  questionId: string,
  previous: FlashcardReviewState | undefined,
  grade: ReviewGrade,
  now = new Date(),
): FlashcardReviewState {
  let interval = previous?.interval_days ?? 0
  let ease = previous?.ease_factor ?? 2.5
  let repetitions = previous?.repetitions ?? 0

  if (grade === 0) {
    interval = 0
    repetitions = 0
    ease = Math.max(1.3, ease - 0.2)
  } else if (grade === 1) {
    interval = Math.max(1, Math.round(Math.max(1, interval) * 1.2))
    repetitions += 1
    ease = Math.max(1.3, ease - 0.15)
  } else if (grade === 2) {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(1, Math.round(Math.max(1, interval) * ease))
    repetitions += 1
  } else {
    interval = repetitions === 0 ? 3 : repetitions === 1 ? 5 : Math.max(1, Math.ceil(Math.max(1, interval) * ease * 1.3))
    repetitions += 1
    ease = Math.min(3.5, ease + 0.15)
  }

  const reviewedAt = now.toISOString()
  const due = new Date(now)
  due.setDate(due.getDate() + interval)
  return {
    question_id: questionId,
    interval_days: interval,
    ease_factor: Number(ease.toFixed(2)),
    repetitions,
    last_grade: grade,
    last_reviewed_at: reviewedAt,
    next_review_at: due.toISOString(),
    updated_at: reviewedAt,
  }
}

export function isFlashcardDue(review: FlashcardReviewState | undefined, now = new Date()): boolean {
  return !review || new Date(review.next_review_at).getTime() <= now.getTime()
}
