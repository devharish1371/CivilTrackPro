import { Routes, Route } from 'react-router-dom'
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
import GrantManager from './components/GrantManager'
import Settings from './components/Settings'

export default function App() {
  return (
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
        <Route path="/grants" element={<GrantManager />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
