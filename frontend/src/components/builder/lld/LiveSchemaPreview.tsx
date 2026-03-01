/**
 * LiveSchemaPreview — real-time schema preview panel.
 *
 * SQL mode: renders CREATE TABLE DDL with indexes, formatted using sql-formatter.
 * NoSQL mode: renders JSON document structure per entity.
 * Updates within 300ms of entity changes (debounced internally).
 * Hover tooltips explain schema decisions.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format } from 'sql-formatter';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';
import type { EntityCard } from '../../../data/lldTypes';

// ── SQL DDL Generator ─────────────────────────────────────────────────────────

const SQL_TYPE_MAP: Record<string, string> = {
  uuid: 'UUID',
  string: 'VARCHAR(255)',
  integer: 'INTEGER',
  bigint: 'BIGINT',
  float: 'FLOAT',
  boolean: 'BOOLEAN',
  timestamp: 'TIMESTAMP',
  text: 'TEXT',
  jsonb: 'JSONB',
  enum: 'VARCHAR(50)',
  fk: 'UUID',
};

function generateSQLDDL(entities: EntityCard[]): string {
  if (entities.length === 0) return '-- Add entities to see your schema';

  const statements: string[] = [];

  for (const entity of entities) {
    const tableName = entity.name.toLowerCase().replace(/\s+/g, '_') + 's';
    const columns: string[] = [];
    const constraints: string[] = [];
    const indexes: string[] = [];

    for (const field of entity.fields) {
      const colType = SQL_TYPE_MAP[field.type] ?? 'TEXT';
      let colDef = `  ${field.name} ${colType}`;

      if (field.isPrimaryKey) {
        colDef += ' PRIMARY KEY';
      } else if (field.isRequired) {
        colDef += ' NOT NULL';
      }

      if (field.type === 'fk' && field.references) {
        const refTable = field.references.toLowerCase().replace(/\s+/g, '_') + 's';
        constraints.push(`  CONSTRAINT fk_${field.name} FOREIGN KEY (${field.name}) REFERENCES ${refTable}(id) ON DELETE CASCADE`);
      }

      if (field.hasIndex && !field.isPrimaryKey) {
        indexes.push(`CREATE INDEX idx_${tableName}_${field.name} ON ${tableName}(${field.name});`);
      }

      columns.push(colDef);
    }

    const allDefs = [...columns, ...constraints];
    const createTable = `CREATE TABLE ${tableName} (\n${allDefs.join(',\n')}\n);`;
    statements.push(createTable);
    if (indexes.length > 0) statements.push(indexes.join('\n'));
  }

  const rawSQL = statements.join('\n\n');
  try {
    return format(rawSQL, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
  } catch {
    return rawSQL;
  }
}

// ── NoSQL Document Generator ──────────────────────────────────────────────────

function generateNoSQLDocs(entities: EntityCard[]): string {
  if (entities.length === 0) return '// Add entities to see your schema';

  const collections = entities.map(entity => {
    const sample: Record<string, unknown> = {};
    for (const field of entity.fields) {
      if (field.type === 'uuid') sample[field.name] = '<uuid>';
      else if (field.type === 'string') sample[field.name] = '<string>';
      else if (field.type === 'integer' || field.type === 'bigint') sample[field.name] = 0;
      else if (field.type === 'float') sample[field.name] = 0.0;
      else if (field.type === 'boolean') sample[field.name] = false;
      else if (field.type === 'timestamp') sample[field.name] = '<ISO-8601>';
      else if (field.type === 'text') sample[field.name] = '<text>';
      else if (field.type === 'jsonb') sample[field.name] = {};
      else if (field.type === 'enum') sample[field.name] = field.enumValues?.[0] ?? '<enum>';
      else if (field.type === 'fk') sample[field.name] = `<${field.references ?? 'ref'}_id>`;
    }

    const pkField = entity.fields.find(f => f.isPrimaryKey);
    const indexedFields = entity.fields.filter(f => f.hasIndex).map(f => f.name);

    return [
      `// Collection: ${entity.name.toLowerCase()}s`,
      `// Partition key: ${pkField?.name ?? '_id'}`,
      indexedFields.length > 0 ? `// Indexes: ${indexedFields.join(', ')}` : '',
      JSON.stringify(sample, null, 2),
    ]
      .filter(Boolean)
      .join('\n');
  });

  return collections.join('\n\n');
}

// ── Simple debounce hook ──────────────────────────────────────────────────────

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// ── Tooltip definitions ───────────────────────────────────────────────────────

const TOOLTIPS: Record<string, string> = {
  'PRIMARY KEY': 'Uniquely identifies each row — critical for joins and lookups.',
  'FOREIGN KEY': 'Enforces referential integrity — no orphan records.',
  'INDEX': 'Reduces query time from O(n) to O(log n) on this column.',
  'NOT NULL': 'Guarantees data presence — prevents null pointer bugs at DB level.',
  'CASCADE': 'Automatically removes related records when parent is deleted.',
};

// ── Main Component ────────────────────────────────────────────────────────────

export const LiveSchemaPreview: React.FC = () => {
  const { entities, dbType } = useLLDBuilderStore();
  const [copiedTooltip, setCopiedTooltip] = useState(false);

  // Debounce entity changes at 300ms (ADR-003 SLA)
  const debouncedEntities = useDebounced(entities, 300);

  const schema = useMemo(() => {
    if (dbType === 'nosql') return generateNoSQLDocs(debouncedEntities);
    return generateSQLDDL(debouncedEntities);
  }, [debouncedEntities, dbType]);

  const handleCopy = () => {
    navigator.clipboard.writeText(schema).catch(() => {});
    setCopiedTooltip(true);
    setTimeout(() => setCopiedTooltip(false), 2000);
  };

  const highlightedLines = useMemo(
    () =>
      schema.split('\n').map((line, i) => {
        // Find matching tooltip keywords
        const matchedKey = Object.keys(TOOLTIPS).find(key => line.includes(key));
        return { line, key: matchedKey, lineNum: i + 1 };
      }),
    [schema],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>👁️</span> Live Schema Preview
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            dbType === 'sql'
              ? 'border-blue-500/40 text-blue-300 bg-blue-900/20'
              : dbType === 'nosql'
              ? 'border-green-500/40 text-green-300 bg-green-900/20'
              : 'border-gray-600 text-gray-500'
          }`}>
            {dbType === 'sql' ? 'SQL DDL' : dbType === 'nosql' ? 'NoSQL Docs' : 'Select DB type'}
          </span>
        </h3>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copiedTooltip ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-950 overflow-auto max-h-64 relative">
        <pre className="p-4 text-xs font-mono leading-relaxed">
          {highlightedLines.map(({ line, key, lineNum }) => (
            <TooltipLine key={lineNum} line={line} tooltipKey={key} />
          ))}
        </pre>
      </div>
    </div>
  );
};

// ── Tooltip line wrapper ──────────────────────────────────────────────────────

const TooltipLine: React.FC<{ line: string; tooltipKey: string | undefined }> = ({ line, tooltipKey }) => {
  const [showTip, setShowTip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Color SQL keywords
  const coloredLine = line
    .replace(/(CREATE|TABLE|INDEX|ON|PRIMARY KEY|FOREIGN KEY|REFERENCES|NOT NULL|CASCADE|CONSTRAINT)/g,
      m => `\x00KEYWORD\x00${m}\x00END\x00`)
    .replace(/(UUID|VARCHAR|INTEGER|BIGINT|FLOAT|BOOLEAN|TIMESTAMP|TEXT|JSONB)/g,
      m => `\x00TYPE\x00${m}\x00END\x00`);

  const parts = coloredLine.split(/\x00/);

  return (
    <span
      ref={ref}
      className="block hover:bg-gray-800/50 cursor-default relative"
      onMouseEnter={() => tooltipKey && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {parts.map((part, i) => {
        if (part === 'KEYWORD') return null;
        if (part === 'TYPE') return null;
        if (part === 'END') return null;
        const prevPart = parts[i - 2];
        if (prevPart === 'KEYWORD') {
          return <span key={i} className="text-purple-300">{part}</span>;
        }
        if (prevPart === 'TYPE') {
          return <span key={i} className="text-blue-300">{part}</span>;
        }
        return <span key={i} className="text-gray-300">{part}</span>;
      })}
      {'\n'}
      {showTip && tooltipKey && TOOLTIPS[tooltipKey] && (
        <span className="absolute left-0 bottom-full z-10 bg-gray-800 border border-gray-600 text-gray-300 text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-xl pointer-events-none">
          💡 {TOOLTIPS[tooltipKey]}
        </span>
      )}
    </span>
  );
};
