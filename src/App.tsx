import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import OverviewPage from './pages/OverviewPage';
import CampaignsListPage from './pages/CampaignsListPage';
import CreateCampaignPage from './pages/CreateCampaignPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import ContactsPage from './pages/ContactsPage';
import USPLibraryPage from './pages/USPLibraryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="campaigns" element={<CampaignsListPage />} />
          <Route path="campaigns/new" element={<CreateCampaignPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="usps" element={<USPLibraryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;