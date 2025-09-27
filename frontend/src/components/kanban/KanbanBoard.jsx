import { useEffect, useMemo, useState } from 'react';
import { KanbanColumn } from './KanbanColumn.jsx';
import { apiClient } from '../../services/api.js';

const STORAGE_KEY = 'kanban-demo-state';

const defaultColumns = [
  { key: 'new', label: 'Novo' },
  { key: 'qualifying', label: 'Qualificando' },
  { key: 'scheduled', label: 'Agendado' },
  { key: 'proposal', label: 'Proposta' },
  { key: 'won', label: 'Fechado (Ganho)' },
  { key: 'lost', label: 'Fechado (Perdido)' },
];

// Demo fallback in case API is unreachable
const demoLeads = [
  { id: 1, name: 'Carlos Souza', phone: '+5511999991111', email: 'carlos@example.com', city: 'São Paulo', neighborhood: 'Moema', min_price: 600000, max_price: 900000, tags: 'apto,3dorm', stage: 'new', position: 0 },
  { id: 2, name: 'Marina Alves', phone: '+5521977772222', email: 'marina@example.com', city: 'Rio', neighborhood: 'Tijuca', interest_type: 'rent', min_price: 2500, max_price: 3500, tags: 'casa', stage: 'qualifying', position: 0 },
  { id: 3, name: 'Eduardo Lima', phone: '+5531988883333', email: 'edu@example.com', city: 'BH', neighborhood: 'Savassi', tags: 'sala,comercial', stage: 'proposal', position: 0 },
];

export function KanbanBoard({ columns = defaultColumns, initialLeads = demoLeads, onMove }) {
  const [state, setState] = useState({ columns, leads: initialLeads });
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Load stages + leads from API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [{ data: s }, { data: l }] = await Promise.all([
          apiClient.get('/kanban/stages'),
          apiClient.get('/kanban/leads'),
        ]);
        if (!cancelled) {
          setState({ columns: s.stages || defaultColumns, leads: (l.leads || demoLeads) });
        }
      } catch (err) {
        console.warn('Kanban: falha ao carregar API. Usando demo.');
        if (!cancelled) setState({ columns: defaultColumns, leads: demoLeads });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(state.columns.map((c) => [c.key, []]));
    for (const l of state.leads) {
      (map[l.stage] ||= []).push(l);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.position - b.position || a.id - b.id);
    }
    return map;
  }, [state]);

  const handleStartDrag = (e, lead) => {
    e.dataTransfer.setData('text/plain', String(lead.id));
    setDragging(lead.id);
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
  };

  const handleDrop = async (e, toStage) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (!id) return;

    // optimistic UI
    setState((cur) => ({
      columns: cur.columns,
      leads: cur.leads.map((l) => (l.id === id ? { ...l, stage: toStage } : l)),
    }));
    setDragging(null);

    try {
      await apiClient.patch(`/kanban/leads/${id}/move`, { toStage });
    } catch (err) {
      console.warn('Falha ao mover lead, revertendo');
      // reload minimal
      try {
        const { data } = await apiClient.get('/kanban/leads');
        setState((cur) => ({ columns: cur.columns, leads: data.leads || [] }));
      } catch {}
    }

    onMove?.({ id, toStage });
  };

  const handleOpen = (lead) => {
    alert(`Abrir lead ${lead.name} (ID ${lead.id}) — Integração futura`);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        rowGap: 12,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        overflowX: 'hidden',
        paddingBottom: 12,
      }}
    >
      {state.columns.map((col) => (
        <KanbanColumn
          key={col.key}
          column={col}
          leads={byStage[col.key] || []}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onStartDrag={handleStartDrag}
          onOpen={handleOpen}
        />)
      )}
    </div>
  );
}
