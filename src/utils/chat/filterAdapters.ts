import { BaseFilter, DEFAULT_CONVERSATION_FILTER } from '@/types/core';
import { ConversationFilter } from '@/types/chat/api';

/** Remove filtro explícito assignee_type = all (equipe inteira); lista segue outros filtros ou o padrão. */
export function stripAssigneeTypeAllFromBaseFilters(filters: BaseFilter[]): BaseFilter[] {
  return filters.filter(f => {
    if (f.attributeKey !== 'assignee_type') return true;
    const raw = Array.isArray(f.values) ? f.values.join(',') : String(f.values ?? '');
    const parts = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return true;
    return !parts.some(p => p === 'all');
  });
}

export function normalizeBaseFiltersAfterStrippingAssigneeAll(filters: BaseFilter[]): BaseFilter[] {
  const stripped = stripAssigneeTypeAllFromBaseFilters(filters);
  return stripped.length > 0 ? stripped : [{ ...DEFAULT_CONVERSATION_FILTER }];
}

/** Mesma regra para filtros já no formato da API (ex.: estado persistido no contexto). */
export function stripAssigneeTypeAllFromConversationFilters(
  filters: ConversationFilter[],
): ConversationFilter[] {
  return filters.filter(f => {
    if (f.attribute_key !== 'assignee_type') return true;
    const vals = Array.isArray(f.values) ? f.values : [f.values];
    return !vals.some(v => String(v) === 'all');
  });
}

export function normalizeConversationFiltersAfterStrippingAssigneeAll(
  filters: ConversationFilter[],
): ConversationFilter[] {
  const stripped = stripAssigneeTypeAllFromConversationFilters(filters);
  if (stripped.length > 0) return stripped;
  return [
    {
      attribute_key: 'status',
      filter_operator: 'equal_to',
      values: ['open', 'pending'],
      query_operator: 'and',
    },
  ];
}

/**
 * Converte filtros do BaseFilter (usado na UI) para ConversationFilter (usado na API)
 */
export function convertBaseFiltersToConversationFilters(
  baseFilters: BaseFilter[],
): ConversationFilter[] {
  return baseFilters.map(filter => ({
    attribute_key: filter.attributeKey,
    filter_operator: filter.filterOperator as any,
    values: Array.isArray(filter.values) ? filter.values : [filter.values],
    query_operator: filter.queryOperator,
  }));
}

/**
 * Converte filtros do ConversationFilter (usado na API) para BaseFilter (usado na UI)
 */
export function convertConversationFiltersToBaseFilters(
  conversationFilters: ConversationFilter[],
): BaseFilter[] {
  return conversationFilters.map(filter => ({
    attributeKey: filter.attribute_key,
    filterOperator: filter.filter_operator,
    values: Array.isArray(filter.values) ? filter.values.join(',') : filter.values[0] || '',
    queryOperator: filter.query_operator,
    attributeModel: 'standard' as const,
  }));
}

/**
 * Verifica se um filtro do BaseFilter é válido (tem valores quando necessário)
 */
export function isValidBaseFilter(filter: BaseFilter): boolean {
  const needsValue = !['is_present', 'is_not_present'].includes(filter.filterOperator);
  return !needsValue || (!!filter.values && filter.values.toString().trim() !== '');
}

/**
 * Remove filtros inválidos de uma lista de BaseFilter
 */
export function removeInvalidBaseFilters(filters: BaseFilter[]): BaseFilter[] {
  return filters.filter(isValidBaseFilter);
}
