import type { ProblemPayload } from './types';
const WRITE_HEADERS = {'Content-Type':'application/json','X-Algo-Atlas':'1'};
export async function api<T>(path:string, init?:RequestInit):Promise<T>{const response=await fetch(path,init);if(!response.ok){const payload=await response.json().catch(()=>({detail:response.statusText}));throw new Error(payload.detail||'Algo Atlas could not complete that action.')}return response.json() as Promise<T>}
export function writeApi<T>(path:string,method:'POST'|'PATCH'|'DELETE',body:unknown={}):Promise<T>{return api<T>(path,{method,headers:WRITE_HEADERS,body:JSON.stringify(body)})}
export const problemApi={create:(payload:ProblemPayload)=>writeApi('/api/problems','POST',payload),update:(id:string,payload:Partial<ProblemPayload>)=>writeApi(`/api/problems/${id}`,'PATCH',payload),remove:(id:string)=>writeApi(`/api/problems/${id}`,'DELETE')};
