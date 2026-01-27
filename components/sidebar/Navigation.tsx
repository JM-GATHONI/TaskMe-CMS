
import React from 'react';
import { NAVIGATION_ITEMS } from '../../constants';
import { NavItem } from '../../types';
import Icon from '../Icon';

interface NavigationProps {
  activeRoute: string;
  isCollapsed: boolean;
  onItemClick: (path: string) => void;
}

const NavLink: React.FC<{ item: NavItem; isActive: boolean; isCollapsed: boolean; onClick: () => void; }> = ({ item, isActive, isCollapsed, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 transition-colors duration-200 group focus:outline-none focus:bg-white/10 ${isActive ? 'bg-secondary text-white font-semibold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
      title={isCollapsed ? item.name : ''}
    >
      <div className="flex items-center justify-center w-6 h-6">
        <Icon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
      </div>
      {!isCollapsed && <span className="ml-3 text-sm truncate">{item.name}</span>}
    </button>
  );
};

const Navigation: React.FC<NavigationProps> = ({ activeRoute, isCollapsed, onItemClick }) => {
  return (
    <nav className="flex-grow overflow-y-auto py-4 space-y-1">
      {NAVIGATION_ITEMS.map((item) => {
        // Simple logic: if route starts with module name (converted to path), it's active
        // This assumes structure matches. A more robust router logic might be needed for complex apps.
        const modulePath = item.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
        // Handle special Dashboard case
        const isActive = item.name === 'Dashboard' 
            ? (activeRoute === '#/' || activeRoute === '#/dashboard' || activeRoute.startsWith('#/dashboard'))
            : activeRoute.startsWith(`#/${modulePath}`);
            
        // Calculate the target path (defaulting to the first submodule or overview)
        const targetPath = item.name === 'Dashboard' ? '#/dashboard' : `#/${modulePath}/${item.subModules[0].toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`;

        return (
          <NavLink
            key={item.name}
            item={item}
            isActive={isActive}
            isCollapsed={isCollapsed}
            onClick={() => onItemClick(targetPath)}
          />
        );
      })}
    </nav>
  );
};

export default Navigation;
