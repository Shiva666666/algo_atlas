export type TaxonomyKind = 'main' | 'sub' | 'pattern' | 'custom' | 'failure';
export type ProblemStatus = 'Open' | 'Understood' | 'Resolved';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export interface TaxonomyNode { id:string; name:string; slug:string; kind:TaxonomyKind; parent_id:string|null; aliases:string[]; color:string|null; protected:boolean; sort_order:number }
export interface TaxonomyResponse { nodes:TaxonomyNode[]; main:TaxonomyNode[]; sub:TaxonomyNode[]; patterns:TaxonomyNode[]; failure_reasons:TaxonomyNode[] }
export interface MistakeEvent { id:string; occurred_at:string; observation:string; reasons:TaxonomyNode[] }
export interface Problem { id:string; source:string; source_key:string; slug:string; title:string; url:string|null; difficulty:Difficulty; status:ProblemStatus; primary_subtag:TaxonomyNode; primary_main:TaxonomyNode; taxonomy:TaxonomyNode[]; time_complexity:string; space_complexity:string; mistake_count:number; created_at:string; updated_at:string; python_code?:string; notes?:Record<string,string[]>; mistake_events?:MistakeEvent[] }
export interface ProblemPayload { record_initial_mistake?:boolean; title:string; url?:string|null; source?:string; source_key?:string; difficulty:Difficulty; status:ProblemStatus; primary_subtag_id:string; taxonomy_ids:string[]; failure_reason_ids?:string[]; python_code:string; time_complexity:string; space_complexity:string; notes:Record<string,string[]>; occurred_at?:string; observation?:string }
export interface Analytics { summary:{total:number;resolved:number;open:number;repeat_mistakes:number;unsynced_files:number}; domains:Array<TaxonomyNode&{count:number;open:number;repeat_mistakes:number}>; patterns:Array<{name:string;count:number}>; activity:Array<{date:string;count:number}>; failure_reasons:TaxonomyNode[]; failure_matrix:Array<{main_id:string;main:string;reason_id:string;reason:string;value:number}>; recent:Problem[] }
export interface AtlasGraphData { nodes:Array<{id:string;name:string;kind:string;color:string;value:number;status?:string;difficulty?:string}>; links:Array<{source:string;target:string;kind:string}>; aggregated:boolean }
export interface GitState { remote:string;branch:string;user_name:string;user_email:string;ahead:number;behind:number;has_head:boolean;remote_branch_exists:boolean;warnings:string[];changes?:Array<{code:string;path:string;kind:string}>;additions?:number;updates?:number;deletions?:number;proposed_commit?:string;ready?:boolean;status?:string }
export type SyncDecision = 'keep_local' | 'use_incoming';
export interface SyncRecordSummary { id:string; title:string; updated_at:string }
export interface SyncFieldComparison { field:string; label:string; local:string; incoming:string }
export interface SyncConflict {
  id:string;
  kind:'both_changed'|'incoming_deleted'|'local_deleted'|'legacy_diverged'|'legacy_missing_local'|'identity_conflict';
  summary:string;
  changed_fields:string[];
  field_comparisons:SyncFieldComparison[];
  local:SyncRecordSummary|null;
  incoming:SyncRecordSummary|null;
  related_local_id:string|null;
}
export interface SyncStatus {
  available:boolean;
  state:'no_export'|'invalid'|'conflicts'|'changes_available'|'clean';
  creates:number;
  updates:number;
  local_changes:number;
  conflicts:SyncConflict[];
  review_version:string|null;
  validation_error:string|null;
  last_result:{applied:number;resolved:number;completed_at:string;message:string}|null;
  applied?:number;
  resolved?:number;
}
