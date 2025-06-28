import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Target, PieChart } from "lucide-react";

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-dark mb-4">
            First Million
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your path to wealth through smart financial tracking. 
            <span className="block mt-2 font-semibold text-primary">
              Increase income, decrease expenses, and invest the gap.
            </span>
          </p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
            onClick={onGetStarted}
          >
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Income</h3>
              <p className="text-gray-600 text-sm">
                Monitor all your income sources and see your earning potential grow
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-danger" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manage Expenses</h3>
              <p className="text-gray-600 text-sm">
                Categorize and control your spending with smart budgeting tools
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Investment Tracking</h3>
              <p className="text-gray-600 text-sm">
                Monitor stocks, crypto, and business investments in one place
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Set Goals</h3>
              <p className="text-gray-600 text-sm">
                Create budgets and track progress toward your financial milestones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Principle Section */}
        <Card className="max-w-4xl mx-auto mb-16">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-dark mb-6">
              The Path to Your First Million
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-secondary">1. Increase Income</h3>
                <p className="text-gray-600">
                  Track and optimize all revenue streams. Find new opportunities to grow your earnings.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
                  <PieChart className="w-10 h-10 text-danger" />
                </div>
                <h3 className="text-xl font-semibold text-danger">2. Decrease Expenses</h3>
                <p className="text-gray-600">
                  Identify unnecessary spending and optimize your budget for maximum savings.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-accent">3. Invest the Gap</h3>
                <p className="text-gray-600">
                  Put your savings to work through smart investments to build long-term wealth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-dark mb-4">
            Ready to start your wealth journey?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of users who are already building their first million
          </p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
            onClick={onGetStarted}
          >
            Start Tracking Now
          </Button>
        </div>
      </div>
    </div>
  );
}
