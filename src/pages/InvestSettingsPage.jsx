import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/apiClient'
import './InvestSettingsPage.css'

const PROVIDERS = ['KIS', 'SAMSUNG']

const EMPTY_FORM = { provider: 'KIS', label: '', app_key: '', app_secret: '', account_no: '', account_type: '01' }

export default function InvestSettingsPage() {
  const navigate = useNavigate()
  const [keys, setKeys] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchKeys() {
    try {
      const data = await api.get('/asset-api/api-keys')
      setKeys(data)
    } catch {
      setError('API 키 목록을 불러오지 못했습니다.')
    }
  }

  useEffect(() => { fetchKeys() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/asset-api/api-keys', form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      await fetchKeys()
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, label) {
    if (!window.confirm(`"${label}" 키를 삭제할까요?`)) return
    try {
      await api.del(`/asset-api/api-keys/${id}`)
      await fetchKeys()
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="invest-settings-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/invest')}>← 투자</button>
        <h1>증권 API 설정</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="section">
        <div className="section-header">
          <h2>등록된 API 키</h2>
          <button className="add-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? '취소' : '+ 추가'}
          </button>
        </div>

        {showForm && (
          <form className="key-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>증권사</label>
              <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>이름</label>
              <input
                required
                placeholder="예: 한투 계좌1"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label>App Key</label>
              <input
                required
                placeholder="App Key"
                value={form.app_key}
                onChange={e => setForm(f => ({ ...f, app_key: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label>App Secret</label>
              <input
                required
                type="password"
                placeholder="App Secret"
                value={form.app_secret}
                onChange={e => setForm(f => ({ ...f, app_secret: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label>계좌번호</label>
              <input
                placeholder="예: 12345678-01"
                value={form.account_no}
                onChange={e => setForm(f => ({ ...f, account_no: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label>계좌구분</label>
              <input
                placeholder="예: 01 (현금)"
                value={form.account_type}
                onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
          </form>
        )}

        {keys.length === 0 ? (
          <p className="empty-msg">등록된 API 키가 없습니다.</p>
        ) : (
          <table className="key-table">
            <thead>
              <tr>
                <th>증권사</th>
                <th>이름</th>
                <th>App Key</th>
                <th>계좌번호</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id}>
                  <td>{k.provider}</td>
                  <td>{k.label}</td>
                  <td className="monospace">{k.app_key_masked}</td>
                  <td>{k.account_no || '-'}</td>
                  <td>
                    <span className={`status-badge ${k.is_active ? 'active' : 'inactive'}`}>
                      {k.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(k.id, k.label)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
