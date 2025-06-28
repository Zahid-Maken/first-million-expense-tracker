import { User as UserIcon, Mail, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface UserProfileProps {
  compact?: boolean; // For smaller display in certain locations
  showEdit?: boolean; // Whether to show edit button
  onEdit?: () => void; // Optional callback when edit button clicked
}

export default function UserProfile({ compact = false, showEdit = false, onEdit }: UserProfileProps) {
  const { user: supabaseUser } = useSupabaseAuth();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  useEffect(() => {
    // Get user name and email from localStorage
    const storedName = localStorage.getItem("firstMillionUserName");
    const storedEmail = localStorage.getItem("firstMillionUserEmail");
    
    if (storedName) {
      setUserName(storedName);
    }
    
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);
  
  // Determine display name and email with priority order
  const displayName = userName || 
                      supabaseUser?.email?.split('@')[0] || 
                      'User';
                      
  const displayEmail = supabaseUser?.email || 
                       userEmail || 
                       '';

  if (compact) {
    return (
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-full shadow-sm">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <div className="ml-2 flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {displayName}
          </p>
          {displayEmail && (
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
          <UserIcon className="w-8 h-8 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Mail className="w-4 h-4 mr-1" />
            <span>{displayEmail || "No email"}</span>
          </div>
        </div>
      </div>
      
      {showEdit && onEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );
} 