
import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { useData } from '../context/DataContext';
import { useProfileDisplay } from '../hooks/useProfileDisplay';
import { uploadToBucket } from '../utils/supabaseStorage';
import { supabase } from '../utils/supabaseClient';
import { Notification } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen, onLogout }) => {
  const { systemSettings, updateSystemSettings, notifications, currentUser } = useData();
  const { initial: profileInitial } = useProfileDisplay({ nameFallback: currentUser?.name });
  const { logo, profilePic, companyName } = systemSettings;
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = file.name.split('.').pop() || 'jpg';
          const path = `${user.id}/header-profile-${Date.now()}.${ext}`;
          const url = await uploadToBucket('profile-pictures', path, file);
          updateSystemSettings({ profilePic: url });
        } else {
          const resizedPic = await resizeImage(file, 150, 150);
          updateSystemSettings({ profilePic: resizedPic });
        }
      } catch (error) {
        console.error("Error processing profile pic", error);
      }
    }
  };

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'Success': return { icon: 'check', color: 'text-green-500' };
          case 'Warning': return { icon: 'arrears', color: 'text-red-500' };
          case 'Alert': return { icon: 'bell', color: 'text-yellow-500' };
          default: return { icon: 'info', color: 'text-blue-500' };
      }
  };

  return (
    <header id="app-header" className="app-header w-full flex flex-col shadow-lg bg-primary">
      {/* 1. Top Band: Primary Color */}
      <div className="bg-primary h-16 flex items-center justify-between px-4 md:px-6 relative z-20">
        
        {/* Left: Company Logo (Display Only) */}
        <div className="h-full flex items-center py-2">
            <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden border-2 border-white">
                {logo ? (
                    <img src={logo} alt="Logo" className="h-full w-full object-contain p-1" />
                ) : (
                    <Icon name="branch" className="w-6 h-6 text-primary" />
                )}
            </div>
        </div>

        {/* Center: Title (White Text) */}
        <h1 className="text-white text-lg md:text-2xl font-bold tracking-wide truncate hidden sm:block">
          {companyName}
        </h1>
        
        {/* Right: Profile & Logout */}
        <div className="flex items-center gap-4">
             <label className="cursor-pointer relative group" title="Upload Profile Picture">
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 shadow-md overflow-hidden group-hover:border-white transition-all">
                  {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      <span>{profileInitial}</span>
                  )}
                </div>
             </label>
             <button onClick={onLogout} className="text-white/80 hover:text-white flex items-center text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10">
                <Icon name="offboarding" className="w-4 h-4 mr-1.5" /> Logout
             </button>
        </div>
      </div>
      
      {/* 2. Middle Band: Secondary Color (Navigation Strip) */}
      <div className="bg-secondary h-12 flex items-center px-4 justify-between shadow-inner border-b-4 border-primary relative z-30">
        {/* Hamburger - Left Edge */}
        <button 
          onClick={onToggleSidebar}
          className="text-white hover:bg-white/20 p-2 rounded focus:outline-none transition-colors"
        >
          <Icon name="menu" className="w-6 h-6" />
        </button>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('#/operations/communications/inbound')} className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-colors relative">
            <Icon name="mail" className="w-4 h-4" />
          </button>
          
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-colors relative ${isNotifOpen ? 'bg-white/40 ring-2 ring-white/50' : ''}`}
              >
                <Icon name="bell" className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in border border-gray-200">
                      <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                          <h3 className="font-bold text-gray-700 text-sm">Notifications</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 text-sm">No new notifications.</div>
                          ) : (
                              notifications.map((notif, idx) => {
                                  const { icon, color } = getNotifIcon(notif.type);
                                  return (
                                      <div key={idx} className={`p-3 border-b hover:bg-gray-50 flex gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                          <div className={`mt-1 flex-shrink-0 ${color}`}>
                                              <Icon name={icon} className="w-5 h-5" />
                                          </div>
                                          <div>
                                              <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                              <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                                              <p className="text-[10px] text-gray-400 mt-1">{notif.date}</p>
                                          </div>
                                      </div>
                                  );
                              })
                          )}
                      </div>
                      <div className="p-2 border-t bg-gray-50 text-center">
                          <button onClick={() => navigate('#/operations/communications/inbound')} className="text-xs font-bold text-primary hover:underline">View All Messages</button>
                      </div>
                  </div>
              )}
          </div>

          <button onClick={() => navigate('#/reports/overview')} className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-colors">
             <Icon name="stack" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
