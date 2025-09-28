import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

export default function KanbanSettingsPage() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get('/kanban/stages');
        const items = (data.stages || []).map((s) => ({ ...s }));
        setStages(items);
      } catch (err) {
        setError('Falha ao carregar etapas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const ordered = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);

  const move = (index, dir) => {
    const next = [...ordered];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmpOrder = next[index].order;
    next[index].order = next[j].order;
    next[j].order = tmpOrder;
    setStages(next);
  };

  const changeField = (index, field, value) => {
    const next = [...ordered];
    next[index] = { ...next[index], [field]: value };
    setStages(next);
  };

  const addStage = () => {
    const maxOrder = ordered.reduce((acc, s) => Math.max(acc, s.order ?? 0), -1);
    setStages([
      ...ordered,
      { key: custom_, label: 'Nova etapa', order: maxOrder + 1, wip_limit: null, is_closed: 0 },
    ]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { stages: ordered.map(({ key, label, order, wip_limit, is_closed }) => ({ key, label, order, wip_limit, is_closed })) };
      const { data } = await apiClient.post('/kanban/stages', payload);
      setStages((data.stages || []).map((s) => ({ ...s })));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Falha ao salvar etapas (verifique permissões).';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Configurar Kanban</h1>
      <div className="card">
        {!canEdit && (
          <p style={{ color: '#777' }}>Você pode visualizar as etapas. Apenas administradores/gestores podem salvar alterações.</p>
        )}
        {loading && <p>Carregando...</p>}
        {error && <p style={{ color: '#d32f2f' }}>{error}</p>}
        {!loading && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button className="secondary-button" onClick={addStage} disabled={!canEdit}>Adicionar etapa</button>
              <button className="primary-button" onClick={save} disabled={!canEdit || saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}></th>
                  <th>Chave</th>
                  <th>Rótulo</th>
                  <th style={{ width: 120 }}>WIP</th>
                  <th style={{ width: 120 }}>Fechada?</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s, i) => (
                  <tr key={s.key}>
                    <td>
                      <div className="actions">
                        <button onClick={() => move(i, -1)} disabled={!canEdit}>↑</button>
                        <button onClick={() => move(i, 1)} disabled={!canEdit}>↓</button>
                      </div>
                    </td>
                    <td>
                      <code>{s.key}</code>
                    </td>
                    <td>
                      <input
                        value={s.label}
                        onChange={(e) => changeField(i, 'label', e.target.value)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={s.wip_limit ?? ''}
                        placeholder="sem limite"
                        onChange={(e) => changeField(i, 'wip_limit', e.target.value === '' ? null : Number(e.target.value))}
                        disabled={!canEdit}
                        style={{ width: 100 }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(s.is_closed)}
                        onChange={(e) => changeField(i, 'is_closed', e.target.checked ? 1 : 0)}
                        disabled={!canEdit}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
