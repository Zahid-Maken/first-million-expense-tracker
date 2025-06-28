import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createCategory } from "@/lib/localStorageService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getIconComponent } from "@/lib/icons.tsx";
import { 
  ShoppingBag, Home, Utensils, Car, Gamepad, ShoppingCart, Heart, GraduationCap, 
  DollarSign, Briefcase, Gift, Banknote, CreditCard, PiggyBank, Coins, TrendingUp,
  FileText, Percent, Landmark, Wallet, Sofa, Bed, Bath, Tv, Lightbulb, 
  Brush, Hammer, Wrench, Armchair, House, Beef, Cake, Coffee, Wine, Beer, 
  Carrot, Cookie, Drumstick, Fuel, Bus, Train, Plane, Bike, Ship, 
  Film, Music, Ticket, Theater, Dice1 as Dice, Book, Headphones, Guitar, Trophy, Palette, 
  Stethoscope, Pill, Building, Building2, Eye, Dumbbell, Footprints, Cross, Brain,
  Shirt, Gem, Scissors, SprayCan, Glasses, Baby, PawPrint, Laptop, Smartphone, 
  Camera, Printer, Wifi, Monitor, Keyboard, HardDrive, MessageSquare
} from "lucide-react";

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Define the type for iconCategories
interface IconOption {
  value: string;
  label: string;
}

interface IconCategories {
  [key: string]: IconOption[];
}

export default function AddCategoryModal({ open, onOpenChange, onSuccess }: AddCategoryModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    name: "",
    icon: "fas fa-shopping-bag",
    color: "#EF4444",
  });
  const [selectedIconCategory, setSelectedIconCategory] = useState("common");
  const [presetTypeProvided, setPresetTypeProvided] = useState(false);

  // Expanded icon options organized by categories
  const iconCategories: IconCategories = {
    common: [
      { value: "fas fa-shopping-bag", label: "Shopping Bag" },
      { value: "fas fa-home", label: "Home" },
      { value: "fas fa-utensils", label: "Food" },
      { value: "fas fa-car", label: "Car" },
      { value: "fas fa-gamepad", label: "Gaming" },
      { value: "fas fa-shopping-cart", label: "Cart" },
      { value: "fas fa-heartbeat", label: "Health" },
      { value: "fas fa-graduation-cap", label: "Education" },
      { value: "fas fa-dollar-sign", label: "Money" },
      { value: "fas fa-briefcase", label: "Work" },
      { value: "fas fa-gift", label: "Gift" },
    ],
    finance: [
      { value: "fas fa-money-bill", label: "Bill" },
      { value: "fas fa-credit-card", label: "Credit Card" },
      { value: "fas fa-piggy-bank", label: "Savings" },
      { value: "fas fa-coins", label: "Coins" },
      { value: "fas fa-chart-line", label: "Investments" },
      { value: "fas fa-hand-holding-usd", label: "Income" },
      { value: "fas fa-file-invoice-dollar", label: "Invoice" },
      { value: "fas fa-donate", label: "Donate" },
      { value: "fas fa-percentage", label: "Interest" },
      { value: "fas fa-landmark", label: "Bank" },
      { value: "fas fa-wallet", label: "Wallet" },
    ],
    home: [
      { value: "fas fa-couch", label: "Furniture" },
      { value: "fas fa-bed", label: "Bedroom" },
      { value: "fas fa-bath", label: "Bathroom" },
      { value: "fas fa-tv", label: "TV" },
      { value: "fas fa-lightbulb", label: "Utilities" },
      { value: "fas fa-broom", label: "Cleaning" },
      { value: "fas fa-tools", label: "Tools" },
      { value: "fas fa-hammer", label: "Repairs" },
      { value: "fas fa-chair", label: "Decor" },
      { value: "fas fa-house-user", label: "Household" },
    ],
    food: [
      { value: "fas fa-hamburger", label: "Fast Food" },
      { value: "fas fa-pizza-slice", label: "Pizza" },
      { value: "fas fa-coffee", label: "Coffee" },
      { value: "fas fa-cocktail", label: "Drinks" },
      { value: "fas fa-wine-glass-alt", label: "Wine" },
      { value: "fas fa-beer", label: "Beer" },
      { value: "fas fa-ice-cream", label: "Dessert" },
      { value: "fas fa-carrot", label: "Groceries" },
      { value: "fas fa-cookie", label: "Snacks" },
      { value: "fas fa-drumstick-bite", label: "Meat" },
    ],
    transport: [
      { value: "fas fa-car-alt", label: "Vehicle" },
      { value: "fas fa-gas-pump", label: "Fuel" },
      { value: "fas fa-oil-can", label: "Maintenance" },
      { value: "fas fa-bus", label: "Bus" },
      { value: "fas fa-train", label: "Train" },
      { value: "fas fa-subway", label: "Subway" },
      { value: "fas fa-taxi", label: "Taxi" },
      { value: "fas fa-bicycle", label: "Bicycle" },
      { value: "fas fa-plane", label: "Flights" },
      { value: "fas fa-ship", label: "Cruise" },
    ],
    entertainment: [
      { value: "fas fa-film", label: "Movies" },
      { value: "fas fa-music", label: "Music" },
      { value: "fas fa-ticket-alt", label: "Events" },
      { value: "fas fa-theater-masks", label: "Theater" },
      { value: "fas fa-dice", label: "Games" },
      { value: "fas fa-book", label: "Books" },
      { value: "fas fa-headphones", label: "Audio" },
      { value: "fas fa-guitar", label: "Instruments" },
      { value: "fas fa-bowling-ball", label: "Sports" },
      { value: "fas fa-palette", label: "Arts" },
    ],
    health: [
      { value: "fas fa-stethoscope", label: "Doctor" },
      { value: "fas fa-pills", label: "Medicine" },
      { value: "fas fa-hospital", label: "Hospital" },
      { value: "fas fa-tooth", label: "Dental" },
      { value: "fas fa-eye", label: "Vision" },
      { value: "fas fa-dumbbell", label: "Fitness" },
      { value: "fas fa-running", label: "Exercise" },
      { value: "fas fa-spa", label: "Wellness" },
      { value: "fas fa-first-aid", label: "First Aid" },
      { value: "fas fa-brain", label: "Mental Health" },
    ],
    personal: [
      { value: "fas fa-tshirt", label: "Clothing" },
      { value: "fas fa-shoe-prints", label: "Shoes" },
      { value: "fas fa-gem", label: "Jewelry" },
      { value: "fas fa-cut", label: "Haircut" },
      { value: "fas fa-spray-can", label: "Cosmetics" },
      { value: "fas fa-glasses", label: "Eyewear" },
      { value: "fas fa-shopping-bag", label: "Accessories" },
      { value: "fas fa-baby", label: "Baby" },
      { value: "fas fa-paw", label: "Pets" },
      { value: "fas fa-gift", label: "Gifts" },
    ],
    technology: [
      { value: "fas fa-laptop", label: "Computer" },
      { value: "fas fa-mobile-alt", label: "Phone" },
      { value: "fas fa-headphones", label: "Audio" },
      { value: "fas fa-gamepad", label: "Gaming" },
      { value: "fas fa-camera", label: "Camera" },
      { value: "fas fa-print", label: "Printer" },
      { value: "fas fa-wifi", label: "Internet" },
      { value: "fas fa-tv", label: "TV" },
      { value: "fas fa-keyboard", label: "Peripherals" },
      { value: "fas fa-hdd", label: "Storage" },
    ],
    income: [
      { value: "fas fa-briefcase", label: "Salary" },
      { value: "fas fa-hand-holding-usd", label: "Bonus" },
      { value: "fas fa-chart-line", label: "Investments" },
      { value: "fas fa-comments-dollar", label: "Freelance" },
      { value: "fas fa-gift", label: "Gifts" },
      { value: "fas fa-money-check-alt", label: "Refunds" },
      { value: "fas fa-piggy-bank", label: "Savings" },
      { value: "fas fa-home", label: "Rental" },
      { value: "fas fa-donate", label: "Donations" },
      { value: "fas fa-coins", label: "Side Hustle" },
    ],
  };

  // Listen for preset category type events
  useEffect(() => {
    const handlePresetCategoryType = (event: CustomEvent<{ type: "income" | "expense" }>) => {
      if (open && event.detail && (event.detail.type === "income" || event.detail.type === "expense")) {
        setFormData(prev => ({ 
          ...prev, 
          type: event.detail.type,
          icon: event.detail.type === "income" ? 
            iconCategories.income[0].value : 
            iconCategories.common[0].value
        }));
        
        setSelectedIconCategory(event.detail.type === "income" ? "income" : "common");
        setPresetTypeProvided(true);
      }
    };

    window.addEventListener('preset-category-type', handlePresetCategoryType as EventListener);
    
    return () => {
      window.removeEventListener('preset-category-type', handlePresetCategoryType as EventListener);
    };
  }, [open, iconCategories]);

  // Extended color palette with more options
  const colorOptions = [
    // Reds
    "#EF4444", "#DC2626", "#B91C1C", "#991B1B", "#7F1D1D",
    // Oranges
    "#F97316", "#EA580C", "#C2410C", "#9A3412", "#7C2D12",
    // Yellows
    "#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F",
    // Greens
    "#10B981", "#059669", "#047857", "#065F46", "#064E3B",
    // Blues
    "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A",
    // Purples
    "#8B5CF6", "#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95",
    // Pinks
    "#EC4899", "#DB2777", "#BE185D", "#9D174D", "#831843",
    // Teals
    "#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63",
    // Lime
    "#84CC16", "#65A30D", "#4D7C0F", "#3F6212", "#365314",
    // Indigo
    "#6366F1", "#4F46E5", "#4338CA", "#3730A3", "#312E81",
  ];

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      // Reset state when modal closes
      setPresetTypeProvided(false);
      setFormData({
        type: "expense",
        name: "",
        icon: "fas fa-shopping-bag",
        color: "#EF4444",
      });
      setSelectedIconCategory("common");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create category in localStorage
      createCategory({
        ...formData,
        userEmail: 'local@user.com'
      });
      
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      
      // Reset form and close modal
      setFormData({
        type: "expense",
        name: "",
        icon: "fas fa-shopping-bag",
        color: "#EF4444",
      });
      
      // Call onSuccess to refresh data
      if (onSuccess) onSuccess();
      
      handleOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current icon display
  const getSelectedIconDisplay = () => {
    for (const category in iconCategories) {
      const icon = iconCategories[category].find(i => i.value === formData.icon);
      if (icon) return icon.label;
    }
    return "Select an icon";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-xl font-bold">Add Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your finances.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <form id="category-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* Category Type Selector - Only show if not preset */}
            {!presetTypeProvided && (
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Category Type</Label>
                <Tabs 
              value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value as "income" | "expense" })}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                  </TabsList>
                </Tabs>
          </div>
            )}

            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Category Name</Label>
            <Input
              id="name"
                placeholder="Enter category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-sm"
              required
            />
          </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Icon</Label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  <div style={{ color: formData.color }}>
                    {getIconComponent(formData.icon)}
                  </div>
                </div>
                <div className="text-sm font-medium">{getSelectedIconDisplay()}</div>
              </div>
              <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
                <div className="flex w-max space-x-2 p-2">
                  {Object.keys(iconCategories).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedIconCategory(category)}
                      className={`rounded-md px-3 py-1.5 text-xs ${
                        selectedIconCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <ScrollArea className="h-40 rounded-lg border p-2">
                <TooltipProvider>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                    {iconCategories[selectedIconCategory].map((icon) => (
                      <Tooltip key={icon.value} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: icon.value })}
                            className={`flex h-12 w-12 items-center justify-center rounded-lg hover:bg-muted/80 ${
                              formData.icon === icon.value ? "bg-muted ring-2 ring-primary" : ""
                            }`}
                          >
                            <div style={{ color: formData.color }}>
                              {getIconComponent(icon.value)}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{icon.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </ScrollArea>
          </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Color</Label>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                    className={`w-7 h-7 rounded-full transition-all ${
                      formData.color === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                    aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    <div style={{ color: formData.color }}>
                      {getIconComponent(formData.icon)}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{formData.name || "Category Name"}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {formData.type} Category
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <DialogFooter className="p-4 sm:p-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
          >
              Cancel
            </Button>
          <Button 
            type="submit"
            form="category-form"
            disabled={isSubmitting} 
            className="bg-gradient-to-r from-primary to-indigo-600"
          >
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
