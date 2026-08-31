import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {AppLayout} from '../src/components/AppLayout';
import {AtlasPage} from '../src/pages/AtlasPage';
import {makeAtlasFixture} from './atlas-fixture';
import '../src/styles.css';
import '../src/refined.css';

// Vite development harness: populated in memory, no API requests or record writes.
if(import.meta.env.DEV){
  const options=new URLSearchParams(location.search),graph=makeAtlasFixture(options.has('empty')?0:240);
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false,enabled:false}}});
  client.setQueryData(['atlas'],graph);
  client.setQueryData(['analytics'],{summary:{total:options.has('empty')?0:240,resolved:options.has('empty')?0:120,open:options.has('empty')?0:120,repeat_mistakes:0,unsynced_files:0},domains:[],patterns:[],activity:[],failure_reasons:[],failure_matrix:[],recent:[]});
  createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><MemoryRouter><Routes><Route element={<AppLayout/>}><Route index element={<AtlasPage initialWebGL={options.has('no-webgl')?false:undefined}/>}/><Route path="*" element={<p>Synthetic preview destination. No local records are changed.</p>}/></Route></Routes></MemoryRouter></QueryClientProvider></React.StrictMode>);
}
