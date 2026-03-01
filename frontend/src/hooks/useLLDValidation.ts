/**
 * useLLDValidation — validates all LLD sections in real-time.
 *
 * Used for inline hints and pre-submission blocking.
 * Returns structured errors per section/entity/field.
 */

import { useMemo } from 'react';
import { useLLDBuilderStore } from '../stores/lldBuilderStore';
import type { ValidationError } from '../data/lldTypes';

interface UseLLDValidationResult {
  errors: ValidationError[];
  isValid: boolean;
  hasArchErrors: boolean;
  hasSchemaErrors: boolean;
  hasApiErrors: boolean;
  validateSection: (section: 'archDecisions' | 'schema' | 'apiContracts') => ValidationError[];
}

export function useLLDValidation(): UseLLDValidationResult {
  const { config, archDecisions, entities, relationships, apiStyle, restEndpoints, graphqlOperations } =
    useLLDBuilderStore();

  const errors = useMemo((): ValidationError[] => {
    if (!config) return [];
    const errs: ValidationError[] = [];

    // ── Arch Decisions ────────────────────────────────────────────────────
    config.allowedDecisions.forEach(cat => {
      if (!archDecisions[cat.id]) {
        errs.push({
          section: 'archDecisions',
          field: cat.id,
          message: `No decision made for "${cat.label}"`,
        });
      }
    });

    // ── Schema ────────────────────────────────────────────────────────────
    if (entities.length === 0) {
      errs.push({ section: 'schema', message: 'Add at least one entity to your schema.' });
    }

    entities.forEach(entity => {
      if (!entity.fields.some(f => f.isPrimaryKey)) {
        errs.push({
          section: 'schema',
          entityOrEndpoint: entity.name,
          message: `"${entity.name}" is missing a primary key.`,
        });
      }
      if (entity.fields.length === 0) {
        errs.push({
          section: 'schema',
          entityOrEndpoint: entity.name,
          message: `"${entity.name}" has no fields defined.`,
        });
      }
    });

    // ── API Contracts ─────────────────────────────────────────────────────
    const items = apiStyle === 'graphql' ? graphqlOperations : restEndpoints;
    if (items.length === 0) {
      errs.push({ section: 'apiContracts', message: 'Add at least one API endpoint or operation.' });
    }

    if (apiStyle === 'rest') {
      restEndpoints.forEach(ep => {
        if (ep.statusCodes.length === 0) {
          errs.push({
            section: 'apiContracts',
            entityOrEndpoint: `${ep.method} ${ep.path}`,
            message: `Define at least one status code for "${ep.method} ${ep.path}".`,
          });
        }
        if (!ep.responseShape || Object.keys(ep.responseShape).length === 0) {
          errs.push({
            section: 'apiContracts',
            entityOrEndpoint: `${ep.method} ${ep.path}`,
            message: `Define a response shape for "${ep.method} ${ep.path}".`,
          });
        }
      });

      // Warn if no 4xx/5xx responses
      const hasErrorCodes = restEndpoints.some(ep => ep.statusCodes.some(c => c >= 400));
      if (restEndpoints.length > 0 && !hasErrorCodes) {
        errs.push({
          section: 'apiContracts',
          message: 'Define at least one error response (4xx/5xx) across your endpoints.',
        });
      }
    }

    return errs;
  }, [config, archDecisions, entities, relationships, apiStyle, restEndpoints, graphqlOperations]);

  const validateSection = (section: 'archDecisions' | 'schema' | 'apiContracts') =>
    errors.filter(e => e.section === section);

  return {
    errors,
    isValid: errors.length === 0,
    hasArchErrors: errors.some(e => e.section === 'archDecisions'),
    hasSchemaErrors: errors.some(e => e.section === 'schema'),
    hasApiErrors: errors.some(e => e.section === 'apiContracts'),
    validateSection,
  };
}
