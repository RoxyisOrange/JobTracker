export function uniqueDirections(...groups: Array<readonly string[] | null | undefined>) {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)))
}

export function directionsFromRecords<T extends { direction?: readonly string[] | null }>(records: T[]) {
  return uniqueDirections(...records.map((record) => record.direction))
}
