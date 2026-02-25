import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArchitectureComponent, Connection, COMPONENT_META } from '../../data/types';
import { useBuilderStore } from '../../stores/builderStore';

const GRID_SIZE = 40;
const COMPONENT_W = 110;
const COMPONENT_H = 84;

const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// ─── CanvasComponent ──────────────────────────────────────────────────────────

interface CanvasComponentProps {
  component: ArchitectureComponent;
  isSelected: boolean;
  isPendingSource: boolean;  // this component is the "from" in a pending connection
  isPendingTarget: boolean;  // pending connection is active and this is a valid target
  onSelect: (id: string) => void;
  onStartConnection: (id: string) => void;
  onFinishConnection: (id: string) => void;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component,
  isSelected,
  isPendingSource,
  isPendingTarget,
  onSelect,
  onStartConnection,
  onFinishConnection,
  onMouseDown,
}) => {
  const meta = COMPONENT_META[component.type];
  const { removeComponent } = useBuilderStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPendingTarget) {
      onFinishConnection(component.id);
    } else if (!isPendingSource) {
      onSelect(component.id);
    }
  };

  let borderClass = 'border-gray-600 bg-gray-800/80 hover:border-gray-400';
  if (isSelected)        borderClass = 'border-brand-500 bg-brand-900/20 shadow-lg shadow-brand-500/20';
  if (isPendingSource)   borderClass = 'border-brand-400 bg-brand-900/30 shadow-lg shadow-brand-400/30';
  if (isPendingTarget)   borderClass = 'border-green-400 bg-green-900/20 shadow-lg shadow-green-400/30 ring-2 ring-green-400/30 cursor-crosshair';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: COMPONENT_W,
        height: COMPONENT_H,
        touchAction: 'none',
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 select-none transition-colors duration-100 ${borderClass}`}
      onClick={handleClick}
      onMouseDown={(e) => onMouseDown(component.id, e)}
    >
      <span className="text-2xl mb-1 pointer-events-none">{meta.icon}</span>
      <span className="text-xs font-semibold text-gray-200 text-center leading-tight px-2 pointer-events-none">
        {meta.label}
      </span>

      {/* Action buttons — only when selected and NOT in connection-draw mode */}
      {isSelected && !isPendingSource && (
        <>
          {/* Delete — top-right */}
          <button
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white text-sm font-bold flex items-center justify-center shadow-md z-10"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeComponent(component.id); }}
            title="Remove component"
          >
            ×
          </button>

          {/* Connect — bottom-right */}
          <button
            className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-green-500 hover:bg-green-400 text-white text-xs font-bold flex items-center justify-center shadow-md z-10"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onStartConnection(component.id); }}
            title="Draw connection to another component"
          >
            ⇢
          </button>
        </>
      )}

      {/* Pulse ring when this is the active source */}
      {isPendingSource && (
        <span className="absolute inset-0 rounded-xl border-2 border-brand-400 animate-ping opacity-40 pointer-events-none" />
      )}
    </motion.div>
  );
};

// ─── ConnectionLine ───────────────────────────────────────────────────────────

interface ConnectionLineProps {
  conn: Connection;
  components: ArchitectureComponent[];
  onRemove: (id: string) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ conn, components, onRemove }) => {
  const from = components.find((c) => c.id === conn.from);
  const to   = components.find((c) => c.id === conn.to);
  if (!from || !to) return null;

  const x1 = from.x + COMPONENT_W / 2;
  const y1 = from.y + COMPONENT_H / 2;
  const x2 = to.x   + COMPONENT_W / 2;
  const y2 = to.y   + COMPONENT_H / 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <g>
      {/* Invisible wide hit-area line for easier hover */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} />

      {/* Visible connection line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="6 3"
        markerEnd="url(#sq-arrow)"
        opacity={0.75}
      />

      {/* Delete button at midpoint — always rendered, shown on hover via group */}
      <g className="connection-del-group" style={{ cursor: 'pointer' }} onClick={() => onRemove(conn.id)}>
        <circle cx={mx} cy={my} r={9} fill="#1f2937" stroke="#ef4444" strokeWidth={1.5} opacity={0} className="connection-del-bg" />
        <text x={mx} y={my + 4} textAnchor="middle" fill="#ef4444" fontSize={11} fontWeight="bold" opacity={0} className="connection-del-text" style={{ userSelect: 'none' }}>×</text>
      </g>
    </g>
  );
};

// ─── ArchitectureCanvas ───────────────────────────────────────────────────────

interface ArchitectureCanvasProps {
  requiredComponents: string[];
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({ requiredComponents }) => {
  const {
    architecture,
    setSelectedComponent,
    selectedComponentId,
    moveComponent,
    addConnection,
    removeConnection,
  } = useBuilderStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Connection draw state
  const [pendingFrom, setPendingFrom]   = useState<string | null>(null);
  const [mousePos,    setMousePos]      = useState<{ x: number; y: number } | null>(null);

  // dnd-kit droppable registration
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

  // Assign both refs to the same node
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [setNodeRef]);

  // Track mouse over canvas for rubber-band preview line
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pendingFrom || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [pendingFrom]);

  // Cancel connection on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPendingFrom(null); setMousePos(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only fire if click landed directly on the canvas background
    if (e.target !== e.currentTarget) return;
    setSelectedComponent(null);
    setPendingFrom(null);
    setMousePos(null);
  };

  const handleStartConnection = useCallback((id: string) => {
    setPendingFrom(id);
    setSelectedComponent(null);
    setMousePos(null);
  }, [setSelectedComponent]);

  const handleFinishConnection = useCallback((toId: string) => {
    if (pendingFrom && pendingFrom !== toId) {
      addConnection(pendingFrom, toId);
    }
    setPendingFrom(null);
    setMousePos(null);
  }, [pendingFrom, addConnection]);

  // Drag placed components with mouse
  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (pendingFrom) return;              // in connection mode — don't drag
    if ((e.target as HTMLElement).tagName === 'BUTTON') return; // let buttons handle their own events
    e.stopPropagation();

    const comp = architecture.components.find((c) => c.id === id);
    if (!comp || !canvasRef.current) return;

    const rect   = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left - comp.x;
    const startY = e.clientY - rect.top  - comp.y;
    let hasMoved = false;

    const onMove = (me: MouseEvent) => {
      hasMoved = true;
      const nx = snap(Math.max(0, me.clientX - rect.left - startX));
      const ny = snap(Math.max(0, me.clientY - rect.top  - startY));
      moveComponent(id, nx, ny);
    };

    const onUp = () => {
      if (!hasMoved) setSelectedComponent(id);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [architecture.components, pendingFrom, moveComponent, setSelectedComponent]);

  // ── Rubber-band line source coordinates ──────────────────────────────────
  const pendingComp = pendingFrom
    ? architecture.components.find((c) => c.id === pendingFrom)
    : null;
  const rbX1 = pendingComp ? pendingComp.x + COMPONENT_W / 2 : 0;
  const rbY1 = pendingComp ? pendingComp.y + COMPONENT_H / 2 : 0;

  const placedTypes = architecture.components.map((c) => c.type);
  const canvasW = 900;
  const canvasH = 560;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Requirements status bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2 flex-wrap min-h-[40px]">
        {requiredComponents.map((type) => {
          const placed = placedTypes.includes(type as never);
          const meta   = COMPONENT_META[type as keyof typeof COMPONENT_META];
          return meta ? (
            <span key={type} className={`badge text-xs ${
              placed
                ? 'bg-green-900/40 text-green-400 border border-green-700/40'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              {placed ? '✓' : '○'} {meta.label}
            </span>
          ) : null;
        })}
        {pendingFrom && (
          <span className="badge bg-brand-900/50 text-brand-300 border border-brand-600/50 animate-pulse text-xs">
            ⇢ Click a component to connect — Esc to cancel
          </span>
        )}
      </div>

      {/* Canvas area */}
      <div
        ref={setRefs}
        className={`flex-1 relative overflow-auto canvas-grid transition-all duration-150 ${
          isOver      ? 'ring-2 ring-inset ring-brand-500/40' : ''
        } ${pendingFrom ? 'cursor-crosshair' : ''}`}
        style={{ minWidth: canvasW, minHeight: canvasH }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      >
        {/* ── SVG layer — connections + rubber-band ──────────────────────── */}
        <svg
          className="absolute inset-0 overflow-visible"
          style={{ width: canvasW, height: canvasH, pointerEvents: 'none' }}
        >
          {/* Arrow marker — defined ONCE here, referenced by all lines */}
          <defs>
            <marker id="sq-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Existing connections — pointer-events enabled per element */}
          <g style={{ pointerEvents: 'all' }}>
            {architecture.connections.map((conn) => (
              <ConnectionLine
                key={conn.id}
                conn={conn}
                components={architecture.components}
                onRemove={removeConnection}
              />
            ))}
          </g>

          {/* Rubber-band preview line while drawing a connection */}
          {pendingFrom && pendingComp && mousePos && (
            <line
              x1={rbX1} y1={rbY1}
              x2={mousePos.x} y2={mousePos.y}
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.7}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* ── Component nodes ───────────────────────────────────────────── */}
        {architecture.components.map((comp) => (
          <CanvasComponent
            key={comp.id}
            component={comp}
            isSelected={selectedComponentId === comp.id}
            isPendingSource={pendingFrom === comp.id}
            isPendingTarget={!!pendingFrom && pendingFrom !== comp.id}
            onSelect={setSelectedComponent}
            onStartConnection={handleStartConnection}
            onFinishConnection={handleFinishConnection}
            onMouseDown={handleMouseDown}
          />
        ))}

        {/* Empty state hint */}
        {architecture.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-10">🏗️</div>
              <p className="text-gray-600 text-sm">Drag components from the left panel onto the canvas</p>
            </div>
          </div>
        )}
      </div>

      {/* CSS for connection delete button hover — injected once */}
      <style>{`
        .connection-del-group:hover .connection-del-bg  { opacity: 1 !important; }
        .connection-del-group:hover .connection-del-text { opacity: 1 !important; }
      `}</style>
    </div>
  );
};
