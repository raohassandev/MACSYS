import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useDevices } from "@/hooks/useDevices";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceStatus } from "@shared/schema";

// Icons
import {
  LayoutDashboard,
  ServerIcon,
  LineChart,
  Settings,
  ChevronRight,
  User,
} from "lucide-react";

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const [location] = useLocation();
  const { data: devices, isLoading } = useDevices();

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="bg-sidebar w-64 flex-shrink-0 border-r border-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar">
        <h1 className="text-xl font-bold text-white flex items-center">
          <ServerIcon className="mr-2 text-primary" />
          ModbusTCP Dashboard
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main
        </div>
        
        <NavItem 
          href="/" 
          icon={<LayoutDashboard className="h-4 w-4 mr-3" />} 
          label="Dashboard" 
          active={location === "/"} 
          onClick={handleNavigation}
        />
        
        <NavItem 
          href="/devices" 
          icon={<ServerIcon className="h-4 w-4 mr-3" />} 
          label="Devices" 
          active={location.startsWith("/devices")} 
          onClick={handleNavigation}
        />
        
        <NavItem 
          href="/history" 
          icon={<LineChart className="h-4 w-4 mr-3" />} 
          label="History" 
          active={location === "/history"} 
          onClick={handleNavigation}
        />
        
        <NavItem 
          href="/settings" 
          icon={<Settings className="h-4 w-4 mr-3" />} 
          label="Settings" 
          active={location === "/settings"} 
          onClick={handleNavigation}
        />

        <div className="px-4 mt-6 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Devices
        </div>

        {isLoading ? (
          <DevicesSkeleton />
        ) : (
          devices?.map((device) => (
            <DeviceNavItem 
              key={device.id} 
              device={device} 
              onClick={handleNavigation}
            />
          ))
        )}
      </nav>

      <div className="p-4 border-t border-sidebar">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-gray-500">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 hover:bg-secondary",
          active && "bg-secondary border-l-4 border-primary"
        )}
        onClick={onClick}
      >
        {icon}
        {label}
      </a>
    </Link>
  );
}

interface DeviceNavItemProps {
  device: {
    id: number;
    name: string;
    enabled: boolean;
  };
  onClick?: () => void;
}

function DeviceNavItem({ device, onClick }: DeviceNavItemProps) {
  const isOnline = device.enabled;
  const status = isOnline ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
  
  return (
    <Link href={`/devices/${device.id}`}>
      <a
        className="flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-secondary"
        onClick={onClick}
      >
        <div className="flex items-center">
          <div 
            className={cn(
              "w-2 h-2 rounded-full mr-3",
              isOnline ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span>{device.name}</span>
        </div>
        <span className="text-xs bg-secondary px-2 py-1 rounded">
          {status === DeviceStatus.ONLINE ? "Online" : "Offline"}
        </span>
      </a>
    </Link>
  );
}

function DevicesSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Skeleton className="w-2 h-2 rounded-full mr-3" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      ))}
    </>
  );
}
