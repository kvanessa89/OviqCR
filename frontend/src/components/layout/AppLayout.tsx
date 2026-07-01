import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="main-wrap">
        <Topbar onMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
