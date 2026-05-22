import { INTERVIEW_STATUSES, PRE_INTERVIEW_STATUSES } from './constants'

export function isInterviewStatus(status: string) {
  return INTERVIEW_STATUSES.includes(status)
}

export function isPreInterviewStatus(status: string) {
  return PRE_INTERVIEW_STATUSES.includes(status)
}

export function hasInterviewStatusConflict(status: string, interviewTime: string | null | undefined) {
  return Boolean(interviewTime) && isPreInterviewStatus(status)
}
