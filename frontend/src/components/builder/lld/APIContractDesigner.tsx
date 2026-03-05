/**
 * APIContractDesigner — REST/GraphQL API contract form builder.
 *
 * API style is pre-set from the arch decision (or defaults to REST).
 * REST mode: method + path + request/response schema + status codes + pagination.
 * GraphQL mode: query/mutation/subscription + args + return type.
 * Auth headers auto-injected from arch decision.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';
import type { RestEndpoint, GraphQLOperation, ApiStyle, SchemaShape } from '../../../data/lldTypes';

// ── REST endpoint form ─────────────────────────────────────────────────────────

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const COMMON_STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 409, 500];
const PAGINATION_OPTIONS: Array<{ value: RestEndpoint['paginationType']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'cursor', label: 'Cursor-based ⭐' },
  { value: 'offset', label: 'Offset-based' },
];

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

interface RestEndpointFormProps {
  initial?: Partial<RestEndpoint>;
  authDecision: string | undefined;
  onSave: (ep: RestEndpoint) => void;
  onCancel: () => void;
}

const RestEndpointForm: React.FC<RestEndpointFormProps> = ({ initial, authDecision, onSave, onCancel }) => {
  const [method, setMethod] = useState<RestEndpoint['method']>(initial?.method ?? 'GET');
  const [path, setPath] = useState(initial?.path ?? '/api/');
  const [statusCodes, setStatusCodes] = useState<number[]>(initial?.statusCodes ?? [200]);
  const [pagination, setPagination] = useState<RestEndpoint['paginationType']>(initial?.paginationType ?? 'none');
  const [responseText, setResponseText] = useState(
    initial?.responseShape ? JSON.stringify(initial.responseShape, null, 2) : '{\n  "id": "string"\n}',
  );
  const [requestText, setRequestText] = useState(
    initial?.requestBody ? JSON.stringify(initial.requestBody, null, 2) : '',
  );

  // Auto-inject auth header if JWT/OAuth selected
  const authHeader = authDecision && authDecision !== 'none' && authDecision !== 'session'
    ? { Authorization: `Bearer <${authDecision}_token>` }
    : undefined;

  const toggleStatusCode = (code: number) => {
    setStatusCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  };

  const handleSave = () => {
    if (!path.trim()) return;
    let responseShape: Record<string, unknown> = {};
    let requestBody: Record<string, unknown> | undefined;
    try { responseShape = JSON.parse(responseText); } catch { /* keep empty */ }
    try { if (requestText.trim()) requestBody = JSON.parse(requestText); } catch { /* keep empty */ }

    onSave({
      id: initial?.id ?? uid(),
      method,
      path: path.trim(),
      responseShape: responseShape as SchemaShape,
      requestBody: requestBody as SchemaShape | undefined,
      statusCodes,
      paginationType: pagination,
      headers: authHeader,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-gray-600 bg-gray-800/60 p-4 space-y-3"
    >
      {/* Method + Path */}
      <div className="flex gap-2">
        <select
          value={method}
          onChange={e => setMethod(e.target.value as RestEndpoint['method'])}
          className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
        >
          {HTTP_METHODS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          value={path}
          onChange={e => setPath(e.target.value)}
          placeholder="/api/resource/:id"
          className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Status codes */}
      <div>
        <div className="text-xs text-gray-400 mb-1.5">Status codes</div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_STATUS_CODES.map(code => (
            <button
              key={code}
              onClick={() => toggleStatusCode(code)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                statusCodes.includes(code)
                  ? code >= 400
                    ? 'border-red-500/60 bg-red-900/30 text-red-300'
                    : 'border-green-500/60 bg-green-900/30 text-green-300'
                  : 'border-gray-600 text-gray-500 hover:border-gray-500'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Pagination (GET only) */}
      {method === 'GET' && (
        <div>
          <div className="text-xs text-gray-400 mb-1.5">Pagination</div>
          <div className="flex gap-2">
            {PAGINATION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPagination(opt.value)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  pagination === opt.value
                    ? 'border-brand-500/60 bg-brand-900/30 text-brand-300'
                    : 'border-gray-600 text-gray-500 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request body (POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div>
          <div className="text-xs text-gray-400 mb-1">Request body (JSON)</div>
          <textarea
            value={requestText}
            onChange={e => setRequestText(e.target.value)}
            rows={3}
            placeholder='{ "field": "string" }'
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>
      )}

      {/* Response shape */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Response shape (JSON)</div>
        <textarea
          value={responseText}
          onChange={e => setResponseText(e.target.value)}
          rows={3}
          placeholder='{ "id": "string" }'
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
        />
      </div>

      {/* Auth header info */}
      {authHeader && (
        <div className="text-xs text-brand-400 bg-brand-900/20 border border-brand-500/20 rounded-lg px-3 py-2">
          🔐 Auto-added: <code className="font-mono">Authorization: {authHeader.Authorization}</code>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-sm py-1.5 rounded-lg transition-colors"
        >
          Save endpoint
        </button>
        <button
          onClick={onCancel}
          className="px-4 text-gray-400 hover:text-gray-200 text-sm"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

// ── REST Endpoint Card ─────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-900/40 text-green-300 border-green-700/40',
  POST: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  PUT: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  PATCH: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  DELETE: 'bg-red-900/40 text-red-300 border-red-700/40',
};

const RestEndpointCard: React.FC<{
  endpoint: RestEndpoint;
  onEdit: () => void;
  onRemove: () => void;
}> = ({ endpoint, onEdit, onRemove }) => {
  const successCodes = endpoint.statusCodes.filter(c => c < 400);
  const errorCodes = endpoint.statusCodes.filter(c => c >= 400);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-700/60 bg-gray-800/40 p-3 group">
      <span className={`text-xs font-bold px-2 py-1 rounded border font-mono shrink-0 ${METHOD_COLORS[endpoint.method]}`}>
        {endpoint.method}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-200 font-mono truncate">{endpoint.path}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {successCodes.map(c => (
            <span key={c} className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">{c}</span>
          ))}
          {errorCodes.map(c => (
            <span key={c} className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">{c}</span>
          ))}
          {endpoint.paginationType && endpoint.paginationType !== 'none' && (
            <span className="text-[10px] bg-brand-900/30 text-brand-300 px-1.5 py-0.5 rounded">
              {endpoint.paginationType} pagination
            </span>
          )}
          {endpoint.headers?.Authorization && (
            <span className="text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">🔐 auth</span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit} className="text-xs text-gray-500 hover:text-white px-1.5 py-1 rounded hover:bg-gray-700">Edit</button>
        <button onClick={onRemove} className="text-xs text-gray-500 hover:text-red-400 px-1.5 py-1 rounded hover:bg-gray-700">✕</button>
      </div>
    </div>
  );
};

// ── GraphQL Operation Card ────────────────────────────────────────────────────

const GQL_TYPE_COLORS: Record<string, string> = {
  query: 'bg-blue-900/40 text-blue-300',
  mutation: 'bg-orange-900/40 text-orange-300',
  subscription: 'bg-purple-900/40 text-purple-300',
};

const GraphQLOpCard: React.FC<{
  op: GraphQLOperation;
  onRemove: () => void;
}> = ({ op, onRemove }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-700/60 bg-gray-800/40 p-3 group">
    <span className={`text-xs font-bold px-2 py-1 rounded font-mono shrink-0 ${GQL_TYPE_COLORS[op.type]}`}>
      {op.type}
    </span>
    <div className="flex-1 text-sm text-gray-200 font-mono">{op.name}</div>
    <button
      onClick={onRemove}
      className="text-xs text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
    >✕</button>
  </div>
);

// ── API Style Toggle ──────────────────────────────────────────────────────────

const API_STYLES: Array<{ value: ApiStyle; label: string; icon: string }> = [
  { value: 'rest', label: 'REST', icon: '🌐' },
  { value: 'graphql', label: 'GraphQL', icon: '⬡' },
  { value: 'grpc', label: 'gRPC', icon: '⚡' },
];

// ── Main Component ────────────────────────────────────────────────────────────

interface APIContractDesignerProps {
  validationErrors: string[];
}

export const APIContractDesigner: React.FC<APIContractDesignerProps> = ({ validationErrors }) => {
  const {
    config,
    apiStyle,
    setApiStyle,
    restEndpoints,
    graphqlOperations,
    upsertRestEndpoint,
    removeRestEndpoint,
    upsertGraphQLOperation,
    removeGraphQLOperation,
    archDecisions,
  } = useLLDBuilderStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gqlForm, setGqlForm] = useState({ type: 'query' as GraphQLOperation['type'], name: '' });

  const authDecision = archDecisions['auth'];
  const hasErrors = validationErrors.length > 0;

  const handleSaveRestEndpoint = (ep: RestEndpoint) => {
    upsertRestEndpoint(ep);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddGraphQL = () => {
    if (!gqlForm.name.trim()) return;
    upsertGraphQLOperation({
      id: Math.random().toString(36).slice(2),
      type: gqlForm.type,
      name: gqlForm.name.trim(),
      returnType: { id: 'string' },
    });
    setGqlForm({ type: 'query', name: '' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold text-white flex items-center gap-2 ${hasErrors ? 'text-red-400' : ''}`}>
          <span>📡</span> API Contracts
          <span className="text-gray-500 font-normal text-xs">
            ({apiStyle === 'graphql' ? graphqlOperations.length : restEndpoints.length} defined)
          </span>
        </h3>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
          {config?.scoringWeights.apiContracts} pts
        </span>
      </div>

      {/* API Style selector */}
      <div className="flex gap-2">
        {API_STYLES.map(style => (
          <button
            key={style.value}
            onClick={() => setApiStyle(style.value)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              apiStyle === style.value
                ? 'border-brand-500/60 bg-brand-900/20 text-brand-300'
                : 'border-gray-700 text-gray-500 hover:border-gray-600'
            }`}
          >
            <span>{style.icon}</span>
            <span>{style.label}</span>
          </button>
        ))}
      </div>

      {/* Validation errors */}
      {hasErrors && (
        <div className="space-y-1">
          {validationErrors.map((err, i) => (
            <div key={i} className="text-xs text-red-400 flex items-center gap-1.5">
              <span>⚠️</span> {err}
            </div>
          ))}
        </div>
      )}

      {/* REST endpoints */}
      {(apiStyle === 'rest' || apiStyle === 'grpc' || !apiStyle) && (
        <div className="space-y-2">
          {restEndpoints.map(ep =>
            editingId === ep.id ? (
              <RestEndpointForm
                key={ep.id}
                initial={ep}
                authDecision={authDecision}
                onSave={handleSaveRestEndpoint}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RestEndpointCard
                key={ep.id}
                endpoint={ep}
                onEdit={() => setEditingId(ep.id)}
                onRemove={() => removeRestEndpoint(ep.id)}
              />
            ),
          )}

          <AnimatePresence>
            {showAddForm && !editingId && (
              <RestEndpointForm
                authDecision={authDecision}
                onSave={handleSaveRestEndpoint}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </AnimatePresence>

          {!showAddForm && !editingId && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-400 border border-dashed border-gray-700 hover:border-gray-600 rounded-xl transition-colors"
            >
              + Add endpoint
            </button>
          )}
        </div>
      )}

      {/* GraphQL operations */}
      {apiStyle === 'graphql' && (
        <div className="space-y-2">
          {graphqlOperations.map(op => (
            <GraphQLOpCard key={op.id} op={op} onRemove={() => removeGraphQLOperation(op.id)} />
          ))}

          <div className="flex gap-2">
            <select
              value={gqlForm.type}
              onChange={e => setGqlForm(p => ({ ...p, type: e.target.value as GraphQLOperation['type'] }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="query">query</option>
              <option value="mutation">mutation</option>
              <option value="subscription">subscription</option>
            </select>
            <input
              value={gqlForm.name}
              onChange={e => setGqlForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddGraphQL()}
              placeholder="operationName"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleAddGraphQL}
              className="bg-brand-600 hover:bg-brand-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* gRPC note */}
      {apiStyle === 'grpc' && restEndpoints.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-2">
          💡 For gRPC, define your service methods above as endpoint paths (e.g. /UserService/GetUser)
        </p>
      )}
    </div>
  );
};
