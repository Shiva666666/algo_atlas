import { configureReadFallback } from '../shared/api/client';
import { offlineApi } from '../preview/catalog';
configureReadFallback(offlineApi);
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from './AppLayout';
const AtlasPage = lazy(() =>
  import('../features/atlas').then((module) => ({ default: module.AtlasPage })),
);
const DashboardPage = lazy(() =>
  import('../features/dashboard').then((module) => ({
    default: module.DashboardPage,
  })),
);
const LibraryPage = lazy(() =>
  import('../features/problems/library').then((module) => ({
    default: module.LibraryPage,
  })),
);
const ProblemEditorPage = lazy(() =>
  import('../features/problems/editor').then((module) => ({
    default: module.ProblemEditorPage,
  })),
);
const ProblemVisualizerPage = lazy(() =>
  import('../features/visualizers').then((module) => ({
    default: module.ProblemVisualizerPage,
  })),
);
const SettingsPage = lazy(() =>
  import('../features/settings').then((module) => ({ default: module.SettingsPage })),
);
const TaxonomyPage = lazy(() =>
  import('../features/taxonomy').then((module) => ({ default: module.TaxonomyPage })),
);
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: false } },
});
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="route-loading">
              <i />
              <span>ALIGNING SIGNALS</span>
            </div>
          }
        >
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<AtlasPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="problems/new" element={<ProblemEditorPage />} />
              <Route path="problems/:problemId" element={<ProblemEditorPage />} />
              <Route path="problems/:problemId/visualize" element={<ProblemVisualizerPage />} />
              <Route path="taxonomy" element={<TaxonomyPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="sync" element={<Navigate to="/settings" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
