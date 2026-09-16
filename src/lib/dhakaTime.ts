// Tuition/installment deadlines are defined in Bangladesh Standard Time
// (UTC+6, no daylight saving). All date logic must go through these helpers so
// the countdown is identical for every viewer regardless of their device timezone.

export const DHAKA_TIME_ZONE = 'Asia/Dhaka'

export type DateParts = { year: number; month: number; day: number }

export const dhakaDateParts = (date: Date): DateParts => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

// Whole calendar days from `now` until the given date on the Dhaka calendar.
// 0 = today in Bangladesh, 1 = tomorrow, negative = already passed.
export const daysUntilInDhaka = (dateText: string, now: Date = new Date()): number | null => {
  const deadline = new Date(dateText)
  if (isNaN(deadline.getTime())) return null
  const target = dhakaDateParts(deadline)
  const today = dhakaDateParts(now)
  const diff =
    Date.UTC(target.year, target.month - 1, target.day) -
    Date.UTC(today.year, today.month - 1, today.day)
  return Math.round(diff / 86_400_000)
}

export const formatDateInDhaka = (dateText: string): string => {
  const d = new Date(dateText)
  if (isNaN(d.getTime())) return ''
  const { day, month, year } = dhakaDateParts(d)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

export const weekdayInDhaka = (dateText: string): string => {
  const d = new Date(dateText)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { timeZone: DHAKA_TIME_ZONE, weekday: 'long' })
}

export const formatLongDateInDhaka = (dateText: string): string => {
  const d = new Date(dateText)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    timeZone: DHAKA_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatDateTimeInDhaka = (dateText: string): string => {
  const d = new Date(dateText)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    timeZone: DHAKA_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Convert an ISO timestamp from the database into the value an
// `<input type="datetime-local">` expects, expressed in Bangladesh time.
export const isoToDhakaInputValue = (iso: string): string => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const { year, month, day } = dhakaDateParts(d)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${value('hour')}:${value('minute')}`
}

// Interpret the value of an `<input type="datetime-local">` as Bangladesh time
// and return an ISO timestamp for storage.
export const dhakaInputValueToIso = (localValue: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localValue)
  if (!match) return new Date(localValue).toISOString()
  const [, year, month, day, hour, minute] = match
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+06:00`).toISOString()
}
