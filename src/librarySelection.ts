import type {Problem} from './types';

export function libraryRequest(params:URLSearchParams){
  const id=params.get('problem_id');
  if(id)return {path:`/api/problems/${encodeURIComponent(id)}`,single:true};
  const filters=new URLSearchParams(params);filters.delete('problem_id');filters.set('limit','250');
  return {path:`/api/problems?${filters}`,single:false};
}

export async function fetchLibrarySelection(params:URLSearchParams,request:<T>(path:string)=>Promise<T>){
  const {path,single}=libraryRequest(params);
  if(single){const problem=await request<Problem>(path);return {items:[problem],total:1}}
  return request<{items:Problem[];total:number}>(path);
}

export function updateLibraryFilter(params:URLSearchParams,key:string,value:string){
  const next=new URLSearchParams(params);next.delete('problem_id');
  if(key==='main_id'){next.delete('subtag_id');next.delete('taxonomy_id')}
  value?next.set(key,value):next.delete(key);
  return next;
}
