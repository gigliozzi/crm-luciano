import { useEffect, useMemo, useState } from 'react';
import { KanbanColumn } from './KanbanColumn.jsx';
import { apiClient } from '../../services/api.js';

const defaultColumns = [
  { key: 'new', label: 'Novo' },
  { key: 'qualifying', label: 'Qualificando' },
  { key: 'scheduled', label: 'Agendado' },
  { key: 'proposal', label: 'Proposta' },
  { key: 'won', label: 'Fechado (Ganho)' },
  { key: 'lost', label: 'Fechado (Perdido)' },
];

export function KanbanBoard({ filters, columns = defaultColumns, onMove, onOpenLead }) {
  const [state, setState] = useState({ columns, leads: [] });
  const [dragging, setDragging] = useState(null);

  // Load stages + leads from API (respect filters)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [{ data: s }, { data: l }] = await Promise.all([
          apiClient.get('/kanban/stages'),
          apiClient.get('/kanban/leads', { params: filters }),
        ]);
        if (!cancelled) {
          setState({ columns: s.stages || defaultColumns, leads: (l.leads || []) });
        }
      } catch (err) {
        console.warn('Kanban: falha ao carregar API.');
        if (!cancelled) setState({ columns: defaultColumns, leads: [] });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);

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

  const handleDrop = async (e, toStage, targetIndex) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (!id) return;

    // optimistic UI
    setState((cur) => {
      const leads = [...cur.leads];
      const moved = leads.find((l) => l.id === id);
      if (!moved) return cur;
      moved.stage = toStage;
      return { columns: cur.columns, leads };
    });
    setDragging(null);

    try {
      const body = Number.isFinite(targetIndex) ? { toStage, position: targetIndex } : { toStage };
      await apiClient.patch(/kanban/leads//move, body);
    } catch (err) {
      console.warn('Falha ao mover lead, recarregando');
      try {
        const { data } = await apiClient.get('/kanban/leads', { params: filters });
        setState((cur) => ({ columns: cur.columns, leads: data.leads || [] }));
      } catch {}
    }

    onMove?.({ id, toStage });
  };

  const handleOpen = (lead) => {
    if (onOpenLead) onOpenLead(lead);
    else alert(Abrir lead  (ID ));
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
