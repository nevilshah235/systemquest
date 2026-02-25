import React, { useRef, useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { ArchitectureComponent, Connection, COMPONENT_META } from '../../data/types';
import { useBuilderStore } from '../../stores/builderStore';

const GRID_SIZE = 40;
const COMPONENT_W = 100;
const COMPONENT_H = 80;

// Snap a value to the nearest grid cell
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

interface CanvasComponentProps {
  component: ArchitectureComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStartConnection: (id: string) => void;
  pendingFrom: string | null;
  onFinishConnection: (id: string) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component, isSelected, onSelect, onStartConnection, pendingFrom, onFinishConnection,
}) => {
  const meta = COMPONENT_META[component.type];
  const { removeComponent } = useBuilderStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingFrom && pendingFrom !== component.id) {
      onFinishConnection(component.id);
    } else {
      onSelect(component.id);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: COMPONENT_W,
        height: COMPONENT_H,
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 cursor-pointer select-none transition-all
        ${isSelected ? 'border-brand-500 shadow-lg shadow-brand-500/30 bg-brand-900/30' : 'border-gray-600 bg-gray-800/80 hover:border-gray-500'}
        ${pendingFrom && pendingFrom !== component.id ? 'border-green-500 hover:border-green-400 ring-2 ring-green-500/30' : ''}
      `}
      onClick={handleClick}
    >
      <span className="text-2xl mb-1">{meta.icon}</span>
      <span className="text-xs font-semibold text-gray-200 text-center leading-tight px-1">{meta.label}</span>

      {/* Delete button */}
      {isSelected && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400"
          onClick={(e) => { e.stopPropagation(); removeComponent(component.id); }}
          title="Remove"
        >×</button>
      )}

      {/* Connect button */}
      {isSelected && (
        <button
          className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center hover:bg-green-400"
          onClick={(e) => { e.stopPropagation(); onStartConnection(component.id); }}
          title="Draw connection"
        >→</button>
      )}
    </motion.div>
  );
};

interface ConnectionLineProps {
  conn: Connection;
  components: ArchitectureComponent[];
  onRemove: (id: string) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ conn, components, onRemove }) => {
  const from = components.find((c) => c.id === conn.from);
  const to = components.find((c) => c.id === conn.to);
  if (!from || !to) return null;

  const x1 = from.x + COMPONENT_W / 2;
  const y1 = from.y + COMPONENT_H / 2;
  const x2 = to.x + COMPONENT_W / 2;
  const y2 = to.y + COMPONENT_H / 2;

  // Midpoint for delete button
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <g>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="6 3"
        markerEnd="url(#arrow)"
        className="opacity-70"
      />
      <circle
        cx={mx} cy={my} r={7}
        fill="#ef4444"
        className="cursor-pointer opacity-0 hover:opacity-100"
        onClick={() => onRemove(conn.id)}
      >
        <title>Remove connection</title>
      </circle>
    </g>
  );
};

interface ArchitectureCanvasProps {
  requiredComponents: string[];
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({ requiredComponents }) => {
  const { architecture, setSelectedComponent, selectedComponentId, moveComponent, addConnection, removeConnection } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [draggingPos, setDraggingPos] = useState<{ x: number; y: number } | null>(null);

  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

  const handleCanvasClick = () => {
    setSelectedComponent(null);
    setPendingFrom(null);
  };

  const handleStartConnection = (id: string) => {
    setPendingFrom(id);
    setSelectedComponent(null);
  };

  const handleFinishConnection = (toId: string) => {
    if (pendingFrom && pendingFrom !== toId) {
      addConnection(pendingFrom, toId);
    }
    setPendingFrom(null);
  };

  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (pendingFrom) return;
    e.stopPropagation();
    setDragTarget(id);
    const comp = architecture.components.find((c) => c.id === id);
    if (!comp || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left - comp.x;
    const startY = e.clientY - rect.top - comp.y;

    const onMouseMove = (me: MouseEvent) => {
      const nx = snap(me.clientX - rect.left - startX);
      const ny = snap(me.clientY - rect.top - startY);
      setDraggingPos({ x: nx, y: ny });
      moveComponent(id, Math.max(0, nx), Math.max(0, ny));
    };

    const onMouseUp = () => {
      setDragTarget(null);
      setDraggingPos(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [architecture.components, pendingFrom, moveComponent]);

  // Check which required components are placed
  const placedTypes = architecture.components.map((c) => c.type);

  const canvasW = 800;
  const canvasH = 500;

  return (
    <div className="h-full flex flex-col">
      {/* Required components status bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex gap-2 flex-wrap">
        {requiredComponents.map((type) => {
          const placed = placedTypes.includes(type as never);
          const meta = COMPONENT_META[type as keyof typeof COMPONENT_META];
          return meta ? (
            <span key={type} className={`badge ${placed ? 'bg-green-900/50 text-green-400 border border-green-700/50' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
              {placed ? '✓' : '○'} {meta.label}
            </span>
          ) : null;
        })}
        {pendingFrom && (
          <span className="badge bg-green-900/50 text-green-400 border border-green-600 animate-pulse">
            Click a component to connect →
          </span>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={(node) => { setNodeRef(node); (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node; }}
        className={`flex-1 relative overflow-auto canvas-grid transition-all ${isOver ? 'ring-2 ring-brand-500/40' : ''}`}
        style={{ minWidth: canvasW, minHeight: canvasH }}
        onClick={handleCanvasClick}
      >
        {/* SVG connection lines layer */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: canvasW, height: canvasH }}>
          {architecture.connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              conn={conn}
              components={architecture.components}
              onRemove={removeConnection}
            />
          ))}
        </svg>

        {/* Components layer */}
        {architecture.components.map((comp) => (
          <div
            key={comp.id}
            style={{ position: 'absolute', left: comp.x, top: comp.y }}
            onMouseDown={(e) => handleMouseDown(comp.id, e)}
          >
            <CanvasComponent
              component={comp}
              isSelected={selectedComponentId === comp.id}
              onSelect={setSelectedComponent}
              onStartConnection={handleStartConnection}
              pendingFrom={pendingFrom}
              onFinishConnection={handleFinishConnection}
            />
          </div>
        ))}

        {/* Empty state */}
        {architecture.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-20">🏗️</div>
              <p className="text-gray-600 text-sm">Drag components here to build your architecture</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
