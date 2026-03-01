/**
 * ArchDecisionSelector — interactive toggle card grid for architectural decisions.
 *
 * Shows only mission-relevant decision categories (from lldConfig.allowedDecisions).
 * Selecting a decision cascades downstream to the schema and API contract sections.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';
import type { ArchDecisionCategory, ArchDecisionOption } from '../../../data/lldTypes';

// ── Icon map for known decision categories ────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  auth: '🔐',
  caching: '⚡',
  caching_strategy: '⚡',
  db_type: '🗄️',
  api_style: '📡',
  load_balancing: '⚖️',
  message_queue: '📬',
  cdn: '🌐',
  rate_limiting: '🚦',
  data_replication: '🔄',
  search_layer: '🔍',
  observability: '📊',
  deployment: '🚀',
};

const OPTION_ICONS: Record<string, string> = {
  jwt: '🎟️', oauth: '🔑', session: '🍪',
  cache_aside: '↩️', write_through: '✏️', write_behind: '🔮',
  sql: '📊', nosql: '📄',
  rest: '🌐', graphql: '⬡', grpc: '⚡',
  round_robin: '🔁', least_conn: '📉', ip_hash: '#️⃣',
  kafka: '🌊', rabbitmq: '🐰', none: '⭕',
  cloudflare: '☁️', cloudfront: '🌩️',
  token_bucket: '🪣', leaky_bucket: '💧', fixed_window: '🪟',
  elasticsearch: '🔍', algolia: '🔎', db_native: '🗄️',
  kubernetes: '☸️', serverless: '⚡', vm: '🖥️',
};

interface OptionCardProps {
  option: ArchDecisionOption;
  isSelected: boolean;
  isCorrect?: boolean;
  onSelect: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ option, isSelected, isCorrect, onSelect }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onSelect}
    className={`
      relative w-full text-left rounded-xl border p-3 transition-all duration-150
      ${isSelected
        ? isCorrect === false
          ? 'border-yellow-500/60 bg-yellow-900/20 ring-1 ring-yellow-500/40'
          : 'border-brand-500/60 bg-brand-900/20 ring-1 ring-brand-500/40'
        : 'border-gray-700/60 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/70'
      }
    `}
  >
    <div className="flex items-start gap-2">
      <span className="text-lg shrink-0 mt-0.5">
        {OPTION_ICONS[option.id] ?? option.icon ?? '🔧'}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
          {option.label}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 leading-snug">{option.description}</div>
      </div>
      {isSelected && (
        <span className="shrink-0 text-brand-400 text-sm mt-0.5">✓</span>
      )}
    </div>
  </motion.button>
);

interface DecisionCategoryProps {
  category: ArchDecisionCategory;
  selectedOptionId: string | undefined;
  onSelect: (categoryId: string, optionId: string) => void;
  hasError: boolean;
}

const DecisionCategoryCard: React.FC<DecisionCategoryProps> = ({
  category, selectedOptionId, onSelect, hasError,
}) => {
  const selectedOption = category.options.find(o => o.id === selectedOptionId);

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${hasError && !selectedOptionId ? 'border-red-500/40 bg-red-900/10' : 'border-gray-700/60 bg-gray-800/30'}`}>
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[category.id] ?? '⚙️'}</span>
          <span className="text-sm font-semibold text-white">{category.label}</span>
          {hasError && !selectedOptionId && (
            <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">Required</span>
          )}
        </div>
        {selectedOption && (
          <span className="text-xs text-brand-400 bg-brand-900/30 px-2 py-0.5 rounded-full">
            {selectedOption.label}
          </span>
        )}
      </div>

      {/* Options grid */}
      <div className={`grid gap-2 ${category.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {category.options.map(option => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selectedOptionId === option.id}
            isCorrect={
              category.correctOption ? option.id === category.correctOption : undefined
            }
            onSelect={() => onSelect(category.id, option.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ArchDecisionSelectorProps {
  validationErrors: string[];
}

export const ArchDecisionSelector: React.FC<ArchDecisionSelectorProps> = ({ validationErrors }) => {
  const { config, archDecisions, setArchDecision } = useLLDBuilderStore();

  if (!config || config.allowedDecisions.length === 0) return null;

  const errorCategories = new Set(validationErrors);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>⚙️</span> Architectural Decisions
          <span className="text-gray-500 font-normal text-xs">
            ({Object.keys(archDecisions).length}/{config.allowedDecisions.length} decided)
          </span>
        </h3>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
          {config.scoringWeights.archDecisions} pts
        </span>
      </div>

      <div className="space-y-3">
        {config.allowedDecisions.map(category => (
          <DecisionCategoryCard
            key={category.id}
            category={category}
            selectedOptionId={archDecisions[category.id]}
            onSelect={setArchDecision}
            hasError={errorCategories.has(category.id)}
          />
        ))}
      </div>
    </div>
  );
};
