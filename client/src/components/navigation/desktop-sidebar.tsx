import { Button } from "@/components/ui/button";
import { 
  Home, 
  ArrowRightLeft, 
  TrendingUp, 
  Target, 
  PieChart,
  Crown,
  LogOut,
  Grid3X3,
  Settings
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import logoIcon from "@/assets/images/1.png";
import { useLocation } from "wouter";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";
import UserProfile from "@/components/profile/user-profile";

interface DesktopSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserType;
}

export default function DesktopSidebar({ activeTab, setActiveTab, user }: DesktopSidebarProps) {
  const [, setLocation] = useLocation();
  const { user: supabaseUser } = useSupabaseAuth();
  const [isPro, setIsPro] = useState(false);
  
  useEffect(() => {
    // Check if user is pro
    const userIsPro = localStorage.getItem("isProUser") === "true";
    setIsPro(userIsPro);
  }, []);
  
  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "transactions", icon: ArrowRightLeft, label: "Transactions" },
    { id: "categories", icon: Grid3X3, label: "Categories" },
    { id: "investments", icon: TrendingUp, label: "Investments" },
    { id: "goals", icon: Target, label: "Goals" },
    { id: "reports", icon: PieChart, label: "Reports" },
  ];

  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border shadow-card">
      <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
        {/* Logo/Header */}
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src={logoIcon} 
                alt="First Million Logo" 
                className="w-32 h-auto max-h-24"
                style={{ objectFit: "contain", minWidth: 96, minHeight: 64 }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">First Million</h1>
              <p className="text-xs text-muted-foreground font-medium">Investment Tracker</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-grow flex flex-col px-4">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-2xl w-full transition-all duration-300 ease-out relative ${
                    isActive
                      ? "bg-gradient-primary text-white shadow-glow transform scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300 ${
                    isActive 
                      ? "bg-white/20" 
                      : "bg-muted/30 group-hover:bg-muted/50"
                  }`}>
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                    }`} />
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Settings button */}
        <div className="flex-shrink-0 px-4 mb-2">
          <button
            className="group flex items-center px-4 py-3 text-sm font-semibold rounded-2xl w-full transition-all duration-300 ease-out text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => setLocation("/settings")}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300 bg-muted/30 group-hover:bg-muted/50">
              <Settings className="w-5 h-5 transition-all duration-300 text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="flex-1 text-left">Settings</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex-shrink-0 border-t border-border p-4 mt-2">
          <div className="flex items-center w-full p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 mb-4">
            <UserProfile compact />
            <button 
              className="ml-2 p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-muted/50"
              onClick={() => window.location.href = "/api/logout"}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {!isPro && (
            <Button className="w-full bg-gradient-warning text-white shadow-card hover:shadow-card-hover transition-all duration-300">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
