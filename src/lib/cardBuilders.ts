// Translates calculator state into a printable ExportCard. Kept separate from
// App.tsx and ShareExportBar so the visual layout of an exported card is a pure
// function of the numbers — and therefore trivially testable.

import type { ExportCard } from './exportCard'
import { formatDateInDhaka, weekdayInDhaka } from './dhakaTime'

export const ACCENT = {
  orange: '#f97316',
  green: '#16a34a',
  purple: '#9333ea',
  red: '#ef4444',
} as const

const taka = (n: number) =>
  `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const percent = (n?: number) => (n && n > 0 ? `${n}%` : 'None')

export interface CgpaCardInput {
  dark: boolean
  gpa: number
  cgpa: number
  trimesterCredits: number
  totalCredits: number
  courseCount: number
  retakeCount: number
}

export const buildCgpaCard = (input: CgpaCardInput): ExportCard => ({
  title: 'CGPA Calculator',
  subtitle: 'Trimester result summary',
  accent: ACCENT.orange,
  dark: input.dark,
  highlight: {
    label: 'Overall CGPA',
    value: input.cgpa.toFixed(2),
    color: input.cgpa >= 3.5 ? ACCENT.green : ACCENT.orange,
  },
  metrics: [
    { label: 'This Trimester GPA', value: input.gpa.toFixed(2) },
    { label: 'Trimester Credits', value: String(input.trimesterCredits) },
    { label: 'Total Credits Completed', value: String(input.totalCredits) },
    { label: 'Courses', value: String(input.courseCount) },
    { label: 'Retake Courses', value: String(input.retakeCount) },
  ],
  footnotes: [
    'CGPA recalculated with retakes replacing the original grade.',
    'Calculated on the UIU CGPA Calculator — tap the link to edit these values.',
  ],
})

export interface TuitionCardInput {
  dark: boolean
  tuitionTotal?: number
  trimesterFee: number
  waiverPct?: number
  scholarshipPct?: number
  fydpCredits: number
  fydpPerCreditCost: number
  fydpAmount: number
  regularAmount: number
  totalPayable: number
  breakdown: { first: number; second: number; third: number } | null
  installmentDates: { first: string; second: string; third: string }
}

const installmentLine = (label: string, amount: number, date: string) => ({
  label: `${label}${date ? ` · ${formatDateInDhaka(date)}${weekdayInDhaka(date) ? ` (${weekdayInDhaka(date)})` : ''}` : ''}`,
  value: taka(amount),
})

export const buildTuitionCard = (input: TuitionCardInput): ExportCard => {
  const metrics = [
    { label: 'Total on UCAM', value: input.tuitionTotal ? taka(input.tuitionTotal) : '—' },
    { label: 'Trimester Fee', value: taka(input.trimesterFee) },
    { label: 'Waiver', value: percent(input.waiverPct) },
    { label: 'Scholarship', value: percent(input.scholarshipPct) },
    {
      label: `FYDP (${input.fydpCredits} cr × ${taka(input.fydpPerCreditCost)})`,
      value: taka(input.fydpAmount),
      color: ACCENT.orange,
    },
    { label: 'Regular (after discounts)', value: taka(input.regularAmount) },
  ]

  if (input.breakdown) {
    metrics.push(
      installmentLine('1st Installment (40%)', input.breakdown.first, input.installmentDates.first),
      installmentLine('2nd Installment (30%)', input.breakdown.second, input.installmentDates.second),
      installmentLine('3rd Installment (30%)', input.breakdown.third, input.installmentDates.third),
    )
  }

  return {
    title: 'Tuition Fee Breakdown',
    subtitle: 'Installment plan',
    accent: ACCENT.green,
    dark: input.dark,
    highlight: { label: 'Total Payable', value: taka(input.totalPayable), color: ACCENT.green },
    metrics,
    footnotes: [
      'Waiver and scholarship applied sequentially to (Total − Trimester Fee), then the trimester fee is added back.',
      'FYDP credits are charged at full per-credit cost with no waiver or scholarship.',
      'Third installment absorbs rounding so the three payments sum exactly to the total.',
    ],
  }
}

export interface TargetCardInput {
  dark: boolean
  currentCgpa?: number
  completedCredit?: number
  targetCgpa?: number
  targetCredits?: number
  requiredGpa: number | null
}

export const buildTargetCard = (input: TargetCardInput): ExportCard => {
  const impossible = input.requiredGpa !== null && input.requiredGpa > 4
  const alreadyThere = input.requiredGpa !== null && input.requiredGpa <= 0
  const color = impossible ? ACCENT.red : alreadyThere ? ACCENT.green : ACCENT.purple

  return {
    title: 'Target CGPA Planner',
    subtitle: 'Required GPA this trimester',
    accent: ACCENT.purple,
    dark: input.dark,
    highlight: {
      label: 'Required GPA',
      value: input.requiredGpa === null ? '—' : input.requiredGpa.toFixed(2),
      color,
    },
    metrics: [
      { label: 'Current CGPA', value: input.currentCgpa?.toFixed(2) ?? '—' },
      { label: 'Credits Completed', value: String(input.completedCredit ?? 0) },
      { label: 'Target CGPA', value: input.targetCgpa?.toFixed(2) ?? '—' },
      { label: 'Credits This Trimester', value: String(input.targetCredits ?? 0) },
    ],
    footnotes:
      input.requiredGpa === null
        ? ['Fill in all four fields to get a target.']
        : impossible
          ? ['Above 4.00 — this target cannot be reached in a single trimester.']
          : alreadyThere
            ? ['You already meet or exceed this target.']
            : ['A perfect 4.00 trimester yields the maximum possible CGPA gain.'],
  }
}
