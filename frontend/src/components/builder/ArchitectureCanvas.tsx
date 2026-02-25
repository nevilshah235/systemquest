import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { ArchitectureComponent, Connection, ComponentType, COMPONENT_META } from '../../data/types';
import { useBuilderStore } from '../../stores/builderStore';

const GRID_SIZE    = 40;
const COMP_W       = 110;
const COMP_H       = 84;
const HANDLE_R     = 6;   // edge handle radius px

const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// ── Auto-label lookup ─────────────────────────────────────────────────────────

const CONN_LABELS: Partial<Record<string, Partial<Record<string, string>>>> = {
  client:      { loadbalancer: 'HTTP', server: 'HTTP', apigateway: 'HTTP', cdn: 'static' },
  loadbalancer:{ server: 'route' },
  apigateway:  { server: 'route', loadbalancer: 'route' },
  server:      { database: 'queries', cache: 'cache', queue: 'enqueue',
                 storage: 'files',   monitoring: 'metrics', apigateway: 'API' },
  cache:       { database: 'miss→DB' },
  queue:       { server: 'consume' },
  monitoring:  { server: 'alerts' },
  cdn:         { server: 'origin', storage: 'files' },
};

function autoLabel(fromType: string, toType: string): string {
  return CONN_LABELS[fromType]?.[toType] ?? 'data flow';
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface Pt { x: number; y: number }

type EdgeSide = 'top' | 'right' | 'bottom' | 'left';
interface EdgeHandle { pt: Pt; side: EdgeSide }

function edgeHandles(c: ArchitectureComponent): EdgeHandle[] {
  return [
    { pt: { x: c.x + COMP_W / 2, y: c.y              }, side: 'top'    },
    { pt: { x: c.x + COMP_W,     y: c.y + COMP_H / 2 }, side: 'right'  },
    { pt: { x: c.x + COMP_W / 2, y: c.y + COMP_H     }, side: 'bottom' },
    { pt: { x: c.x,              y: c.y + COMP_H / 2  }, side: 'left'   },
  ];
}

// Closest edge point from comp toward a target point
function closestEdge(comp: ArchitectureComponent, target: Pt): Pt {
  const cx = comp.x + COMP_W / 2;
  const cy = comp.y + COMP_H / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { x: comp.x + COMP_W, y: cy }
      : { x: comp.x,           y: cy };
  }
  return dy > 0
    ? { x: cx, y: comp.y + COMP_H }
    : { x: cx, y: comp.y          };
}

// Bezier path from p1 to p2
function bezierPath(p1: Pt, p2: Pt): string {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const curve = Math.max(50, Math.min(Math.abs(dx), Math.abs(dy)) * 0.5 + 40);
  const cx1 = p1.x + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? curve : -curve) : 0);
  const cy1 = p1.y + (Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? curve : -curve) : 0);
  const cx2 = p2.x - (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? curve : -curve) : 0);
  const cy2 = p2.y - (Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? curve : -curve) : 0);
  return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
}

// ── CanvasComponent ───────────────────────────────────────────────────────────

interface CanvasComponentProps {
  component: ArchitectureComponent;
  isSelected: boolean;
  isHovered: boolean;
  isConnTarget: boolean;  // valid connection target while drawing
  isConnSource: boolean;  // currently drawing from this component
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onSelect: (id: string) => void;
  onDeleteComp: (id: string) => void;
  onEdgeHandleDragStart: (compId: string, fromPt: Pt, e: React.MouseEvent) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component, isSelected, isHovered, isConnTarget, isConnSource,
  onMouseEnter, onMouseLeave, onSelect, onDeleteComp, onEdgeHandleDragStart,
}) => {
  const meta = COMPONENT_META[component.type];

  let borderClass = 'border-gray-600 bg-gray-800/80';
  if (isSelected)   borderClass = 'border-brand-500 bg-brand-900/20 shadow-brand-500/20';
  if (isConnSource) borderClass = 'border-brand-400 bg-brand-900/30';
  if (isConnTarget) borderClass = 'border-green-400 bg-green-900/20 ring-2 ring-green-400/30';
  if (isHovered && !isSelected && !isConnTarget && !isConnSource)
                    borderClass = 'border-gray-400 bg-gray-800';

  const showHandles = (isHovered || isSelected) && !isConnSource;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1,   opacity: 1  }}
      transition={{ duration: 0.15 }}
      style={{ position: 'absolute', left: component.x, top: component.y,
               width: COMP_W, height: COMP_H, touchAction: 'none' }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 select-none
        transition-colors duration-100 group ${borderClass}
        ${isConnTarget ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      onMouseEnter={() => onMouseEnter(component.id)}
      onMouseLeave={onMouseLeave}
      onClick={(e) => { e.stopPropagation(); if (!isConnSource) onSelect(component.id); }}
    >
      <span className="text-2xl mb-1 pointer-events-none">{meta.icon}</span>
      <span className="text-xs font-semibold text-gray-200 text-center leading-tight px-2 pointer-events-none">
        {meta.label}
      </span>

      {/* Delete button — top-right corner, only when selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400
              text-white text-sm font-bold flex items-center justify-center shadow-lg z-20"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDeleteComp(component.id); }}
            title="Remove"
          >×</motion.button>
        )}
      </AnimatePresence>

      {/* Ping animation when source */}
      {isConnSource && (
        <span className="absolute inset-0 rounded-xl border-2 border-brand-400 animate-ping opacity-30 pointer-events-none" />
      )}

      {/* ── Edge handles — 4 dots on borders, visible on hover/select ────── */}
      {showHandles && edgeHandles(component).map(({ pt, side }) => {
        // Position relative to component (pt is in canvas coords)
        const relX = pt.x - component.x;
        const relY = pt.y - component.y;
        return (
          <motion.div
            key={side}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              left: relX - HANDLE_R,
              top:  relY - HANDLE_R,
              width:  HANDLE_R * 2,
              height: HANDLE_R * 2,
              zIndex: 30,
            }}
            className="rounded-full bg-green-500 border-2 border-white shadow-md
              cursor-crosshair hover:bg-green-400 hover:scale-125 transition-transform"
            title={`Connect from ${side} edge`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEdgeHandleDragStart(component.id, pt, e);
            }}
          />
        );
      })}
    </motion.div>
  );
};

// ── ConnectionLine ────────────────────────────────────────────────────────────

interface ConnectionLineProps {
  conn: Connection;
  components: ArchitectureComponent[];
  onRemove: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ conn, components, onRemove, onLabelChange }) => {
  const [hovered,      setHovered]      = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft,   setLabelDraft]   = useState(conn.label ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const from = components.find((c) => c.id === conn.from);
  const to   = components.find((c) => c.id === conn.to);
  if (!from || !to) return null;

  const p1     = closestEdge(from, { x: to.x + COMP_W / 2,   y: to.y   + COMP_H / 2 });
  const p2     = closestEdge(to,   { x: from.x + COMP_W / 2, y: from.y + COMP_H / 2 });
  const path   = bezierPath(p1, p2);
  const pathId = `path-${conn.id}`;
  const mx     = (p1.x + p2.x) / 2;
  const my     = (p1.y + p2.y) / 2;

  const displayLabel = conn.label ?? autoLabel(from.type, to.type);

  const commitLabel = () => {
    onLabelChange(conn.id, labelDraft.trim() || autoLabel(from.type, to.type));
    setEditingLabel(false);
  };

  useEffect(() => {
    if (editingLabel) inputRef.current?.focus();
  }, [editingLabel]);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
    >
      {/* Wide invisible hit-area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: 'pointer' }} />

      {/* Glow on hover */}
      {hovered && (
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth={8}
          opacity={0.2} style={{ filter: 'blur(5px)', pointerEvents: 'none' }} />
      )}

      {/* Main line */}
      <path
        id={pathId} d={path} fill="none"
        stroke={hovered ? '#60a5fa' : '#3b82f6'}
        strokeWidth={hovered ? 2.5 : 1.8}
        strokeDasharray={hovered ? '0' : '7 3'}
        opacity={hovered ? 1 : 0.65}
        style={{ transition: 'stroke 0.15s, stroke-width 0.15s', pointerEvents: 'none' }}
      />

      {/* Animated flow dots — direction indicator */}
      <circle r={3.5} fill={hovered ? '#93c5fd' : '#60a5fa'} opacity={hovered ? 1 : 0.8}>
        <animateMotion dur="1.6s" repeatCount="indefinite">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      <circle r={2.5} fill="#3b82f6" opacity={0.5}>
        <animateMotion dur="1.6s" begin="-0.8s" repeatCount="indefinite">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>

      {/* Connection label — click to edit */}
      {!editingLabel ? (
        <g
          transform={`translate(${mx}, ${my})`}
          onClick={() => { setEditingLabel(true); setLabelDraft(displayLabel); }}
          style={{ cursor: 'text', pointerEvents: 'all' }}
        >
          <rect x={-28} y={-10} width={56} height={20} rx={10}
            fill={hovered ? '#1e3a5f' : '#1f2937'}
            stroke={hovered ? '#3b82f6' : '#374151'}
            strokeWidth={1}
            style={{ transition: 'fill 0.15s, stroke 0.15s' }}
          />
          <text textAnchor="middle" y={4}
            fill={hovered ? '#93c5fd' : '#9ca3af'}
            fontSize={9} fontWeight={600}
            style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
          >
            {displayLabel.length > 10 ? displayLabel.slice(0, 9) + '…' : displayLabel}
          </text>
        </g>
      ) : (
        // Inline label editor (rendered via foreignObject)
        <foreignObject x={mx - 36} y={my - 12} width={72} height={24}>
          <input
            ref={inputRef}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') setEditingLabel(false); }}
            style={{
              width: '100%', height: '100%', fontSize: 10, textAlign: 'center',
              background: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f6',
              borderRadius: 10, outline: 'none', padding: '0 6px',
            }}
          />
        </foreignObject>
      )}

      {/* Delete × at midpoint — hover only */}
      {hovered && (
        <g
          transform={`translate(${mx + 32}, ${my - 10})`}
          onClick={() => onRemove(conn.id)}
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
        >
          <circle r={8} fill="#1f2937" stroke="#ef4444" strokeWidth={1.5} />
          <text textAnchor="middle" y={4} fill="#ef4444" fontSize={12} fontWeight="bold"
            style={{ userSelect: 'none', pointerEvents: 'none' }}>×</text>
        </g>
      )}
    </g>
  );
};

// ── ArchitectureCanvas ────────────────────────────────────────────────────────

interface ArchitectureCanvasProps {
  requiredComponents: string[];
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({ requiredComponents }) => {
  const {
    architecture, setSelectedComponent, selectedComponentId,
    moveComponent, addConnection, updateConnectionLabel, removeConnection, removeComponent,
  } = useBuilderStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Connection draw state
  const [pendingConn, setPendingConn] = useState<{ fromId: string; fromPt: Pt } | null>(null);
  const [mousePos,    setMousePos]    = useState<Pt | null>(null);
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);

  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [setNodeRef]);

  // Mouse move — rubber band preview while drawing connection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pendingConn || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, [pendingConn]);

  // Release anywhere on canvas → cancel pending connection
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!pendingConn) return;
    // Check if released over a component
    const target = (e.target as HTMLElement).closest('[data-comp-id]');
    const toId   = target?.getAttribute('data-comp-id');
    if (toId && toId !== pendingConn.fromId) {
      const fromComp = architecture.components.find((c) => c.id === pendingConn.fromId);
      const toComp   = architecture.components.find((c) => c.id === toId);
      if (fromComp && toComp) {
        const label = autoLabel(fromComp.type, toComp.type);
        addConnection(pendingConn.fromId, toId, label);
      }
    }
    setPendingConn(null);
    setMousePos(null);
  }, [pendingConn, architecture.components, addConnection]);

  // Keyboard: Escape cancels; 'C' starts connection from selected
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPendingConn(null); setMousePos(null); return; }
      if ((e.key === 'c' || e.key === 'C') && selectedComponentId && !pendingConn) {
        const comp = architecture.components.find((c) => c.id === selectedComponentId);
        if (comp) {
          const fromPt = { x: comp.x + COMP_W, y: comp.y + COMP_H / 2 }; // right edge
          setPendingConn({ fromId: selectedComponentId, fromPt });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedComponentId, pendingConn, architecture.components]);

  // Start a connection drag from a specific edge handle
  const handleEdgeDragStart = useCallback((compId: string, fromPt: Pt, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingConn({ fromId: compId, fromPt });
    setSelectedComponent(null);
    if (canvasRef.current) {
      const r = canvasRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
    }
  }, [setSelectedComponent]);

  // Component click during connection mode → finish connection
  const handleCompSelect = useCallback((id: string) => {
    if (pendingConn && pendingConn.fromId !== id) {
      const fromComp = architecture.components.find((c) => c.id === pendingConn.fromId);
      const toComp   = architecture.components.find((c) => c.id === id);
      if (fromComp && toComp) {
        addConnection(pendingConn.fromId, id, autoLabel(fromComp.type, toComp.type));
      }
      setPendingConn(null);
      setMousePos(null);
    } else {
      setSelectedComponent(id);
    }
  }, [pendingConn, architecture.components, addConnection, setSelectedComponent]);

  // Drag placed component with mouse
  const handleCompDrag = useCallback((id: string, e: React.MouseEvent) => {
    if (pendingConn) return;
    e.stopPropagation();
    const comp = architecture.components.find((c) => c.id === id);
    if (!comp || !canvasRef.current) return;
    const r      = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - r.left - comp.x;
    const startY = e.clientY - r.top  - comp.y;
    let moved = false;

    const onMove = (me: MouseEvent) => {
      moved = true;
      moveComponent(id, snap(Math.max(0, me.clientX - r.left - startX)),
                        snap(Math.max(0, me.clientY - r.top  - startY)));
    };
    const onUp = () => {
      if (!moved) setSelectedComponent(id);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [architecture.components, pendingConn, moveComponent, setSelectedComponent]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    setSelectedComponent(null);
    setPendingConn(null);
    setMousePos(null);
  };

  const placedTypes = architecture.components.map((c) => c.type);
  const canvasW = 900;
  const canvasH = 580;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Requirements status bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2 flex-wrap min-h-[42px]">
        {requiredComponents.map((type) => {
          const placed = placedTypes.includes(type as ComponentType);
          const meta   = COMPONENT_META[type as ComponentType];
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

        {pendingConn
          ? <span className="badge bg-green-900/40 text-green-300 border border-green-600/40 animate-pulse text-xs ml-auto">
              ⇢ Drag or click a component to connect · Esc to cancel
            </span>
          : selectedComponentId
          ? <span className="badge bg-gray-800 text-gray-500 border border-gray-700 text-xs ml-auto">
              Press <kbd className="px-1 bg-gray-700 rounded text-gray-300">C</kbd> to start connecting
            </span>
          : null
        }
      </div>

      {/* Canvas */}
      <div
        ref={setRefs}
        className={`flex-1 relative overflow-auto canvas-grid
          ${isOver      ? 'ring-2 ring-inset ring-brand-500/40' : ''}
          ${pendingConn ? 'cursor-crosshair' : ''}`}
        style={{ minWidth: canvasW, minHeight: canvasH }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* SVG layer — connections + rubber-band */}
        <svg
          className="absolute inset-0 overflow-visible"
          style={{ width: canvasW, height: canvasH, pointerEvents: 'none' }}
        >
          <g style={{ pointerEvents: 'all' }}>
            {architecture.connections.map((conn) => (
              <ConnectionLine
                key={conn.id}
                conn={conn}
                components={architecture.components}
                onRemove={removeConnection}
                onLabelChange={updateConnectionLabel}
              />
            ))}
          </g>

          {/* Rubber-band preview */}
          {pendingConn && mousePos && (() => {
            const src = pendingConn.fromPt;
            return (
              <>
                <path
                  d={bezierPath(src, mousePos)} fill="none"
                  stroke="#22c55e" strokeWidth={8} opacity={0.12}
                  style={{ filter: 'blur(5px)', pointerEvents: 'none' }}
                />
                <path
                  d={bezierPath(src, mousePos)} fill="none"
                  stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4"
                  opacity={0.85} style={{ pointerEvents: 'none' }}
                />
                <circle cx={src.x} cy={src.y} r={5} fill="#22c55e" opacity={0.9} />
                <circle cx={mousePos.x} cy={mousePos.y} r={4}
                  fill="#22c55e" opacity={0.7} style={{ pointerEvents: 'none' }} />
              </>
            );
          })()}
        </svg>

        {/* Component nodes — data-comp-id used to detect drop target on mouseUp */}
        {architecture.components.map((comp) => (
          <div
            key={comp.id}
            data-comp-id={comp.id}
            style={{ position: 'absolute', left: comp.x, top: comp.y,
                     width: COMP_W, height: COMP_H }}
            onMouseDown={(e) => handleCompDrag(comp.id, e)}
          >
            <CanvasComponent
              component={comp}
              isSelected={selectedComponentId === comp.id}
              isHovered={hoveredId === comp.id}
              isConnSource={pendingConn?.fromId === comp.id}
              isConnTarget={!!pendingConn && pendingConn.fromId !== comp.id}
              onMouseEnter={setHoveredId}
              onMouseLeave={() => setHoveredId(null)}
              onSelect={handleCompSelect}
              onDeleteComp={removeComponent}
              onEdgeHandleDragStart={handleEdgeDragStart}
            />
          </div>
        ))}

        {architecture.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-10">🏗️</div>
              <p className="text-gray-600 text-sm">Drag components from the left panel onto the canvas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
