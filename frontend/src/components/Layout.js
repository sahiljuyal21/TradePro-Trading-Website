import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { id: 'market', label: 'Market', icon: MarketIcon, path: '/market' },
  { id: 'portfolio', label: 'Portfolio', icon: PortfolioIcon, path: '/portfolio' },
  { id: 'orders', label: 'Orders', icon: OrdersIcon, path: '/orders' },
  { id: 'watchlist', label: 'Watchlist', icon: WatchlistIcon, path: '/watchlist' },
];

function DashboardIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function MarketIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function PortfolioIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5V6H12V4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M3 3v18h18"/></svg>;
}
function OrdersIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>;
}
function WatchlistIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6"/><path d="M7 3 3 7l4 4"/><path d="M21 13l-4 4-4-4"/></svg>;
}

export function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="sidebar-header">
        <div className="logo">TP</div>
        <span style={{ fontWeight: 600, fontSize: 18 }}>TradePro</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Trading</div>
          {navItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={item.path === '/dashboard'}
            >
              <item.icon className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}

export function Header({ user, onMenuToggle, onLogout, sidebarOpen, setSidebarOpen }) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef(null);

  React.useEffect(() => {
    if (!userMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [userMenuOpen]);

  return (
    <header className="header">
      <div className="header-left">
        <button className="btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)} style={{display: 'none'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="header-right">
        <div className="search-box">
          <input type="text" placeholder="Search stocks..." />
        </div>
        <div className="user-menu" ref={userMenuRef}>
          <button
            className="user-btn"
            type="button"
            aria-expanded={userMenuOpen}
            aria-controls="user-dropdown"
            onClick={() => setUserMenuOpen(open => !open)}
          >
            <div className="user-avatar">{user?.name?.[0] || 'U'}</div>
            <span className="user-name">{user?.name || 'Guest'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div id="user-dropdown" className="user-dropdown" hidden={!userMenuOpen}>
            <div className="user-dropdown-item" style={{color: 'var(--text-primary)', cursor: 'default'}}>
              <strong>{user?.email}</strong>
            </div>
            <div className="user-dropdown-divider" />
            <button className="user-dropdown-item" onClick={onLogout} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', font: 'inherit', cursor: 'pointer'}}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}