
import React, { useState, useEffect, useMemo } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { NavItem } from '../types';
import Icon from './Icon';
import { useData } from '../context/DataContext';
import { useProfileDisplay } from '../hooks/useProfileDisplay';

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
    <div className="text-xs">
      <button
        onClick={toggleSubMenu}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-secondary/50 ${isActive ? 'bg-secondary text-white font-semibold' : 'text-gray-300 hover:bg-secondary hover:text-white'}`}
        aria-expanded={isSubMenuOpen}
      >
        <div className="flex items-center space-x-2">
          <Icon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
          <span className="font-medium truncate">{item.name}</span>
        </div>
        <Icon name={isSubMenuOpen ? 'chevron-up' : 'chevron-down'} className={`w-3 h-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
      </button>
      {isSubMenuOpen && (
        <div className="py-2 pl-6 pr-2 bg-black/10 rounded-b-md">
          <ul className="space-y-1">
            {item.subModules.map(sub => {
              const path = generatePath(item.name, sub);
              const isSubActive = activeRoute === path;
              return (
                 <li key={sub}>
                   <button 
                     onClick={() => handleSubmoduleClick(path)}
                     className={`block w-full text-left transition-colors duration-200 focus:outline-none focus:text-white truncate py-1 ${isSubActive ? 'text-secondary font-semibold' : 'text-gray-400 hover:text-secondary'}`}
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
  const { currentUser, roles } = useData();
  const { displayName, initial, email, loading: profileLoading } = useProfileDisplay();

  // Filter navigation based on role permissions (Super Admin sees everything).
  // If roles haven't loaded yet, show all modules to avoid an empty sidebar flash.
  const userRole = roles.find(r => r.name === currentUser?.role);
  const filteredNav = (currentUser?.role === 'Super Admin' || roles.length === 0)
    ? (NAVIGATION_ITEMS as NavItem[])
    : (NAVIGATION_ITEMS.map(item => {
        const allowedSubs = item.subModules.filter(sub =>
          userRole?.accessibleSubmodules?.includes(`${item.name}/${sub}`) ||
          userRole?.accessibleSubmodules?.includes(item.name)
        );
        if (allowedSubs.length === 0) return null;
        return { ...item, subModules: allowedSubs };
      }).filter(Boolean) as NavItem[]);

  const getActiveModuleFromRoute = (route: string) => {
    if (route.startsWith('#/dashboard')) return 'Dashboard';
    if (route.startsWith('#/registration')) return 'Registration';
    if (route.startsWith('#/tenants')) return 'Tenants';
    if (route.startsWith('#/landlords')) return 'Landlords';
    if (route.startsWith('#/payments')) return 'Payments';
    if (route.startsWith('#/general-operations')) return 'Operations'; // Fix mapping
    if (route.startsWith('#/operations')) return 'Operations';
    if (route.startsWith('#/field-operations')) return 'Operations';
    if (route.startsWith('#/hr-payroll')) return 'HR & Payroll';
    if (route.startsWith('#/communication')) return 'Operations';
    if (route.startsWith('#/accounting')) return 'Accounting';
    if (route.startsWith('#/maintenance')) return 'Operations';
    if (route.startsWith('#/leases')) return 'Operations';
    if (route.startsWith('#/analytics')) return 'Reports & Analytics';
    if (route.startsWith('#/reports')) return 'Reports & Analytics';
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
    if (!openSubMenus[currentModule]) {
      setOpenSubMenus(prev => ({ ...prev, [currentModule]: true }));
    }
  }, [activeRoute]);

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus(prev => ({...prev, [name]: !prev[name]}));
  };

  // Visibility logic for Branch Selector
  const showBranchSelector = useMemo(() => {
    if (currentUser?.role === 'Super Admin') return true;
    return userRole?.isSystem || currentUser?.role === 'Landlord';
  }, [userRole, currentUser]);
  
  return (
    <aside
      id="main-nav"
      className="app-sidebar bg-primary text-white flex flex-col shadow-xl"
      aria-label="Sidebar"
    >
        {/* Top Section - Branch Filter */}
        {showBranchSelector && (
          <div className="px-3 pt-4 pb-2 flex-shrink-0 bg-primary z-10">
              <div className="relative">
              <select 
                  className="w-full px-2 py-2 text-xs text-white bg-black/20 border border-white/10 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-secondary"
                  aria-label="Branch filter"
              >
                  <option>All Branches</option>
                  <option>Kericho</option>
                  <option>Kisii</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                  <Icon name="chevron-down" className="w-3 h-3" />
              </div>
              </div>
              <div className="mt-4 border-b border-white/10 w-full"></div>
          </div>
        )}
        
        {/* Navigation Menu - Scrollable Area */}
        <nav className={`px-3 py-2 pb-4 flex-grow overflow-y-auto sidebar-nav-scroll ${!showBranchSelector ? 'pt-4' : ''}`}>
            <ul className="space-y-1">
            {filteredNav.map(item => (
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

      {/* Footer Section */}
      <div className="p-3 bg-black/20 mt-auto flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center font-bold text-white text-[10px]">
            {profileLoading ? '…' : (initial || 'U')}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-white text-xs font-semibold truncate">{displayName}</p>
            <p className="text-gray-400 text-[10px] truncate">{email || currentUser?.email || 'email@example.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
