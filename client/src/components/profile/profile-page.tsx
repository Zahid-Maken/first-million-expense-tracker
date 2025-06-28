import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Settings, 
  Target, 
  RotateCcw,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Building,
  PiggyBank,
  ArrowLeft,
  Trash2,
  RefreshCw
} from "lucide-react";

interface ProfileData {
  userName: string;
  monthlyIncome: string;
  targetAmount: string;
  investmentGoal: string;
}

interface ProfilePageProps {
  profileData: ProfileData;
  onUpdateProfile: (data: ProfileData) => void;
  onReset: (resetType: 'all' | 'values' | 'investments' | 'business') => void;
  onBack: () => void;
  totalInvestments: number;
  totalBusinessInvestments: number;
  totalTransactions: number;
  categoriesCount: number;
}

export default function ProfilePage({ 
  profileData, 
  onUpdateProfile, 
  onReset, 
  onBack,
  totalInvestments,
  totalBusinessInvestments,
  totalTransactions,
  categoriesCount
}: ProfilePageProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profileData);
  const [showResetOptions, setShowResetOptions] = useState(false);

  const progress = Math.min((totalInvestments / parseFloat(profileData.targetAmount)) * 100, 100);

  const handleSave = () => {
    onUpdateProfile(formData);
    setEditMode(false);
  };

  const resetOptions = [
    {
      id: 'all',
      title: 'Complete Reset',
      description: 'Reset everything - all transactions, investments, business records, and categories',
      icon: <RotateCcw className="w-5 h-5" />,
      color: 'bg-destructive',
      items: ['All transactions', 'All investments', 'All business records', 'All categories', 'All values']
    },
    {
      id: 'values',
      title: 'Values Only',
      description: 'Reset only transaction and investment amounts, keep categories',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-warning',
      items: ['Transaction values', 'Investment values', 'Business values']
    },
    {
      id: 'investments',
      title: 'Investments Reset',
      description: 'Reset only investment portfolio values',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-info',
      items: ['Stock investments', 'Crypto investments', 'Investment values']
    },
    {
      id: 'business',
      title: 'Business Reset',
      description: 'Reset only business investment records',
      icon: <Building className="w-5 h-5" />,
      color: 'bg-violet-500',
      items: ['Business investments', 'Business profits', 'Business records']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Profile & Settings</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {editMode ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Profile Card */}
        <Card className="border-0 shadow-card bg-gradient-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profileData.userName}</h2>
                <p className="text-white/80">Future Millionaire</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/80 text-sm">Progress to First Million</span>
                  <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/70 text-sm">Target Goal</p>
                  <p className="font-bold text-white">${parseFloat(profileData.targetAmount).toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-white/70 text-sm">Monthly Income</p>
                  <p className="font-bold text-white">${parseFloat(profileData.monthlyIncome || "0").toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        {editMode && (
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Edit Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userName">Name</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount ($)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="investmentGoal">Investment Focus</Label>
                <Input
                  id="investmentGoal"
                  value={formData.investmentGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, investmentGoal: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Your Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-2xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">${totalInvestments.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Investments</p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-4 text-center">
                <Building className="w-8 h-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">${totalBusinessInvestments.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Business Investments</p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-4 text-center">
                <DollarSign className="w-8 h-8 text-info mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalTransactions}</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-4 text-center">
                <PiggyBank className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{categoriesCount}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset Options */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Reset & Rebirth Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showResetOptions ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Reset your financial data for a fresh start. Choose what to reset carefully.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowResetOptions(true)}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Show Reset Options
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {resetOptions.map((option) => (
                  <div key={option.id} className="border border-border rounded-2xl p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className={`w-10 h-10 ${option.color} rounded-2xl flex items-center justify-center text-white`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{option.title}</h4>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Will reset:</p>
                      <div className="flex flex-wrap gap-1">
                        {option.items.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to ${option.title.toLowerCase()}? This action cannot be undone.`)) {
                          onReset(option.id as any);
                          setShowResetOptions(false);
                        }
                      }}
                      className="w-full border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {option.title}
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => setShowResetOptions(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}