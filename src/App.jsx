import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectList from './components/ProjectList'
import ProjectForm from './components/ProjectForm'
import ProjectDetail from './components/ProjectDetail'
import Reports from './components/Reports'
import AlertsPanel from './components/AlertsPanel'
import ContractorManager from './components/ContractorManager'
import EngineerManager from './components/EngineerManager'
import SchemeManager from './components/SchemeManager'
import ConstituencyManager from './components/ConstituencyManager'
import PanchayatManager from './components/PanchayatManager'
import GrantManager from './components/GrantManager'
import CategoryManager from './components/CategoryManager'
import Settings from './components/Settings'
import KanbanBoard from './components/KanbanBoard'
import GlobalMap from './components/GlobalMap'
import ActionCenter from './components/ActionCenter'
import SessionGate from './components/SessionGate'

export default function App() {
  return (
    <SessionGate>
      <Layout>
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
      </Layout>
    </SessionGate>
  )
}
