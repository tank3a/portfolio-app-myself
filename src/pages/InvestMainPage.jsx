import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  getTotalInvestment, getInvestmentByCategory, getLastActiveInvestMonth,
  formatAmount, CURRENT_YEAR
} from '../utils/calculations'
import { addInvestTopCategory } from '../utils/dataUtils'
import { api } from '../utils/apiClient'
import UnitSelector from '../components/UnitSelector'
import HoverMonthCard from '../components/HoverMonthCard'
import MonthlyTable from '../components/MonthlyTable'
import MonthlyLineChart from '../components/MonthlyLineChart'
import DailyLineChart from '../components/DailyLineChart'
import './InvestMainPage.css'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444']

export default function InvestMainPage({ data, updateData }) {
  const navigate = useNavigate()
  const year = CURRENT_YEAR
  const unit = data.settings.investUnit
  const [pieMonth, setPieMonth] = useState(new Date().getMonth() + 1)

  const lastMonth = getLastActiveInvestMonth(data, year) || new Date().getMonth() + 1
  const topCats = data.investTopCategories || []
  const [pnlMode, setPnlMode] = useState('monthly')
  const [pnlData, setPnlData] = useState([])
  const [fetchStatus, setFetchStatus] = useState({ loading: false, lastFetched: null, error: '' })

  const headerAmounts = getInvestmentByCategory(data, year, lastMonth)

  const loadPnlData = useCallback(async () => {
    try {
      const rows = await api.get(`/asset-api/stock-data?year=${year}`)
      if (Array.isArray(rows)) setPnlData(rows)
    } catch {
      // 데이터 없으면 빈 배열 유지
    }
  }, [year])

  useEffect(() => { loadPnlData() }, [loadPnlData])

  async function handleFetchNow() {
    setFetchStatus(s => ({ ...s, loading: true, error: '' }))
    try {
      await api.post('/asset-api/fetch-now')
      setFetchStatus({ loading: false, lastFetched: new Date(), error: '' })
      await loadPnlData()
    } catch {
      setFetchStatus(s => ({ ...s, loading: false, error: '가져오기 실패' }))
    }
  }

  function buildPnlMonthly() {
    const monthly = {}
    for (const row of pnlData) {
      if (row.data_type !== 'TRADE_PNL_KR' && row.data_type !== 'TRADE_PNL_OVERSEAS') continue
      const m = new Date(row.snapshot_date).getMonth() + 1
      const val = Number(row.raw_data?.total ?? row.raw_data?.amount ?? 0)
      monthly[m] = (monthly[m] || 0) + val
    }
    return [{ name: '매매손익', data: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, monthly[i + 1] ?? null])) }]
  }

  function buildPnlDaily() {
    const byDate = {}
    for (const row of pnlData) {
      if (row.data_type !== 'TRADE_PNL_KR' && row.data_type !== 'TRADE_PNL_OVERSEAS') continue
      const d = row.snapshot_date.slice(0, 10)
      byDate[d] = (byDate[d] || 0) + Number(row.raw_data?.total ?? row.raw_data?.amount ?? 0)
    }
    return [{ name: '매매손익', data: Object.entries(byDate).map(([date, value]) => ({ date, value })) }]
  }

  function buildRows() {
    return topCats.map(cat => {
      const row = { label: cat, values: {} }
      for (let m = 1; m <= 12; m++) {
        const catData = getInvestmentByCategory(data, year, m)
        row.values[m] = catData[cat] ?? null
      }
      return row
    })
  }

  function buildChartSeries() {
    return topCats.map(cat => ({
      name: cat,
      data: Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [
          i + 1,
          getInvestmentByCategory(data, year, i + 1)[cat] ?? null
        ])
      )
    }))
  }

  function buildPieData() {
    const catAmounts = getInvestmentByCategory(data, year, pieMonth)
    return topCats
      .map(cat => ({ name: cat, value: catAmounts[cat] || 0 }))
      .filter(d => d.value > 0)
  }

  function handleAddCategory() {
    const name = window.prompt('새 투자 카테고리명을 입력하세요')
    if (!name?.trim()) return
    if (topCats.includes(name.trim())) {
      window.alert(`"${name.trim()}" 카테고리가 이미 존재합니다.`)
      return
    }
    const currentMonth = new Date().getMonth() + 1
    updateData(prev => addInvestTopCategory(prev, year, currentMonth, name.trim()))
  }

  return (
    <div className="invest-main-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 홈</button>
        <h1>투자</h1>
        <div className="header-right">
          <button className="settings-btn" onClick={() => navigate('/invest/settings')}>API 설정</button>
          <button
            className="fetch-btn"
            onClick={handleFetchNow}
            disabled={fetchStatus.loading}
          >
            {fetchStatus.loading ? '가져오는 중...' : '지금 가져오기'}
          </button>
          <button className="add-cat-btn" onClick={handleAddCategory}>+ 카테고리</button>
          <UnitSelector unit={unit} onChange={u => updateData(prev => ({ ...prev, settings: { ...prev.settings, investUnit: u } }))} />
        </div>
      </div>
      {fetchStatus.error && <div className="fetch-error">{fetchStatus.error}</div>}
      {fetchStatus.lastFetched && (
        <div className="fetch-success">마지막 수집: {fetchStatus.lastFetched.toLocaleTimeString('ko-KR')}</div>
      )}

      <div className="summary-cards">
        {topCats.map((cat, i) => (
          <div key={cat} className="summary-card" style={{ borderTopColor: PIE_COLORS[i % PIE_COLORS.length] }}>
            <div className="card-label">{cat}</div>
            <div className="card-value">
              {formatAmount(headerAmounts[cat] || 0, unit)}<span className="unit">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2>월별 통계</h2>
        <MonthlyTable rows={buildRows()} unit={unit} />
      </div>

      <div className="charts-row">
        <div className="section chart-section">
          <h2>추이 그래프</h2>
          <MonthlyLineChart series={buildChartSeries()} unit={unit} />
        </div>

        <div className="section pie-section">
          <div className="pie-header">
            <h2>구성 비율</h2>
            <select
              value={pieMonth}
              onChange={e => setPieMonth(Number(e.target.value))}
              className="month-select"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}월</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={buildPieData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {buildPieData().map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [formatAmount(val, unit) + unit, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section">
        <div className="pnl-header">
          <h2>손익 추이</h2>
          <div className="pnl-toggle">
            <button
              className={pnlMode === 'monthly' ? 'active' : ''}
              onClick={() => setPnlMode('monthly')}
            >월별</button>
            <button
              className={pnlMode === 'daily' ? 'active' : ''}
              onClick={() => setPnlMode('daily')}
            >일별</button>
          </div>
        </div>
        {pnlMode === 'monthly'
          ? <MonthlyLineChart series={buildPnlMonthly()} unit={unit} />
          : <DailyLineChart series={buildPnlDaily()} unit={unit} />
        }
      </div>

      <HoverMonthCard basePath="/invest" currentMonth={lastMonth} />
    </div>
  )
}
