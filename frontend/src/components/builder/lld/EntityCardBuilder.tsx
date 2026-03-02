/**
 * EntityCardBuilder — visual entity card builder using @xyflow/react.
 *
 * Fixes:
 * - Canvas 580px tall + fullscreen expand toggle
 * - Inline entity-name form (no browser prompt)
 * - IDX badge always visible — click to toggle index
 * - Index checkbox in "Add field" form
 */

import React, { useCallback, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  type Node, type Edge, type Connection,
  Handle, Position, type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';
import type { EntityCard, EntityField, EntityRelationship, FieldType } from '../../../data/lldTypes';

const FIELD_TYPES: FieldType[] = [
  'uuid','string','integer','bigint','float','boolean','timestamp','text','jsonb','enum','fk',
];

const TYPE_COLORS: Record<string, string> = {
  uuid:'bg-purple-900/40 text-purple-300', string:'bg-blue-900/40 text-blue-300',
  integer:'bg-green-900/40 text-green-300', bigint:'bg-green-900/40 text-green-300',
  float:'bg-green-900/40 text-green-300', boolean:'bg-yellow-900/40 text-yellow-300',
  timestamp:'bg-orange-900/40 text-orange-300', text:'bg-blue-900/40 text-blue-300',
  jsonb:'bg-pink-900/40 text-pink-300', enum:'bg-indigo-900/40 text-indigo-300',
  fk:'bg-red-900/40 text-red-300',
};

interface EntityNodeData {
  entity: EntityCard;
  onFieldAdd: (id: string, f: EntityField) => void;
  onFieldToggleIndex: (id: string, name: string) => void;
  onFieldRemove: (id: string, name: string) => void;
  onEntityRemove: (id: string) => void;
  entities: EntityCard[];
  validationErrors: string[];
}

const EntityNode: React.FC<{ data: EntityNodeData }> = ({ data }) => {
  const { entity, onFieldAdd, onFieldToggleIndex, onFieldRemove, onEntityRemove, entities, validationErrors } = data;
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('string');
  const [fieldRef,  setFieldRef]  = useState('');
  const [fieldIdx,  setFieldIdx]  = useState(false);
  const [showForm,  setShowForm]  = useState(false);

  const hasPK = entity.fields.some(f => f.isPrimaryKey);
  const hasErr = validationErrors.some(e => e.includes(entity.name));

  const submitField = () => {
    if (!fieldName.trim()) return;
    onFieldAdd(entity.id, {
      name: fieldName.trim(), type: fieldType,
      references: fieldType === 'fk' ? fieldRef : undefined,
      isPrimaryKey: false, isRequired: false, hasIndex: fieldIdx,
    });
    setFieldName(''); setFieldType('string'); setFieldRef(''); setFieldIdx(false); setShowForm(false);
  };

  return (
    <div className={`bg-gray-900 border rounded-xl shadow-xl min-w-[240px] max-w-[300px] select-none
      ${hasErr ? 'border-red-500/60' : hasPK ? 'border-gray-600' : 'border-yellow-500/50'}`}>
      <Handle type="target" position={Position.Left}  className="!bg-indigo-500 !w-3 !h-3 !-left-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !-right-1.5" />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 rounded-t-xl bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wide">{entity.name}</span>
          {entity.isSeeded && <span className="text-[10px] text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">seed</span>}
        </div>
        {!entity.isSeeded && (
          <button onClick={() => onEntityRemove(entity.id)} className="text-gray-600 hover:text-red-400 text-xs" title="Remove entity">✕</button>
        )}
      </div>

      {/* Fields */}
      <div className="p-2 space-y-1">
        {entity.fields.length === 0 && <div className="text-xs text-gray-600 text-center py-1.5">No fields — add one below</div>}

        {entity.fields.map(f => (
          <div key={f.name} className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-gray-800/60 group">
            {f.isPrimaryKey
              ? <span className="text-[11px] text-yellow-400 shrink-0" title="Primary Key">🔑</span>
              : f.type === 'fk'
                ? <span className="text-[11px] text-red-400 shrink-0" title="Foreign Key">🔗</span>
                : <span className="text-[11px] text-gray-700 shrink-0">·</span>
            }
            <span className="text-xs text-gray-200 flex-1 min-w-0 truncate">{f.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${TYPE_COLORS[f.type] ?? 'bg-gray-800 text-gray-400'}`}>
              {f.type === 'fk' && f.references ? `→${f.references}` : f.type}
            </span>
            {/* IDX toggle — always visible */}
            {!f.isPrimaryKey && (
              <button
                onClick={() => onFieldToggleIndex(entity.id, f.name)}
                title={f.hasIndex ? 'Remove index' : 'Add index (speeds up queries on this field)'}
                className={`text-[9px] px-1 py-0.5 rounded font-bold border shrink-0 transition-all
                  ${f.hasIndex
                    ? 'bg-indigo-900/60 border-indigo-500/60 text-indigo-300'
                    : 'bg-gray-800 border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400'
                  }`}
              >IDX</button>
            )}
            {!f.isPrimaryKey && (
              <button onClick={() => onFieldRemove(entity.id, f.name)}
                className="text-[10px] text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" title="Remove">✕</button>
            )}
          </div>
        ))}

        {!hasPK && entity.fields.length > 0 && (
          <div className="text-[10px] text-yellow-500 flex items-center gap-1 px-1 pt-0.5"><span>⚠️</span> Missing primary key</div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }}
              className="space-y-1.5 pt-2 border-t border-gray-700/60 overflow-hidden">
              <input autoFocus value={fieldName} onChange={e => setFieldName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitField()}
                placeholder="field name"
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              <select value={fieldType} onChange={e => setFieldType(e.target.value as FieldType)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500">
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {fieldType === 'fk' && (
                <select value={fieldRef} onChange={e => setFieldRef(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500">
                  <option value="">→ references entity…</option>
                  {entities.filter(e => e.id !== entity.id).map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              )}
              {/* Index checkbox — clearly labelled */}
              <label className="flex items-center gap-2 cursor-pointer select-none px-0.5">
                <input type="checkbox" checked={fieldIdx} onChange={e => setFieldIdx(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-indigo-500" />
                <span className="text-xs text-gray-400">Index this field</span>
                <span className="text-[9px] text-indigo-400 bg-indigo-900/30 border border-indigo-500/40 px-1 py-0.5 rounded font-bold">IDX ⚡</span>
              </label>
              <div className="flex gap-1">
                <button onClick={submitField}
                  className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs py-1 rounded transition-colors">Add field</button>
                <button onClick={() => { setShowForm(false); setFieldIdx(false); }}
                  className="px-2 text-gray-500 hover:text-gray-300 text-xs">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full text-center text-xs text-gray-600 hover:text-gray-400 py-1 rounded hover:bg-gray-800/40 transition-colors mt-0.5">
            + Add field
          </button>
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = { entityCard: EntityNode as React.ComponentType<Node> };

function toNodes(entities: EntityCard[], actions: EntityNodeData extends { entity: EntityCard } ? object : never, all: EntityCard[], errs: string[]): Node[] {
  return entities.map(e => ({ id: e.id, type: 'entityCard', position: e.position, data: { entity: e, entities: all, validationErrors: errs, ...(actions as object) } }));
}

function toEdges(rels: EntityRelationship[], entities: EntityCard[]): Edge[] {
  return rels.map(r => {
    const f = entities.find(e => e.name === r.fromEntity);
    const t = entities.find(e => e.name === r.toEntity);
    if (!f || !t) return null;
    return { id:`${r.fromEntity}-${r.toEntity}`, source:f.id, target:t.id, label:r.type, type:'smoothstep',
      style:{stroke:'#6366f1',strokeWidth:1.5}, labelStyle:{fill:'#9ca3af',fontSize:10}, labelBgStyle:{fill:'#1f2937'} } as Edge;
  }).filter(Boolean) as Edge[];
}

export const EntityCardBuilder: React.FC<{ validationErrors: string[] }> = ({ validationErrors }) => {
  const { config, entities, relationships, upsertEntity, removeEntity, addFieldToEntity, updateField, removeField, addRelationship } = useLLDBuilderStore();
  const [addingEntity, setAddingEntity] = useState(false);
  const [newName,      setNewName]      = useState('');
  const [fullscreen,   setFullscreen]   = useState(false);

  const toggleIdx = useCallback((eid: string, fname: string) => {
    const f = entities.find(e => e.id === eid)?.fields.find(f => f.name === fname);
    if (f) updateField(eid, fname, { hasIndex: !f.hasIndex });
  }, [entities, updateField]);

  const actions = { onFieldAdd:addFieldToEntity, onFieldToggleIndex:toggleIdx, onFieldRemove:removeField, onEntityRemove:removeEntity };

  const [nodes, setNodes, onNodesChange] = useNodesState(toNodes(entities, actions as never, entities, validationErrors));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toEdges(relationships, entities));

  React.useEffect(() => {
    setNodes(toNodes(entities, actions as never, entities, validationErrors));
    setEdges(toEdges(relationships, entities));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, relationships, validationErrors]);

  const onConnect = useCallback((c: Connection) => {
    const f = entities.find(e => e.id === c.source);
    const t = entities.find(e => e.id === c.target);
    if (!f || !t) return;
    addRelationship({ fromEntity:f.name, toEntity:t.name, type:'one-to-many' });
    setEdges(eds => addEdge({ ...c, type:'smoothstep', label:'one-to-many',
      style:{stroke:'#6366f1',strokeWidth:1.5}, labelStyle:{fill:'#9ca3af',fontSize:10}, labelBgStyle:{fill:'#1f2937'} }, eds));
  }, [entities, addRelationship, setEdges]);

  const onDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const e = entities.find(e => e.id === node.id);
    if (e) upsertEntity({ ...e, position: node.position });
  }, [entities, upsertEntity]);

  const confirmAdd = () => {
    const n = newName.trim();
    if (!n) return;
    upsertEntity({ id:Math.random().toString(36).slice(2), name:n, fields:[{name:'id',type:'uuid',isPrimaryKey:true,isRequired:true}], position:{x:60+entities.length*280,y:80}, isSeeded:false });
    setNewName(''); setAddingEntity(false);
  };

  return (
    <div className={`space-y-2 ${fullscreen ? 'fixed inset-0 z-50 bg-gray-950 p-4 flex flex-col' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🗂️</span> Entity Canvas
          <span className="text-gray-500 font-normal text-xs">({entities.length} {entities.length===1?'entity':'entities'}{relationships.length>0?`, ${relationships.length} relations`:''})</span>
        </h3>
        <div className="flex items-center gap-2">
          {config && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{config.scoringWeights.schema} pts</span>}
          {!addingEntity
            ? <button onClick={() => setAddingEntity(true)}
                className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full transition-colors">+ Add Entity</button>
            : <div className="flex items-center gap-1">
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter') confirmAdd(); if(e.key==='Escape'){setAddingEntity(false);setNewName('');} }}
                  placeholder="EntityName"
                  className="bg-gray-800 border border-indigo-500/60 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none w-28" />
                <button onClick={confirmAdd} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded">✓</button>
                <button onClick={() => {setAddingEntity(false);setNewName('');}} className="text-xs text-gray-500 hover:text-gray-300 px-1">✕</button>
              </div>
          }
          <button onClick={() => setFullscreen(f => !f)} title={fullscreen?'Exit fullscreen':'Expand canvas'}
            className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors">
            {fullscreen ? '⊡ Exit' : '⛶ Expand'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="bg-indigo-900/40 border border-indigo-500/50 text-indigo-300 px-1 py-0.5 rounded font-bold text-[9px]">IDX</span>
          click to toggle index
        </span>
        <span>🔑 PK · 🔗 FK</span>
        <span>Drag <strong>◉</strong> right handle → to connect</span>
      </div>

      {/* Canvas */}
      <div className={`rounded-xl border border-gray-700 overflow-hidden ${fullscreen ? 'flex-1' : ''}`}
        style={fullscreen ? undefined : { height:'580px' }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeDragStop={onDragStop} nodeTypes={nodeTypes}
          fitView fitViewOptions={{padding:0.3,maxZoom:1.0}} minZoom={0.25} maxZoom={2}
          className="bg-gray-900/60" deleteKeyCode={['Delete','Backspace']} proOptions={{hideAttribution:true}}>
          <Background color="#374151" gap={24} size={1} />
          <Controls showInteractive={false} className="!bg-gray-800 !border-gray-700 !rounded-lg" />
          <MiniMap nodeColor="#4f46e5" maskColor="rgba(17,24,39,0.75)" className="!bg-gray-800 !border-gray-700 !rounded-lg" />
        </ReactFlow>
      </div>
      <p className="text-[11px] text-gray-600">Press <kbd className="bg-gray-800 px-1 rounded text-gray-400">Delete</kbd> to remove a selected edge</p>
    </div>
  );
};
