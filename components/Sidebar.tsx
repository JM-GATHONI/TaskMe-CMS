
import React, { useState, useEffect } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { NavItem } from '../types';
import Icon from './Icon';

interface SidebarProps {
  activeRoute: string;
  isOpen: boolean;
  closeSidebarMobile: () => void;
}

const NavLink: React.FC<{ item: NavItem; isActive: boolean; isSubMenuOpen: boolean; toggleSubMenu: () => void; activeRoute: string; onClick: () => void; }> = ({ item, isActive, isSubMenuOpen, toggleSubMenu, activeRoute, onClick }) => {
  
  const generatePath = (parentName: string, subName: string): string => {
    if (parentName === 'R-Reits') {
        const subSlug = subName.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
        return `#/r-reits/${subSlug}`;
    }

    const parentSlug = parentName.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    const subSlug = subName.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
    
    if (parentName === 'Dashboard') {
        if (subName === 'Dashboard') return '#/dashboard';
        if (subName === 'Quick Stats') return '#/dashboard/stats';
        if (subName === 'Quick Search') return '#/dashboard/search';
    }
    
    return `#/${parentSlug}/${subSlug}`;
  };

  const handleSubmoduleClick = (path: string) => {
    window.location.hash = path;
    onClick();
  };

  return (
    <div className="text-sm">
      <button
        onClick={toggleSubMenu}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-secondary/50 ${isActive ? 'bg-secondary text-white font-semibold' : 'text-gray-300 hover:bg-secondary hover:text-white'}`}
        aria-expanded={isSubMenuOpen}
      >
        <div className="flex items-center space-x-3">
          <Icon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
          <span className="font-medium">{item.name}</span>
        </div>
        <Icon name={isSubMenuOpen ? 'chevron-up' : 'chevron-down'} className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
      </button>
      {isSubMenuOpen && (
        <div className="py-2 pl-8 pr-4 bg-black/10 rounded-b-md">
          <ul className="space-y-2">
            {item.subModules.map(sub => {
              const path = generatePath(item.name, sub);
              const isSubActive = activeRoute === path;
              return (
                 <li key={sub}>
                   <button 
                     onClick={() => handleSubmoduleClick(path)}
                     className={`block w-full text-left transition-colors duration-200 focus:outline-none focus:text-white ${isSubActive ? 'text-secondary font-semibold' : 'text-gray-400 hover:text-secondary'}`}
                   >
                     {sub}
                   </button>
                 </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeRoute, isOpen, closeSidebarMobile }) => {
  
  const getActiveModuleFromRoute = (route: string) => {
    if (route.startsWith('#/dashboard')) return 'Dashboard';
    if (route.startsWith('#/registration')) return 'Registration';
    if (route.startsWith('#/tenants')) return 'Tenants';
    if (route.startsWith('#/landlords')) return 'Landlords';
    if (route.startsWith('#/payments')) return 'Payments';
    if (route.startsWith('#/general-operations')) return 'General Operations';
    if (route.startsWith('#/field-operations')) return 'Field Operations';
    if (route.startsWith('#/hr-payroll')) return 'HR & Payroll';
    if (route.startsWith('#/communication')) return 'Communication';
    if (route.startsWith('#/accounting')) return 'Accounting';
    if (route.startsWith('#/maintenance')) return 'Maintenance';
    if (route.startsWith('#/leases')) return 'Leases';
    if (route.startsWith('#/analytics')) return 'Analytics';
    if (route.startsWith('#/reports')) return 'Reports';
    if (route.startsWith('#/user-app-portal')) return 'User App Portal';
    if (route.startsWith('#/marketplace')) return 'Marketplace';
    if (route.startsWith('#/website')) return 'Website';
    if (route.startsWith('#/r-reits')) return 'R-Reits';
    if (route.startsWith('#/settings')) return 'Settings';
    return 'Dashboard';
  };

  const activeModule = getActiveModuleFromRoute(activeRoute);
  const [openSubMenus, setOpenSubMenus] = useState<{[key: string]: boolean}>({ [activeModule]: true });

  useEffect(() => {
    const currentModule = getActiveModuleFromRoute(activeRoute);
    // Only auto-open if not explicitly closed by user previously, 
    // but for now simpler logic: auto-open current module if it's not open
    if (!openSubMenus[currentModule]) {
      setOpenSubMenus(prev => ({ ...prev, [currentModule]: true }));
    }
  }, [activeRoute]);

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus(prev => ({...prev, [name]: !prev[name]}));
  };
  
  return (
    <aside
      id="main-nav"
      className="app-sidebar bg-primary text-white flex flex-col shadow-xl z-30"
      aria-label="Sidebar"
    >
        {/* Top Section - Branch Filter - Fixed at top of sidebar container */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0 bg-primary z-10">
            <div className="relative">
            <select 
                className="w-full px-3 py-2 text-sm text-white bg-black/20 border border-white/10 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-secondary"
                aria-label="Branch filter"
            >
                <option>All Branches</option>
                <option>Kericho Branch</option>
                <option>Kisii Branch</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <Icon name="chevron-down" className="w-4 h-4" />
            </div>
            </div>
            <div className="mt-4 border-b border-white/10 w-full"></div>
        </div>
        
        {/* Navigation Menu - Scrollable Area */}
        <nav className="px-4 py-2 pb-4 flex-grow overflow-y-auto sidebar-nav-scroll">
            <ul className="space-y-2">
            {NAVIGATION_ITEMS.map(item => (
                <li key={item.name}>
                    <NavLink 
                        item={item} 
                        isActive={activeModule === item.name}
                        isSubMenuOpen={!!openSubMenus[item.name]}
                        toggleSubMenu={() => toggleSubMenu(item.name)}
                        activeRoute={activeRoute}
                        onClick={closeSidebarMobile}
                    />
                </li>
            ))}
            </ul>
        </nav>

      {/* Footer Section - Fixed at bottom of sidebar container */}
      <div className="p-4 bg-black/20 mt-auto flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center font-bold text-white text-xs">
            SA
          </div>
          <div>
            <p className="text-white text-sm font-semibold">System Admin</p>
            <p className="text-gray-400 text-xs">admin@taskme.re</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
