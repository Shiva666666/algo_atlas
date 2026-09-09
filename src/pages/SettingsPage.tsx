import {useEffect,useMemo,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ArchiveRestore,CheckCircle2,CloudDownload,Database,GitBranch,HardDrive,RefreshCw,Rocket,Save,ShieldCheck,TriangleAlert} from 'lucide-react';
import {api,writeApi} from '../api';
import type {GitState,SyncDecision,SyncStatus} from '../types';

type ResultState={message?:string;error?:string;data?:GitState};

function syncHeadline(sync:SyncStatus|undefined,isPending:boolean){
  if(isPending)return 'Checking pulled algorithms…';
  if(!sync)return 'Sync status unavailable';
  if(sync.state==='invalid')return 'Pulled export needs attention';
  if(sync.conflicts.length)return `${sync.conflicts.length} change${sync.conflicts.length===1?'':'s'} need your review`;
  if(sync.creates||sync.updates)return `${sync.creates+sync.updates} safe update${sync.creates+sync.updates===1?'':'s'} ready`;
  return 'This device is synchronized';
}

export function SettingsPage(){
  const queryClient=useQueryClient();
  const{data:git}=useQuery({queryKey:['git'],queryFn:()=>api<GitState>('/api/git')});
  const syncQuery=useQuery({queryKey:['sync-status'],queryFn:()=>api<SyncStatus>('/api/sync/status')});
  const[form,setForm]=useState({remote_url:'',branch:'main',user_name:'',user_email:''});
  const[reduced,setReduced]=useState(()=>localStorage.getItem('algo-atlas-reduced-motion')==='true');
  const[result,setResult]=useState<ResultState|null>(null);
  const[decisions,setDecisions]=useState<Record<string,SyncDecision>>({});

  useEffect(()=>{if(git)setForm({remote_url:git.remote??'',branch:git.branch??'main',user_name:git.user_name??'',user_email:git.user_email??''})},[git]);
  useEffect(()=>{setDecisions({})},[syncQuery.data?.review_version]);

  const refreshAll=async()=>{
    await Promise.all([
      queryClient.invalidateQueries({queryKey:['sync-status']}),
      queryClient.invalidateQueries({queryKey:['git']}),
      queryClient.invalidateQueries({queryKey:['problems']}),
      queryClient.invalidateQueries({queryKey:['analytics']}),
      queryClient.invalidateQueries({queryKey:['atlas']}),
    ]);
  };

  const saveGit=useMutation({
    mutationFn:()=>writeApi<GitState>('/api/git','PATCH',form),
    onSuccess:async data=>{setResult({message:'Git settings saved on this device.',data});await refreshAll()},
    onError:(error:Error)=>setResult({error:error.message}),
  });
  const exportNow=useMutation({
    mutationFn:()=>writeApi<{catalog:{record_count:number};git:GitState}>('/api/export/preview','POST',{}),
    onSuccess:async data=>{setResult({message:`Prepared ${data.catalog.record_count} algorithms and created a local backup.`,data:data.git});await refreshAll()},
    onError:(error:Error)=>setResult({error:error.message}),
  });
  const preview=useMutation({
    mutationFn:()=>writeApi<GitState>('/api/git/preview','POST',{}),
    onSuccess:async data=>{setResult({message:data.changes?.length?`${data.changes.length} export files are ready for review.`:'Your algorithm export is already synchronized.',data});await refreshAll()},
    onError:(error:Error)=>setResult({error:error.message}),
  });
  const publish=useMutation({
    mutationFn:()=>writeApi<GitState>('/api/git/publish','POST',{}),
    onSuccess:async data=>{setResult({message:data.status==='no_changes'?'Nothing new to publish.':'Algorithm exports published to GitHub.',data});await refreshAll()},
    onError:(error:Error)=>setResult({error:error.message}),
  });
  const restore=useMutation({
    mutationFn:(payload:{dry_run:boolean;review_version?:string|null;decisions?:Record<string,SyncDecision>})=>writeApi<SyncStatus>('/api/export/restore','POST',payload),
    onSuccess:async data=>{setDecisions({});setResult({message:data.applied?`Applied ${data.applied} pulled algorithm change${data.applied===1?'':'s'} safely.`:'Sync review saved; local work was preserved.'});await refreshAll()},
    onError:(error:Error)=>setResult({error:error.message}),
  });

  const sync=syncQuery.data;
  const allConflictsChosen=Boolean(sync?.conflicts.length)&&sync!.conflicts.every(conflict=>decisions[conflict.id]);
  const removesLocalData=useMemo(()=>sync?.conflicts.some(conflict=>{
    const choice=decisions[conflict.id];
    return choice==='use_incoming'&&(conflict.kind==='incoming_deleted'||conflict.kind==='identity_conflict');
  })??false,[sync?.conflicts,decisions]);
  const applyReview=()=>{
    if(!sync?.review_version||!allConflictsChosen)return;
    if(removesLocalData&&!window.confirm('One or more choices remove a local problem. A backup will be created first. Apply these choices?'))return;
    restore.mutate({dry_run:false,review_version:sync.review_version,decisions});
  };
  const toggleMotion=()=>{const next=!reduced;setReduced(next);localStorage.setItem('algo-atlas-reduced-motion',String(next))};
  const busy=exportNow.isPending||preview.isPending||publish.isPending||restore.isPending;

  return <section className="page-scroll">
    <div className="page-heading"><div><h2>Settings & sync</h2><p>Pull code with Git, then reopen the app. Algo Atlas rebuilds changed UI and safely reconciles algorithm exports.</p></div><span className="local-shield"><ShieldCheck size={15}/> 127.0.0.1 ONLY</span></div>
    {result&&<div className={`result-banner ${result.error?'error':''}`} role="status" aria-live="polite">{result.error?<TriangleAlert size={16}/>:<CheckCircle2 size={16}/>}<span>{result.error??result.message}</span><button onClick={()=>setResult(null)}>Dismiss</button></div>}
    <div className="settings-grid">
      <article className={`panel settings-card sync-review-card ${sync?.conflicts.length?'has-conflicts':''}`}>
        <div className="panel-title"><span><CloudDownload size={15}/> PULLED ALGORITHM UPDATES</span><small>{sync?.state==='clean'?'CURRENT':sync?.state==='invalid'?'INVALID EXPORT':sync?.conflicts.length?'REVIEW REQUIRED':'CHECKING'}</small></div>
        <div className="sync-summary">
          <div><b>{syncHeadline(sync,syncQuery.isPending)}</b><p>{sync?.state==='invalid'?sync.validation_error:sync?.state==='no_export'?'No tracked export exists yet. Publish from the device that contains your algorithms.':sync?.conflicts.length?'Choose which version to keep for every item. Nothing is overwritten until you apply the review.':sync?.creates||sync?.updates?`${sync.creates} new and ${sync.updates} updated algorithms can be imported without replacing local edits.`:`${sync?.local_changes??0} local change${sync?.local_changes===1?'':'s'} will be included the next time you publish.`}</p></div>
          <button className="secondary-btn" onClick={()=>syncQuery.refetch()} disabled={syncQuery.isFetching||busy}><RefreshCw size={14}/> {syncQuery.isFetching?'Checking…':'Check again'}</button>
        </div>
        {sync?.last_result&&<p className="sync-last-result"><CheckCircle2 size={14}/>{sync.last_result.message}</p>}
        {Boolean(sync?.creates||sync?.updates)&&!sync?.conflicts.length&&<div className="sync-safe-action"><span>Safe incoming changes are applied when the app starts. You can also apply them now.</span><button onClick={()=>restore.mutate({dry_run:false})} disabled={busy}><ArchiveRestore size={14}/> Apply safe updates</button></div>}
        {Boolean(sync?.conflicts.length)&&<div className="conflict-list">
          {sync!.conflicts.map(conflict=><fieldset className="conflict-item" key={conflict.id}>
            <legend>{conflict.local?.title??conflict.incoming?.title??'Problem update'}</legend>
            <p>{conflict.summary}</p>
            <small>Changed: {conflict.changed_fields.join(', ')}</small>
            <details className="conflict-comparison"><summary>Compare versions</summary><div>{conflict.field_comparisons.map(comparison=><section key={comparison.field}><h4>{comparison.label}</h4><div><span><b>This device</b><pre>{comparison.local}</pre></span><span><b>Pulled version</b><pre>{comparison.incoming}</pre></span></div></section>)}</div></details>
            <div className="conflict-choices">
              <label><input type="radio" name={`decision-${conflict.id}`} checked={decisions[conflict.id]==='keep_local'} onChange={()=>setDecisions(current=>({...current,[conflict.id]:'keep_local'}))}/><span><b>Keep this device</b><small>{conflict.local?'Preserve the local version for the next publish.':'Keep the local deletion.'}</small></span></label>
              <label><input type="radio" name={`decision-${conflict.id}`} checked={decisions[conflict.id]==='use_incoming'} onChange={()=>setDecisions(current=>({...current,[conflict.id]:'use_incoming'}))}/><span><b>Use pulled version</b><small>{conflict.incoming?'Replace with the version from GitHub.':'Accept the deletion from GitHub.'}</small></span></label>
            </div>
          </fieldset>)}
          <div className="conflict-footer"><span>{Object.keys(decisions).length} of {sync!.conflicts.length} decisions selected</span><button className="publish-button" onClick={applyReview} disabled={!allConflictsChosen||busy}>{restore.isPending?'Applying…':'Apply reviewed changes'}</button></div>
        </div>}
      </article>

      <article className="panel settings-card git-card"><div className="panel-title"><span><GitBranch size={15}/> PRIVATE GITHUB CONNECTION</span><small>{git?.remote?'CONNECTED':'SETUP REQUIRED'}</small></div><div className="connection-line"><i className={git?.remote?'connected':''}/><div><b>{git?.remote?'Origin connected':'No remote connected'}</b><small>{git?.remote||'Create an empty private GitHub repository, then paste its URL below.'}</small></div></div><div className="form-grid"><label className="full"><span>GITHUB REMOTE URL</span><input value={form.remote_url} onChange={event=>setForm({...form,remote_url:event.target.value})} placeholder="https://github.com/you/algo-atlas.git"/></label><label><span>BRANCH</span><input value={form.branch} onChange={event=>setForm({...form,branch:event.target.value})}/></label><label><span>GIT NAME</span><input value={form.user_name} onChange={event=>setForm({...form,user_name:event.target.value})} placeholder="Your name"/></label><label className="full"><span>GIT EMAIL</span><input value={form.user_email} onChange={event=>setForm({...form,user_email:event.target.value})} placeholder="you@example.com"/></label></div><button className="secondary-btn" onClick={()=>saveGit.mutate()} disabled={saveGit.isPending}><Save size={14}/> {saveGit.isPending?'Saving…':'Save local Git settings'}</button></article>

      <article className="panel settings-card publish-card"><div className="panel-title"><span><Rocket size={15}/> PUBLISH ALGORITHMS</span><small>REVIEWED EXPORT FLOW</small></div><div className="publish-flow"><span><Database size={17}/><b>SQLite</b></span><i>→</i><span><HardDrive size={17}/><b>Readable export</b></span><i>→</i><span><GitBranch size={17}/><b>Private GitHub</b></span></div><p className="publish-scope-note"><TriangleAlert size={14}/><span><b>Algorithm data only.</b> Commit & Push stages <code>exports/</code>. UI or application-source changes still need a normal Git commit.</span></p><div className="publish-actions"><button onClick={()=>exportNow.mutate()} disabled={busy}><HardDrive size={15}/> {exportNow.isPending?'Exporting…':'Export + backup'}</button><button onClick={()=>preview.mutate()} disabled={busy}><RefreshCw size={15}/> {preview.isPending?'Checking…':'Preview changes'}</button><button className="publish-button" onClick={()=>publish.mutate()} disabled={busy||Boolean(sync?.conflicts.length)||sync?.state==='invalid'}><Rocket size={15}/> {publish.isPending?'Publishing…':'Commit & Push'}</button></div>{result?.data?.changes&&<div className="diff-preview"><header><span>{result.data.proposed_commit}</span><small>+{result.data.additions} ~{result.data.updates} −{result.data.deletions}</small></header>{result.data.warnings?.map(warning=><p className="warning" key={warning}><TriangleAlert size={12}/>{warning}</p>)}{result.data.changes.slice(0,8).map(change=><p key={change.path}><i className={change.kind}/><span>{change.path}</span><small>{change.kind}</small></p>)}</div>}</article>

      <article className="panel settings-card storage-card"><div className="panel-title"><span><HardDrive size={15}/> LOCAL STORAGE</span><small>SQLITE + FTS5</small></div><div className="storage-visual"><i/><i/><i/><span><b>algo_atlas.db</b><small>Source of truth · ignored by Git</small></span></div><ul><li><CheckCircle2 size={13}/> Pulled changes use three-way content comparison</li><li><CheckCircle2 size={13}/> Backups are created before imports and exports</li><li><CheckCircle2 size={13}/> Deletions and conflicts always require review</li><li><CheckCircle2 size={13}/> Export hashes are validated before database writes</li></ul></article>

      <article className="panel settings-card preference-card"><div className="panel-title"><span>VISUAL PREFERENCES</span><small>DEVICE-LOCAL</small></div><button className="toggle-row" onClick={toggleMotion}><span><b>Reduced motion</b><small>Use the 2D atlas and disable ambient animation.</small></span><i className={reduced?'on':''}><em/></i></button><div className="security-note"><ShieldCheck size={18}/><span><b>No account. No cloud database.</b><small>Write APIs require a trusted local origin and application marker.</small></span></div></article>
    </div>
  </section>;
}
