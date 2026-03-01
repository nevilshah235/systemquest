/**
 * EntityCardBuilder — visual entity card builder using @xyflow/react.
 *
 * Each entity is a draggable node on a canvas.
 * Relationships are edges drawn between entities.
 * Mission seed entities are pre-loaded as starter cards.
 */

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  Handle,
  Position,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';
import type { EntityCard, EntityField, EntityRelationship, FieldType } from '../../../data/lldTypes';

// ── Field type options ────────────────────────────────────────────────────────
const FIELD_TYPES: FieldType[] = [
  'uuid', 'string', 'integer', 'bigint', 'float',
  'boolean', 'timestamp', 'text', 'jsonb', 'enum', 'fk',
];

const TYPE_BADGE_COLORS: Record<string, string> = {
  uuid: 'bg-purple-900/40 text-purple-300',
  string: 'bg-blue-900/40 text-blue-300',
  integer: 'bg-green-900/40 text-green-300',
  bigint: 'bg-green-900/40 text-green-300',
  float: 'bg-green-900/40 text-green-300',
  boolean: 'bg-yellow-900/40 text-yellow-300',
  timestamp: 'bg-orange-900/40 text-orange-300',
  text: 'bg-blue-900/40 text-blue-300',
  jsonb: 'bg-pink-900/40 text-pink-300',
  enum: 'bg-indigo-900/40 text-indigo-300',
  fk: 'bg-red-900/40 text-red-300',
};

// ── Custom Entity Node ────────────────────────────────────────────────────────

interface EntityNodeData {
  entity: EntityCard;
  onFieldAdd: (entityId: string, field: EntityField) => void;
  onFieldToggleIndex: (entityId: string, fieldName: string) => void;
  onFieldRemove: (entityId: string, fieldName: string) => void;
  onEntityRemove: (entityId: string) => void;
  entities: EntityCard[];
  validationErrors: string[];
}

const EntityNode: React.FC<{ data: EntityNodeData }> = ({ data }) => {
  const { entity, onFieldAdd, onFieldToggleIndex, onFieldRemove, onEntityRemove, entities, validationErrors } = data;
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [newFieldRef, setNewFieldRef] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  const hasPK = entity.fields.some(f => f.isPrimaryKey);
  const hasError = validationErrors.some(e => e.includes(entity.name));

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    onFieldAdd(entity.id, {
      name: newFieldName.trim(),
      type: newFieldType,
      references: newFieldType === 'fk' ? newFieldRef : undefined,
      isPrimaryKey: false,
      isRequired: false,
      hasIndex: false,
    });
    setNewFieldName('');
    setNewFieldType('string');
    setNewFieldRef('');
    setShowAddField(false);
  };

  return (
    <div className={`
      bg-gray-900 border rounded-xl shadow-xl min-w-[220px] max-w-[280px] select-none
      ${hasError ? 'border-red-500/60' : hasPK ? 'border-gray-600' : 'border-yellow-500/50'}
    `}>
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} className="!bg-brand-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-brand-500 !w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 rounded-t-xl bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wide">{entity.name}</span>
          {entity.isSeeded && (
            <span className="text-xs text-brand-400 bg-brand-900/30 px-1.5 py-0.5 rounded text-[10px]">seed</span>
          )}
        </div>
        {!entity.isSeeded && (
          <button
            onClick={() => onEntityRemove(entity.id)}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors"
          >✕</button>
        )}
      </div>

      {/* Fields list */}
      <div className="p-2 space-y-1">
        {entity.fields.length === 0 && (
          <div className="text-xs text-gray-600 text-center py-1">No fields yet</div>
        )}
        {entity.fields.map(field => (
          <div
            key={field.name}
            className="flex items-center gap-1.5 group px-1.5 py-1 rounded hover:bg-gray-800/50"
          >
            {field.isPrimaryKey && <span className="text-xs text-yellow-400">🔑</span>}
            {field.type === 'fk' && <span className="text-xs text-red-400">🔗</span>}
            <span className="text-xs text-gray-200 flex-1 truncate">{field.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${TYPE_BADGE_COLORS[field.type] ?? 'bg-gray-800 text-gray-400'}`}>
              {field.type === 'fk' && field.references ? `→${field.references}` : field.type}
            </span>
            <button
              onClick={() => onFieldToggleIndex(entity.id, field.name)}
              title={field.hasIndex ? 'Remove index' : 'Add index'}
              className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${field.hasIndex ? 'text-brand-400' : 'text-gray-600 hover:text-gray-400'}`}
            >
              {field.hasIndex ? '⚡' : '○'}
            </button>
            {!field.isPrimaryKey && (
              <button
                onClick={() => onFieldRemove(entity.id, field.name)}
                className="text-[10px] text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >✕</button>
            )}
          </div>
        ))}

        {/* No PK warning */}
        {!hasPK && entity.fields.length > 0 && (
          <div className="text-[10px] text-yellow-500 flex items-center gap-1 px-1 pt-0.5">
            <span>⚠️</span> No primary key
          </div>
        )}

        {/* Add field */}
        <AnimatePresence>
          {showAddField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 pt-1 overflow-hidden"
            >
              <input
                autoFocus
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddField()}
                placeholder="field name"
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
              <select
                value={newFieldType}
                onChange={e => setNewFieldType(e.target.value as FieldType)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {newFieldType === 'fk' && (
                <select
                  value={newFieldRef}
                  onChange={e => setNewFieldRef(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">→ references entity</option>
                  {entities.filter(e => e.id !== entity.id).map(e => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-1">
                <button
                  onClick={handleAddField}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs py-1 rounded transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddField(false)}
                  className="px-2 text-gray-500 hover:text-gray-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showAddField && (
          <button
            onClick={() => setShowAddField(true)}
            className="w-full text-center text-xs text-gray-600 hover:text-gray-400 py-1 rounded hover:bg-gray-800/40 transition-colors"
          >
            + Add field
          </button>
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = { entityCard: EntityNode as React.ComponentType<Node> };

// ── Convert store entities to React Flow nodes ────────────────────────────────

function entitiesToNodes(
  entities: EntityCard[],
  actions: {
    onFieldAdd: (entityId: string, field: EntityField) => void;
    onFieldToggleIndex: (entityId: string, fieldName: string) => void;
    onFieldRemove: (entityId: string, fieldName: string) => void;
    onEntityRemove: (entityId: string) => void;
  },
  allEntities: EntityCard[],
  validationErrors: string[],
): Node[] {
  return entities.map(entity => ({
    id: entity.id,
    type: 'entityCard',
    position: entity.position,
    data: {
      entity,
      entities: allEntities,
      validationErrors,
      ...actions,
    },
  }));
}

function relationshipsToEdges(relationships: EntityRelationship[], entities: EntityCard[]): Edge[] {
  return relationships.map(rel => {
    const fromEntity = entities.find(e => e.name === rel.fromEntity);
    const toEntity = entities.find(e => e.name === rel.toEntity);
    if (!fromEntity || !toEntity) return null;
    return {
      id: `${rel.fromEntity}-${rel.toEntity}`,
      source: fromEntity.id,
      target: toEntity.id,
      label: rel.type,
      type: 'smoothstep',
      style: { stroke: '#6366f1', strokeWidth: 1.5 },
      labelStyle: { fill: '#9ca3af', fontSize: 10 },
      labelBgStyle: { fill: '#1f2937' },
    } as Edge;
  }).filter(Boolean) as Edge[];
}

// ── Main Component ────────────────────────────────────────────────────────────

interface EntityCardBuilderProps {
  validationErrors: string[];
}

export const EntityCardBuilder: React.FC<EntityCardBuilderProps> = ({ validationErrors }) => {
  const {
    config,
    entities,
    relationships,
    upsertEntity,
    removeEntity,
    addFieldToEntity,
    updateField,
    removeField,
    addRelationship,
    removeRelationship,
  } = useLLDBuilderStore();

  const handleFieldToggleIndex = useCallback((entityId: string, fieldName: string) => {
    const entity = entities.find(e => e.id === entityId);
    const field = entity?.fields.find(f => f.name === fieldName);
    if (!field) return;
    updateField(entityId, fieldName, { hasIndex: !field.hasIndex });
  }, [entities, updateField]);

  const actions = {
    onFieldAdd: addFieldToEntity,
    onFieldToggleIndex: handleFieldToggleIndex,
    onFieldRemove: removeField,
    onEntityRemove: removeEntity,
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(
    entitiesToNodes(entities, actions, entities, validationErrors),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    relationshipsToEdges(relationships, entities),
  );

  // Sync nodes when entities change
  React.useEffect(() => {
    setNodes(entitiesToNodes(entities, actions, entities, validationErrors));
    setEdges(relationshipsToEdges(relationships, entities));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, relationships, validationErrors]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const fromEntity = entities.find(e => e.id === connection.source);
      const toEntity = entities.find(e => e.id === connection.target);
      if (!fromEntity || !toEntity) return;

      const rel: EntityRelationship = {
        fromEntity: fromEntity.name,
        toEntity: toEntity.name,
        type: 'one-to-many',
      };
      addRelationship(rel);
      setEdges(eds => addEdge({ ...connection, type: 'smoothstep', label: 'one-to-many', style: { stroke: '#6366f1', strokeWidth: 1.5 } }, eds));
    },
    [entities, addRelationship, setEdges],
  );

  // Sync node positions back to store on drag
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = entities.find(e => e.id === node.id);
      if (entity) {
        upsertEntity({ ...entity, position: node.position });
      }
    },
    [entities, upsertEntity],
  );

  const handleAddEntity = () => {
    const name = prompt('Entity name:');
    if (!name?.trim()) return;
    const newEntity: EntityCard = {
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      fields: [{ name: 'id', type: 'uuid', isPrimaryKey: true, isRequired: true }],
      position: { x: 50 + entities.length * 260, y: 300 },
      isSeeded: false,
    };
    upsertEntity(newEntity);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🗂️</span> Entity / Class Builder
          <span className="text-gray-500 font-normal text-xs">
            ({entities.length} {entities.length === 1 ? 'entity' : 'entities'})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            {config?.scoringWeights.schema} pts
          </span>
          <button
            onClick={handleAddEntity}
            className="text-xs bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full transition-colors"
          >
            + Add Entity
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ height: 400 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-900/50"
          deleteKeyCode="Delete"
        >
          <Background color="#374151" gap={20} size={1} />
          <Controls className="!bg-gray-800 !border-gray-700" />
        </ReactFlow>
      </div>

      <p className="text-xs text-gray-600">
        💡 Drag entities to arrange • Connect handles to draw relationships • Click ⚡ to add an index
      </p>
    </div>
  );
};
