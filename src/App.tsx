import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter,Navigate,Route,Routes} from 'react-router-dom';
import {lazy,Suspense} from 'react';
import {AppLayout} from './components/AppLayout';
const AtlasPage=lazy(()=>import('./pages/AtlasPage').then(module=>({default:module.AtlasPage})));
const DashboardPage=lazy(()=>import('./pages/DashboardPage').then(module=>({default:module.DashboardPage})));
const LibraryPage=lazy(()=>import('./pages/LibraryPage').then(module=>({default:module.LibraryPage})));
const ProblemEditorPage=lazy(()=>import('./pages/ProblemEditorPage').then(module=>({default:module.ProblemEditorPage})));
const ProblemVisualizerPage=lazy(()=>import('./pages/ProblemVisualizerPage').then(module=>({default:module.ProblemVisualizerPage})));
const SettingsPage=lazy(()=>import('./pages/SettingsPage').then(module=>({default:module.SettingsPage})));
const TaxonomyPage=lazy(()=>import('./pages/TaxonomyPage').then(module=>({default:module.TaxonomyPage})));
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:15000,retry:1,refetchOnWindowFocus:false}}});
export function App(){return <QueryClientProvider client={queryClient}><BrowserRouter><Suspense fallback={<div className="route-loading"><i/><span>ALIGNING SIGNALS</span></div>}><Routes><Route element={<AppLayout/>}><Route index element={<AtlasPage/>}/><Route path="dashboard" element={<DashboardPage/>}/><Route path="library" element={<LibraryPage/>}/><Route path="problems/new" element={<ProblemEditorPage/>}/><Route path="problems/:problemId" element={<ProblemEditorPage/>}/><Route path="problems/:problemId/visualize" element={<ProblemVisualizerPage/>}/><Route path="taxonomy" element={<TaxonomyPage/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="sync" element={<Navigate to="/settings" replace/>}/></Route></Routes></Suspense></BrowserRouter></QueryClientProvider>}
