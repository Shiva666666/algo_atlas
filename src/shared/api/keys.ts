/** Cache identities are part of the application contract. Preserve existing values. */
export const queryKeys = {
  analytics: () => ['analytics'],
  atlas: () => ['atlas'],
  taxonomy: () => ['taxonomy'],
  git: () => ['git'],
  sync: () => ['sync-status'],
  problems: (filter?: string) => (filter === undefined ? ['problems'] : ['problems', filter]),
  problem: (id: string | undefined) => ['problem', id],
  commandSearch: (query: string) => ['command-search', query],
};
