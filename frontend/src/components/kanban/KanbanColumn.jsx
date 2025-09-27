import { useRef } from 'react';
import { KanbanCard } from './KanbanCard.jsx';

export function KanbanColumn({ column, leads, onDragOver, onDrop, onStartDrag, onOpen }) {
  const containerRef = useRef(null);

  const computeDropIndex = (clientY) => {
    const container = containerRef.current;
    if (!container) return leads.length;
    const items = Array.from(container.querySelectorAll('[data-card="1"]'));
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) return i;
    }
    return items.length;
  };

  const handleDrop = (e) => {
    const idx = computeDropIndex(e.clientY);
    onDrop(e, column.key, idx);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => onDragOver(e, column.key)}
      onDrop={handleDrop}
      style={{
        flex: '1 1 320px',
        minWidth: 280,
        maxWidth: 420,
        boxSizing: 'border-box',
        background: '#f7f9fc',
        border: '1px solid #e1e5ee',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{column.label}</strong>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>{leads.length}</span>
      </div>
      {leads.map((lead, idx) => (
        <div key={lead.id} data-card="1" data-index={idx}>
          <KanbanCard lead={lead} onStartDrag={onStartDrag} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
