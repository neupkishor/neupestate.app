export type ProfileLeadRecord = Record<string, any>;

const leadRecords = new Map<string, ProfileLeadRecord>();

function cacheKey(scope: 'shared' | 'base', id: string) {
  return `${scope}:${id}`;
}

export function rememberProfileLead(scope: 'shared' | 'base', id: string, lead: ProfileLeadRecord) {
  leadRecords.set(cacheKey(scope, id), lead);
}

export function getRememberedProfileLead(scope: 'shared' | 'base', id: string) {
  return leadRecords.get(cacheKey(scope, id));
}
