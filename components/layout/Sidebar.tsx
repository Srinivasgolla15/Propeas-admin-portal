import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { NAV_ITEMS, APP_NAME } from '../../constants';
import { NavItem as NavItemType, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const canView = (itemRoles?: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (!itemRoles || itemRoles.length === 0) return true;
    return itemRoles.includes(currentUser.role);
  };

  const isPathActive = (itemPath: string | undefined, currentPath: string): boolean => {
    if (!itemPath) return false;
    if (itemPath === '/') return currentPath === '/';
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  const hasActiveChild = (items: NavItemType[] | undefined, currentPath: string): boolean => {
    if (!items) return false;
    for (const item of items) {
      if (!canView(item.roles)) continue;
      if (isPathActive(item.path, currentPath)) return true;
      if (hasActiveChild(item.subItems, currentPath)) return true;
    }
    return false;
  };

  useEffect(() => {
    if (!currentUser) return;

    const determineOpenSections = (items: NavItemType[], currentPath: string): Record<string, boolean> => {
      let newOpenState: Record<string, boolean> = {};
      for (const item of items) {
        if (!canView(item.roles)) continue;
        if (item.subItems && hasActiveChild(item.subItems, currentPath)) {
          newOpenState[item.name] = true;
          const childOpen = determineOpenSections(item.subItems, currentPath);
          newOpenState = { ...newOpenState, ...childOpen };
        }
      }
      return newOpenState;
    };

    setOpenSections(prev => ({
      ...prev,
      ...determineOpenSections(NAV_ITEMS, location.pathname),
    }));
  }, [location.pathname, currentUser]);

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const renderNavItem = (item: NavItemType, level: number = 0) => {
    if (!canView(item.roles)) return null;

    const isActive =
      hasActiveChild(item.subItems, location.pathname) || isPathActive(item.path, location.pathname);

    const baseClasses = `flex items-center w-full text-sm py-2.5 rounded-md transition-colors duration-150 ease-in-out group`;
    const activeClasses = `bg-primary/10 text-primary dark:bg-dark-primary/20 dark:text-sky-400 font-medium`;
    const inactiveClasses = `hover:bg-secondary dark:hover:bg-dark-secondary text-foreground/70 dark:text-dark-foreground/70 hover:text-foreground dark:hover:text-dark-foreground`;

    let linkOrButtonClasses = `${baseClasses} `;

    if (level === 0) linkOrButtonClasses += `px-4`;
    else if (level === 1) linkOrButtonClasses += `pl-7 pr-4`;
    else linkOrButtonClasses += `pl-${7 + (level - 1) * 4} pr-4`;

    if (isActive && !item.subItems) {
      linkOrButtonClasses += activeClasses;
    } else if (isActive && item.subItems) {
      linkOrButtonClasses += `text-primary dark:text-sky-400 font-medium`;
    } else {
      linkOrButtonClasses += inactiveClasses;
    }

    const iconSize = level === 0 ? 18 : level === 1 ? 16 : 14;

    // Render Accordion Button
    if (item.subItems && item.subItems.length > 0) {
      return (
        <div key={item.name}>
          <button
            type="button"
            onClick={() => toggleSection(item.name)}
            className={`${linkOrButtonClasses} justify-between`}
            aria-controls={`section-${item.name.replace(/\s+/g, '-')}`}
          >
            <span className="flex items-center space-x-2 min-w-0">
              {item.icon && (
                <span className="flex-shrink-0 text-foreground/60 dark:text-dark-foreground/60 group-hover:text-foreground dark:group-hover:text-dark-foreground">
                  {React.cloneElement(item.icon, { size: iconSize })}
                </span>
              )}
              <span className="truncate">{item.name}</span>
            </span>
            {openSections[item.name] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openSections[item.name] && (
            <div className="mt-1 space-y-1" id={`section-${item.name.replace(/\s+/g, '-')}`}>
              {item.subItems.map(subItem => renderNavItem(subItem, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Render NavLink
    if (item.path) {
      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive: navLinkIsActive }) =>
            `${linkOrButtonClasses} ${navLinkIsActive ? activeClasses : inactiveClasses}`
          }
          onClick={window.innerWidth < 768 && isSidebarOpen ? toggleSidebar : undefined}
        >
          <span className="flex items-center space-x-2 min-w-0">
            {item.icon && (
              <span className="flex-shrink-0 text-foreground/60 dark:text-dark-foreground/60 group-hover:text-foreground dark:group-hover:text-dark-foreground">
                {React.cloneElement(item.icon, { size: iconSize })}
              </span>
            )}
            <span className="truncate">{item.name}</span>
          </span>
        </NavLink>
      );
    }

    return null;
  };

  if (!currentUser) return null;

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col h-screen bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground border-r border-secondary dark:border-dark-secondary/50 transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:min-w-[260px] md:w-[260px] w-64 shadow-lg overflow-y-auto`}
        aria-label="Main Navigation"
      >

        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary dark:border-dark-secondary/50">
          <NavLink to="/" className="flex items-center text-xl font-bold text-primary dark:text-sky-400 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt={`${APP_NAME} Logo`} className="h-8 w-8 mr-2 object-contain" />
            {APP_NAME}
          </NavLink>
          <button onClick={toggleSidebar} className="md:hidden text-foreground dark:text-dark-foreground" aria-label="Close sidebar">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <nav className="flex-grow p-3 space-y-1.5 overflow-y-auto">
            {NAV_ITEMS.map(item => renderNavItem(item))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
