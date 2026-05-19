import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatAmount } from '../utils/calculations'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function DailyLineChart({ series, unit }) {
  if (!series || series.length === 0 || series[0].data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
        데이터 없음
      </div>
    )
  }

  const allDates = [...new Set(series.flatMap(s => s.data.map(d => d.date)))].sort()

  const chartData = allDates.map(date => {
    const point = { date: date.slice(5) }
    for (const s of series) {
      const found = s.data.find(d => d.date === date)
      point[s.name] = found ? found.value : null
    }
    return point
  })

  const formatTick = (val) => {
    if (val === null || val === undefined) return ''
    let divisor = 1
    if (unit === '천원') divisor = 1000
    else if (unit === '만원') divisor = 10000
    return Math.round(val / divisor).toLocaleString()
  }

  const formatTooltip = (val, name) => {
    if (val === null || val === undefined) return ['-', name]
    const prefix = val >= 0 ? '+' : ''
    return [`${prefix}${formatAmount(val, unit)}${unit}`, name]
  }

  const tickInterval = Math.max(1, Math.floor(allDates.length / 10))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={tickInterval} />
        <YAxis tickFormatter={formatTick} tick={{ fontSize: 11 }} width={75} />
        <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" />
        <Tooltip formatter={formatTooltip} />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
