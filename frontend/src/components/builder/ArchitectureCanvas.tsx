import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArchitectureComponent, Connection, COMPONENT_META } from '../../data/types';
import { useBuilderStore } from '../../stores/builderStore';

const GRID_SIZE   = 40;
const COMPONENT_W = 110;
const COMPONENT_H = 84;

const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// ─── Edge-aware connection point calculation ──────────────────────────────────
// Returns the point on the component's border that is closest to the target,
// so lines connect at edges rather than centres.

interface Point { x: number; y: number }

function edgePoint(from: ArchitectureComponent, to: ArchitectureComponent): Point {
  const fx = from.x + COMPONENT_W / 2;
  const fy = from.y + COMPONENT_H / 2;
  const tx = to.x   + COMPONENT_W / 2;
  const ty = to.y   + COMPONENT_H / 2;

  const dx = tx - fx;
  const dy = ty - fy;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Exit from the edge in the dominant direction
  if (absDx > absDy) {
    return dx > 0
      ? { x: from.x + COMPONENT_W, y: fy }   // right edge
      : { x: from.x,               y: fy };   // left edge
  } else {
    return dy > 0
      ? { x: fx, y: from.y + COMPONENT_H }    // bottom edge
      : { x: fx, y: from.y };                 // top edge
  }
}

function entryPoint(from: ArchitectureComponent, to: ArchitectureComponent): Point {
  const fx = from.x + COMPONENT_W / 2;
  const fy = from.y + COMPONENT_H / 2;
  const tx = to.x   + COMPONENT_W / 2;
  const ty = to.y   + COMPONENT_H / 2;

  const dx = tx - fx;
  const dy = ty - fy;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy) {
    return dx > 0
      ? { x: to.x,               y: ty }      // enter left edge
      : { x: to.x + COMPONENT_W, y: ty };     // enter right edge
  } else {
    return dy > 0
      ? { x: tx, y: to.y }                    // enter top edge
      : { x: tx, y: to.y + COMPONENT_H };     // enter bottom edge
  }
}

// Build a smooth cubic bezier path between two edge points
function buildPath(p1: Point, p2: Point): string {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const curve = Math.max(60, Math.min(dx, dy) * 0.6 + 40);

  // Determine control point direction based on which edge we exit/enter
  const cx1 = p1.x + (p2.x > p1.x ? curve : p2.x < p1.x ? -curve : 0);
  const cy1 = p1.y + (p2.y > p1.y && Math.abs(p2.x - p1.x) < 20 ? curve : 0);
  const cx2 = p2.x - (p2.x > p1.x ? curve : p2.x < p1.x ? -curve : 0);
  const cy2 = p2.y - (p2.y > p1.y && Math.abs(p2.x - p1.x) < 20 ? curve : 0);

  return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
}

// ─── CanvasComponent ──────────────────────────────────────────────────────────

interface CanvasComponentProps {
  component: ArchitectureComponent;
  isSelected: boolean;
  isPendingSource: boolean;
  isPendingTarget: boolean;
  onSelect: (id: string) => void;
  onStartConnection: (id: string) => void;
  onFinishConnection: (id: string) => void;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component, isSelected, isPendingSource, isPendingTarget,
  onSelect, onStartConnection, onFinishConnection, onMouseDown,
}) => {
  const meta = COMPONENT_META[component.type];
  const { removeComponent } = useBuilderStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPendingTarget)      onFinishConnection(component.id);
    else if (!isPendingSource) onSelect(component.id);
  };

  let borderClass = 'border-gray-600 bg-gray-800/80 hover:border-gray-400';
  if (isSelected)      borderClass = 'border-brand-500 bg-brand-900/20 shadow-lg shadow-brand-500/20';
  if (isPendingSource) borderClass = 'border-brand-400 bg-brand-900/30 shadow-lg shadow-brand-400/30';
  if (isPendingTarget) borderClass = 'border-green-400 bg-green-900/20 shadow-lg shadow-green-400/30 ring-2 ring-green-400/30 cursor-crosshair';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'absolute', left: component.x, top: component.y,
               width: COMPONENT_W, height: COMPONENT_H, touchAction: 'none' }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 select-none transition-colors duration-100 ${borderClass}`}
      onClick={handleClick}
      onMouseDown={(e) => onMouseDown(component.id, e)}
    >
      <span className="text-2xl mb-1 pointer-events-none">{meta.icon}</span>
      <span className="text-xs font-semibold text-gray-200 text-center leading-tight px-2 pointer-events-none">
        {meta.label}
      </span>

      {isSelected && !isPendingSource && (
        <>
          <button
            className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white text-sm font-bold flex items-center justify-center shadow-md z-10"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeComponent(component.id); }}
            title="Remove"
          >×</button>

          <button
            className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold flex items-center justify-center shadow-md z-10 text-base leading-none"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onStartConnection(component.id); }}
            title="Connect to another component"
          >⇢</button>
        </>
      )}

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
  const [hovered, setHovered] = useState(false);

  const from = components.find((c) => c.id === conn.from);
  const to   = components.find((c) => c.id === conn.to);
  if (!from || !to) return null;

  const p1   = edgePoint(from, to);
  const p2   = entryPoint(from, to);
  const path = buildPath(p1, p2);

  // Midpoint along the bezier (approx t=0.5)
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;

  // Unique ID for this path so animateMotion can reference it
  const pathId = `path-${conn.id}`;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Wide invisible hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={16} />

      {/* Glow layer — visible when hovered */}
      {hovered && (
        <path
          d={path} fill="none"
          stroke="#3b82f6" strokeWidth={6}
          opacity={0.25}
          style={{ filter: 'blur(4px)' }}
        />
      )}

      {/* Main connection path */}
      <path
        id={pathId}
        d={path} fill="none"
        stroke={hovered ? '#60a5fa' : '#3b82f6'}
        strokeWidth={hovered ? 2.5 : 1.8}
        strokeDasharray={hovered ? 'none' : '7 3'}
        opacity={hovered ? 1 : 0.65}
        style={{ transition: 'stroke 0.15s, stroke-width 0.15s, opacity 0.15s' }}
      />

      {/* Animated flow dot — travels the path to show data direction */}
      <circle r={3.5} fill={hovered ? '#93c5fd' : '#60a5fa'} opacity={hovered ? 1 : 0.8}>
        <animateMotion dur="1.8s" repeatCount="indefinite" rotate="auto">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>

      {/* Second dot offset by half the duration for continuous flow feel */}
      <circle r={2.5} fill="#3b82f6" opacity={0.5}>
        <animateMotion dur="1.8s" begin="-0.9s" repeatCount="indefinite" rotate="auto">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>

      {/* Delete button — appears at midpoint on hover */}
      {hovered && (
        <g onClick={() => onRemove(conn.id)} style={{ cursor: 'pointer' }}>
          <circle cx={mx} cy={my} r={10} fill="#1f2937" stroke="#ef4444" strokeWidth={1.5} />
          <text
            x={mx} y={my + 4.5}
            textAnchor="middle" fill="#ef4444"
            fontSize={13} fontWeight="bold"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >×</text>
        </g>
      )}
    </g>
  );
};

// ─── ArchitectureCanvas ───────────────────────────────────────────────────────

interface ArchitectureCanvasProps {
  requiredComponents: string[];
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({ requiredComponents }) => {
  const {
    architecture, setSelectedComponent, selectedComponentId,
    moveComponent, addConnection, removeConnection,
  } = useBuilderStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [mousePos,    setMousePos]    = useState<Point | null>(null);

  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [setNodeRef]);

  // Track mouse for rubber-band preview
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pendingFrom || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [pendingFrom]);

  // Escape cancels pending connection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPendingFrom(null); setMousePos(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
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
    if (pendingFrom && pendingFrom !== toId) addConnection(pendingFrom, toId);
    setPendingFrom(null);
    setMousePos(null);
  }, [pendingFrom, addConnection]);

  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (pendingFrom) return;
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.stopPropagation();

    const comp = architecture.components.find((c) => c.id === id);
    if (!comp || !canvasRef.current) return;

    const rect   = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left - comp.x;
    const startY = e.clientY - rect.top  - comp.y;
    let hasMoved = false;

    const onMove = (me: MouseEvent) => {
      hasMoved = true;
      moveComponent(id, snap(Math.max(0, me.clientX - rect.left - startX)),
                        snap(Math.max(0, me.clientY - rect.top  - startY)));
    };
    const onUp = () => {
      if (!hasMoved) setSelectedComponent(id);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [architecture.components, pendingFrom, moveComponent, setSelectedComponent]);

  // Rubber-band source point
  const pendingComp = pendingFrom
    ? architecture.components.find((c) => c.id === pendingFrom)
    : null;
  const rbSrc: Point | null = pendingComp
    ? { x: pendingComp.x + COMPONENT_W / 2, y: pendingComp.y + COMPONENT_H / 2 }
    : null;

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

      {/* Canvas */}
      <div
        ref={setRefs}
        className={`flex-1 relative overflow-auto canvas-grid transition-all duration-150
          ${isOver      ? 'ring-2 ring-inset ring-brand-500/40' : ''}
          ${pendingFrom ? 'cursor-crosshair' : ''}`}
        style={{ minWidth: canvasW, minHeight: canvasH }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      >
        {/* SVG — connections + rubber-band preview */}
        <svg
          className="absolute inset-0 overflow-visible"
          style={{ width: canvasW, height: canvasH, pointerEvents: 'none' }}
        >
          {/* All connections with pointer-events re-enabled */}
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

          {/* Rubber-band preview line */}
          {rbSrc && mousePos && (
            <>
              {/* Glow */}
              <line
                x1={rbSrc.x} y1={rbSrc.y} x2={mousePos.x} y2={mousePos.y}
                stroke="#22c55e" strokeWidth={6} opacity={0.15}
                style={{ filter: 'blur(4px)', pointerEvents: 'none' }}
              />
              {/* Dashed line */}
              <line
                x1={rbSrc.x} y1={rbSrc.y} x2={mousePos.x} y2={mousePos.y}
                stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4"
                opacity={0.8} style={{ pointerEvents: 'none' }}
              />
              {/* Cursor dot */}
              <circle cx={mousePos.x} cy={mousePos.y} r={5}
                fill="#22c55e" opacity={0.9}
                style={{ pointerEvents: 'none' }} />
            </>
          )}
        </svg>

        {/* Component nodes */}
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
