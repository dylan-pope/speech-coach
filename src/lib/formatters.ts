export function formatDateTime(dateIso: string) {
  const date = new Date(dateIso)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
