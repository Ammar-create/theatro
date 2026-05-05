// Add to existing types/index.ts

export interface ExportData {
  version: string;
  exportedAt: number;
  characters: Character[];
  scenarios: Scenario[];
  messages: Message[];
  memories: Memory[];
  relationships: RelationshipMatrix[];
  providers: Provider[];
  settings: Record<string, any>;
}
