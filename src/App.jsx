import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SessionGate from './components/SessionGate'

const Dashboard = lazy(() => import('./components/Dashboard'))
const ProjectList = lazy(() => import('./components/ProjectList'))
const ProjectForm = lazy(() => import('./components/ProjectForm'))
const ProjectDetail = lazy(() => import('./components/ProjectDetail'))
const Reports = lazy(() => import('./components/Reports'))
const AlertsPanel = lazy(() => import('./components/AlertsPanel'))
const ContractorManager = lazy(() => import('./components/ContractorManager'))
const EngineerManager = lazy(() => import('./components/EngineerManager'))
const SchemeManager = lazy(() => import('./components/SchemeManager'))
const ConstituencyManager = lazy(() => import('./components/ConstituencyManager'))
const PanchayatManager = lazy(() => import('./components/PanchayatManager'))
const GrantManager = lazy(() => import('./components/GrantManager'))
const CategoryManager = lazy(() => import('./components/CategoryManager'))
const Settings = lazy(() => import('./components/Settings'))
const KanbanBoard = lazy(() => import('./components/KanbanBoard'))
const GlobalMap = lazy(() => import('./components/GlobalMap'))
const ActionCenter = lazy(() => import('./components/ActionCenter'))

export default function App() {
  return (
    <SessionGate>
      <Layout>
      <Suspense fallback={<div className="empty-state"><p>Loading page...</p></div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/alerts" element={<AlertsPanel />} />
        <Route path="/contractors" element={<ContractorManager />} />
        <Route path="/engineers" element={<EngineerManager />} />
        <Route path="/schemes" element={<SchemeManager />} />
        <Route path="/constituencies" element={<ConstituencyManager />} />
        <Route path="/panchayats" element={<PanchayatManager />} />
        <Route path="/grants" element={<GrantManager />} />
        <Route path="/categories" element={<CategoryManager />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/map" element={<GlobalMap />} />
        <Route path="/action-center" element={<ActionCenter />} />
        <Route path="/timeline" element={<Navigate to="/action-center" replace />} />
      </Routes>
      </Suspense>
      </Layout>
    </SessionGate>
  )
}
