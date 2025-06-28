import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Moon, Sun, Laptop, Check, Crown, LockIcon, Mail, User as UserIcon } from "lucide-react";
import logoIcon from "@/assets/images/2.png";
import { themeOptions, applyTheme } from "@/lib/themeService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserProfile from "@/components/profile/user-profile";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [baseTheme, setBaseTheme] = useState<string>("system");
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const [isPro, setIsPro] = useState<boolean>(false);
  const { user: supabaseUser } = useSupabaseAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Load current theme on component mount
  useEffect(() => {
    const savedBaseTheme = localStorage.getItem("themeMode") || "system";
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    setBaseTheme(savedBaseTheme);
    setSelectedTheme(savedTheme);
    
    // Load user name from localStorage
    const storedName = localStorage.getItem("firstMillionUserName");
    if (storedName) {
      setUserName(storedName);
    }
    
    // Check if user is pro (would connect to a real auth service)
    // For demo purposes, we'll allow theme previews regardless
    const userIsPro = localStorage.getItem("isProUser") === "true";
    setIsPro(userIsPro);
    
    document.title = "Settings | First Million";
  }, []);
  
  // Function to update base theme (light/dark/system)
  const updateBaseTheme = (newTheme: string) => {
    setBaseTheme(newTheme);
    localStorage.setItem("themeMode", newTheme);
    
    // Only apply if we're using the default theme
    if (selectedTheme === "default") {
      if (newTheme === "dark" || (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };
  
  // Function to update premium theme
  const updateTheme = (themeId: string) => {
    // If user is trying to select a premium theme but isn't pro
    const theme = themeOptions.find(t => t.id === themeId);
    if (theme?.isPremium && !isPro) {
      // For demo, we'll allow preview but would normally show upgrade prompt
      // showUpgradePrompt();
    }
    
    setSelectedTheme(themeId);
    localStorage.setItem("selectedTheme", themeId);
    
    // Apply the theme
    applyTheme(themeId);
  };
  
  const baseThemeOptions = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Laptop },
  ];
  
  // Save user profile changes
  const saveProfileChanges = () => {
    if (userName.trim()) {
      localStorage.setItem("firstMillionUserName", userName);
    }
    setIsEditingProfile(false);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setLocation("/dashboard")}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>
          
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src={logoIcon} 
              alt="First Million Logo" 
              className="w-16 h-auto"
              style={{ objectFit: "contain", transform: "scale(1.5)", minWidth: 48, minHeight: 48 }}
            />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        {/* User Profile Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          <div className="bg-card rounded-xl border border-border p-6">
            {!isEditingProfile ? (
              <UserProfile showEdit onEdit={() => setIsEditingProfile(true)} />
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="ml-4 space-y-2">
                    <div>
                      <label htmlFor="userName" className="block text-sm font-medium text-muted-foreground mb-1">Display Name</label>
                      <Input
                        id="userName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 mr-1" />
                      <span>{supabaseUser?.email || localStorage.getItem("firstMillionUserEmail") || "No email"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={saveProfileChanges}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium mb-2">Account Status</h4>
              <div className="flex items-center">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${isPro ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {isPro ? 'Premium' : 'Free'}
                </div>
                {supabaseUser ? (
                  <div className="ml-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    Cloud Sync Enabled
                  </div>
                ) : (
                  <div className="ml-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    Local Only
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Theme Selection */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Themes</h2>
            {!isPro && (
              <div className="flex items-center text-amber-500 text-sm">
                <Crown className="w-4 h-4 mr-1" />
                <span>Upgrade for Premium Themes</span>
              </div>
            )}
          </div>
          
          {/* Default Theme Mode Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Default Theme Mode</h3>
            <div className="grid grid-cols-3 gap-4">
              {baseThemeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = baseTheme === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => updateBaseTheme(option.id)}
                    className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl border transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/10 shadow-md" 
                        : "border-border hover:border-primary/30 hover:bg-muted"
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className={`font-medium text-sm sm:text-base ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Premium Themes */}
          <div>
            <h3 className="text-lg font-medium mb-4">Theme Styles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {themeOptions.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                const isPremiumLocked = theme.isPremium && !isPro;
                
                // Generate theme-specific preview styles
                const previewStyles: any = {
                  backgroundImage: theme.backgroundTexture || "none",
                  background: theme.backgroundGradient || "var(--background)"
                };
                
                // Specific card styles for each theme
                let cardPreviewClass = "";
                let buttonPreviewClass = "";
                
                switch(theme.id) {
                  case 'nebula':
                    cardPreviewClass = "border border-purple-800/30 bg-purple-900/20 rounded-xl backdrop-blur-md";
                    buttonPreviewClass = "bg-gradient-to-r from-purple-600 to-blue-500";
                    break;
                  case 'emerald':
                    cardPreviewClass = "border border-green-800/30 bg-green-900/10 rounded-md backdrop-blur-md";
                    buttonPreviewClass = "bg-gradient-to-r from-green-600 to-emerald-500";
                    break;
                  case 'royal-gold':
                    cardPreviewClass = "border border-yellow-800/30 bg-amber-900/10 rounded-lg backdrop-blur-md";
                    buttonPreviewClass = "bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full";
                    break;
                  case 'neon-cyberpunk':
                    cardPreviewClass = "border border-pink-700/30 bg-pink-900/10 backdrop-blur-md";
                    buttonPreviewClass = "bg-gradient-to-r from-pink-600 to-purple-600";
                    break;
                  default:
                    cardPreviewClass = "border border-border bg-card";
                    buttonPreviewClass = "bg-primary";
                }
                
                return (
                  <div 
                    key={theme.id}
                    className={`relative overflow-hidden rounded-xl border transition-all ${
                      isSelected 
                        ? "border-primary shadow-lg transform scale-[1.02]" 
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {/* Theme preview */}
                    <div 
                      className={`h-28 sm:h-40 w-full relative overflow-hidden`}
                      style={previewStyles}
                    >
                      {/* Mock UI elements */}
                      <div className="absolute inset-0 p-2 sm:p-3 flex flex-col">
                        <div className="w-full h-4 sm:h-6 flex justify-between items-center mb-1 sm:mb-2">
                          <div className="w-12 sm:w-16 h-2 sm:h-3 rounded-full bg-white/20"></div>
                          <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-white/40"></div>
                        </div>
                        
                        <div className={`w-full h-14 sm:h-20 ${cardPreviewClass} flex flex-col p-1.5 sm:p-2 mb-1 sm:mb-2`}>
                          <div className="w-10 sm:w-12 h-1.5 sm:h-2 rounded-full bg-white/30 mb-0.5 sm:mb-1"></div>
                          <div className="w-16 sm:w-20 h-2 sm:h-3 rounded-full bg-white/40 mb-1 sm:mb-2"></div>
                          <div className="flex justify-between">
                            <div className="w-6 sm:w-8 h-1.5 sm:h-2 rounded-full bg-white/20"></div>
                            <div className="w-4 sm:w-5 h-1.5 sm:h-2 rounded-full bg-white/20"></div>
                          </div>
                          
                          {/* Progress bar specific to the theme */}
                          <div className="mt-auto w-full bg-black/20 h-1 sm:h-1.5 rounded overflow-hidden">
                            <div 
                              className={`h-full ${buttonPreviewClass}`}
                              style={{ width: '65%' }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <div className={`w-16 sm:w-20 h-4 sm:h-6 rounded-full ${buttonPreviewClass}`}></div>
                        </div>
                      </div>
                      
                      {/* Lock overlay for premium themes */}
                      {isPremiumLocked && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <div className="bg-black/50 p-1.5 sm:p-2 rounded-full">
                            <LockIcon className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Theme info */}
                    <div className="p-3 sm:p-4 bg-card border-t border-border">
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <h4 className="font-medium text-sm sm:text-base text-foreground">{theme.name}</h4>
                        {theme.isPremium && (
                          <div className="bg-amber-500/10 text-amber-500 text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex items-center">
                            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                            <span className="text-[10px] sm:text-xs">Premium</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{theme.description}</p>
                      
                      <button
                        onClick={() => updateTheme(theme.id)}
                        disabled={false} // We'll allow previews for demo
                        className={`w-full py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : isPremiumLocked
                              ? "bg-muted text-muted-foreground hover:bg-muted/80"
                              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {isSelected ? "Active" : isPremiumLocked ? "Preview" : "Apply"}
                      </button>
                    </div>
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Other settings sections */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
              <div>
                <h3 className="font-medium">Currency Format</h3>
                <p className="text-sm text-muted-foreground">Choose how currency is displayed</p>
              </div>
              <select className="bg-background border border-border rounded-lg py-2 px-4">
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
                <option value="GBP">£ (GBP)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
              <div>
                <h3 className="font-medium">Number Format</h3>
                <p className="text-sm text-muted-foreground">Choose decimal and thousands separators</p>
              </div>
              <select className="bg-background border border-border rounded-lg py-2 px-4">
                <option value="us">1,234.56</option>
                <option value="eu">1.234,56</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive important updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
              <div>
                <h3 className="font-medium">Financial Alerts</h3>
                <p className="text-sm text-muted-foreground">Get notified about budget limits</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Pro Upgrade */}
        {!isPro && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center mb-4">
                <Crown className="w-6 h-6 mr-2" />
                <h2 className="text-xl font-bold">Upgrade to Premium</h2>
              </div>
              <p className="mb-4">Get access to premium themes, advanced features, and more.</p>
              <button 
                className="bg-white text-amber-600 font-medium py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors"
                onClick={() => {
                  // For demo purposes, simulate upgrading
                  localStorage.setItem("isProUser", "true");
                  setIsPro(true);
                }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            First Million v1.0.0 • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
} 