import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Landmark, CreditCard, Building, Coins, Wallet, BanknoteIcon, PiggyBank, ArrowRightIcon, CheckIcon, AlertCircle } from "lucide-react";
import { formatCurrency, smartFormatCurrency } from "@/lib/currencyUtils";
import logoIcon from "@/assets/images/2.png";
import "@/lib/cardFlip.css"; // Import 3D card flip styles
import { 
  getTransactions, 
  getAssetTransfers, 
  saveAssetTransfer, 
  getAssets, 
  saveAssets,
  subscribe,
  Asset as StoredAsset
} from "@/lib/localStorageService";
import type { Transaction } from "@shared/schema";
import type { AssetTransfer } from "@/lib/localStorageService";

// Asset type definition for clarity
interface Asset extends StoredAsset {
  icon: JSX.Element;
}

// Map asset ID to icon component
const getAssetIcon = (id: string) => {
  switch(id) {
    case "1": return <BanknoteIcon className="w-7 h-7" />;
    case "2": return <CreditCard className="w-7 h-7" />;
    case "3": return <Wallet className="w-7 h-7" />;
    case "4": return <Building className="w-7 h-7" />;
    case "5": return <PiggyBank className="w-7 h-7" />;
    default: return <BanknoteIcon className="w-7 h-7" />;
}
};

export default function BankDetails() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Load transactions and transfers data from localStorage
  useEffect(() => {
    setTransactions(getTransactions());
    setTransfers(getAssetTransfers());
    
    // Subscribe to transaction changes
    const unsubscribeTransactions = subscribe('transactions', () => {
      setTransactions(getTransactions());
    });
    
    // Subscribe to transfer changes
    const unsubscribeTransfers = subscribe('transfers', () => {
      setTransfers(getAssetTransfers());
    });
    
    return () => {
      unsubscribeTransactions();
      unsubscribeTransfers();
    };
  }, []);
  
  // Set document title when component loads
  useEffect(() => {
    document.title = "Financial Assets | First Million";
  }, []);
  
  // Calculate total income
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);
  
  // Group income transactions by receivedIn field
  const incomeByType = transactions
    .filter(t => t.type === "income")
    .reduce((acc, transaction) => {
      const receivedIn = transaction.receivedIn || "cash"; // Default to cash if not specified
      if (!acc[receivedIn]) {
        acc[receivedIn] = 0;
      }
      acc[receivedIn] += parseFloat(transaction.amount as any);
      return acc;
    }, {} as Record<string, number>);

  // Initialize base assets from income
  const getBaseAssets = (): Asset[] => [
      { 
        id: "1", 
        name: "Bank Account", 
      balance: incomeByType["bank"] || 0,
        icon: <BanknoteIcon className="w-7 h-7" />,
        color: "from-blue-500 to-blue-600"
      },
      { 
        id: "2", 
        name: "Credit Card", 
      balance: incomeByType["card"] || 0,
        icon: <CreditCard className="w-7 h-7" />,
        color: "from-purple-500 to-purple-600"
      },
      { 
        id: "3", 
        name: "Cash", 
      balance: incomeByType["cash"] || 0,
        icon: <Wallet className="w-7 h-7" />,
        color: "from-green-500 to-green-600"
      },
      { 
        id: "4", 
        name: "Investments", 
      balance: incomeByType["assets"] || 0,
        icon: <Building className="w-7 h-7" />,
        color: "from-amber-500 to-amber-600"
      },
      { 
        id: "5", 
        name: "Savings", 
      balance: incomeByType["other"] || 0,
        icon: <PiggyBank className="w-7 h-7" />,
        color: "from-indigo-500 to-indigo-600"
      }
  ];

  // Apply transfers to assets
  const applyTransfersToAssets = (baseAssets: Asset[]): Asset[] => {
    const assetsWithTransfers = [...baseAssets];

    // Apply each transfer to modify asset balances
    transfers.forEach(transfer => {
      const sourceIndex = assetsWithTransfers.findIndex(a => a.id === transfer.sourceId);
      const destIndex = assetsWithTransfers.findIndex(a => a.id === transfer.destinationId);
      
      if (sourceIndex !== -1 && destIndex !== -1) {
        assetsWithTransfers[sourceIndex].balance -= transfer.amount;
        assetsWithTransfers[destIndex].balance += transfer.amount;
      }
    });
    
    return assetsWithTransfers;
  };

  // Load assets from localStorage or calculate them
  const loadAssets = (): Asset[] => {
    // Get stored assets first
    const storedAssets = getAssets();
    
    if (storedAssets.length > 0) {
      // Add icons to stored assets
      return storedAssets.map(asset => ({
        ...asset,
        icon: getAssetIcon(asset.id)
      }));
    }
    
    // If no stored assets, calculate from income and transfers
    const baseAssets = getBaseAssets();
    return applyTransfersToAssets(baseAssets);
  };

  // Asset state
  const [assets, setAssets] = useState<Asset[]>(loadAssets());

  // Update assets when transactions or transfers change
  useEffect(() => {
    const updatedAssets = loadAssets();
    setAssets(updatedAssets);
    
    // Save the serializable version (without React elements)
    const serializableAssets = updatedAssets.map(({ id, name, balance, color }) => ({
      id, name, balance, color
    }));
    saveAssets(serializableAssets);
  }, [transactions, transfers]);

  // Subscribe to asset changes from other components
  useEffect(() => {
    const unsubscribe = subscribe('assets', () => {
      setAssets(loadAssets());
    });
    
    return () => unsubscribe();
  }, []);
  
  // Verify total
  const totalAssets = assets.reduce((sum, asset) => sum + asset.balance, 0);

  const handleTransfer = () => {
    if (!sourceAccount || !destinationAccount || !transferAmount) return;
    
    // Reset error message
    setErrorMessage("");
    
    // Parse transfer amount safely
    const amountToTransfer = parseFloat(transferAmount);
    
    // Validate amount is a number and greater than zero
    if (isNaN(amountToTransfer) || amountToTransfer <= 0) {
      setErrorMessage("Please enter a valid amount greater than zero");
      return;
    }
    
    // Get source account balance
    const sourceAccountIndex = assets.findIndex(asset => asset.id === sourceAccount);
    const sourceBalance = assets[sourceAccountIndex]?.balance || 0;
    
    // Check if amount exceeds source balance
    if (amountToTransfer > sourceBalance) {
      setErrorMessage(`Insufficient funds. Available balance: ${formatCurrency(sourceBalance)}`);
      return;
    }
    
    setIsTransferring(true);
    
    // Process the transfer
    setTimeout(() => {
      try {
        // Get current assets
        const currentAssets = getAssets();
      
        // Find the source and destination assets
        const sourceAsset = currentAssets.find(a => a.id === sourceAccount);
        const destAsset = currentAssets.find(a => a.id === destinationAccount);
        
        if (sourceAsset && destAsset) {
          // Update the balances directly
          const updatedAssets = currentAssets.map(asset => {
            if (asset.id === sourceAccount) {
              return { ...asset, balance: asset.balance - amountToTransfer };
            }
            if (asset.id === destinationAccount) {
              return { ...asset, balance: asset.balance + amountToTransfer };
            }
            return asset;
          });
      
          // Save the updated assets
          saveAssets(updatedAssets);
        } else {
          // If assets don't exist yet (unlikely but just in case)
          // Create a record of the transfer
          saveAssetTransfer({
            sourceId: sourceAccount,
            destinationId: destinationAccount,
            amount: amountToTransfer
          });
        }
      
      setIsTransferring(false);
      setTransferComplete(true);
      
      // Play sound effect
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.log("Audio playback error:", err));
      }
      
      // Reset after showing success message
      setTimeout(() => {
        setTransferComplete(false);
        setShowTransfer(false);
        setSourceAccount("");
        setDestinationAccount("");
        setTransferAmount("");
      }, 2000);
      } catch (error) {
        console.error("Error saving transfer:", error);
        setErrorMessage("Failed to process transfer. Please try again.");
        setIsTransferring(false);
      }
    }, 1500);
  };

  // Get source account balance if selected
  const selectedSourceAccount = assets.find(asset => asset.id === sourceAccount);
  const availableBalance = selectedSourceAccount?.balance || 0;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Audio element for completion sound */}
      <audio ref={audioRef} src="/src/assets/sfx/complted.mp3" />
      
      {/* White dotted background pattern */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`, 
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto pt-6 px-4 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setLocation("/dashboard")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="w-16 h-16 flex items-center justify-center overflow-visible">
            <img 
              src={logoIcon} 
              alt="First Million Logo" 
              className="w-20 h-auto"
              style={{ objectFit: "contain", transform: "scale(1.5)", minWidth: 60, minHeight: 60 }}
            />
          </div>
        </div>
        
        {/* Title and total balance */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(124,58,237,0.5)]">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Financial Assets</h1>
          <p className="text-gray-400 mb-4 text-base">Your wealth distribution</p>
          <div className="text-4xl font-bold mb-1 text-white">{smartFormatCurrency(totalAssets)}</div>
          <p className="text-gray-400 text-sm">Total Assets</p>
        </div>
        
        {/* Asset Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
          {assets.map(asset => (
            <div 
              key={asset.id}
              className={`bg-gray-900/50 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_10px_40px_rgba(124,58,237,0.2)] transition-all duration-300 rounded-xl p-4 border border-gray-800 overflow-hidden relative ${
                (transferComplete && (asset.id === sourceAccount || asset.id === destinationAccount)) 
                  ? 'animate-pulse border-blue-500' 
                  : ''
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-10 ${asset.color}`} />
              
              <div className="flex items-center mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                  {asset.icon}
                </div>
                <h3 className="font-bold text-lg">{asset.name}</h3>
              </div>
              
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(asset.balance)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-gray-400">Available Balance</p>
                <div className="px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700">
                  {Math.round((asset.balance / totalAssets) * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Asset Distribution Chart (represented as a bar) */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2">Asset Distribution</h3>
          <div className="h-6 flex rounded-full overflow-hidden">
            {assets.map((asset, index) => (
              <div 
                key={asset.id}
                className={`h-full bg-gradient-to-r ${asset.color} transition-all duration-500`}
                style={{ width: `${(asset.balance / totalAssets) * 100}%` }}
                title={`${asset.name}: ${formatCurrency(asset.balance)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-start gap-x-4 mt-2 text-xs text-gray-400">
            {assets.map(asset => (
              <div key={asset.id} className="flex items-center">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${asset.color} mr-1`}></div>
                <span>{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Transfer Button and Dropdown */}
        <div className="mb-6">
          <button 
            onClick={() => setShowTransfer(!showTransfer)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all flex items-center justify-center"
          >
            <PiggyBank className="w-5 h-5 mr-2" />
            <span>Transfer</span>
          </button>
          
          {/* Transfer Dropdown */}
          {showTransfer && (
            <div className="mt-3 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
              {transferComplete ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                    <CheckIcon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-xl font-bold text-white mb-1">Transfer Complete!</p>
                  <p className="text-gray-400 mb-3">
                    ${parseFloat(transferAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} transferred successfully
                  </p>
                  <div className="flex items-center justify-center text-sm">
                    <div className="bg-gray-800/80 rounded-lg px-4 py-2 inline-flex items-center">
                      <span className="text-gray-400 mr-2">
                        {assets.find(a => a.id === sourceAccount)?.name} → {assets.find(a => a.id === destinationAccount)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-center text-lg font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Transfer Funds</h4>
                  
                  <div className="flex items-start justify-between mb-6">
                    {/* Source Selection */}
                    <div className="w-[40%]">
                      <label className="block text-gray-400 text-xs mb-2">From</label>
                      <div className="relative">
                        <select 
                          value={sourceAccount}
                          onChange={(e) => {
                            setSourceAccount(e.target.value);
                            setErrorMessage(""); // Clear error when changing source
                          }}
                          className="w-full appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg py-2.5 px-3 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select Source</option>
                          {assets.map(asset => (
                            <option key={`from-${asset.id}`} value={asset.id}>{asset.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Show available balance if source is selected */}
                      {sourceAccount && (
                        <div className="mt-1.5 text-xs text-blue-400">
                          Available: {formatCurrency(availableBalance)}
                        </div>
                      )}
                    </div>
                    
                    {/* Direction Icon */}
                    <div className="w-[20%] flex justify-center items-center pt-8">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 flex items-center justify-center">
                        <ArrowRightIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Destination Selection */}
                    <div className="w-[40%]">
                      <label className="block text-gray-400 text-xs mb-2">To</label>
                      <div className="relative">
                        <select 
                          value={destinationAccount}
                          onChange={(e) => setDestinationAccount(e.target.value)}
                          className="w-full appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg py-2.5 px-3 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select Destination</option>
                          {assets.map(asset => (
                            <option key={`to-${asset.id}`} value={asset.id}
                              disabled={asset.id === sourceAccount} // Prevent transferring to same account
                            >
                              {asset.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount Input */}
                  <div className="mb-4">
                    <label className="block text-gray-400 text-xs mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={transferAmount}
                        onChange={(e) => {
                          // Only allow numbers and a single decimal point
                          const value = e.target.value;
                          if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
                            setTransferAmount(value);
                            setErrorMessage(""); // Clear error when changing amount
                          }
                        }}
                        placeholder="Enter amount to transfer"
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2.5 pl-8 pr-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    </div>
                    
                    {/* Error message */}
                    {errorMessage && (
                      <div className="mt-2 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errorMessage}
                      </div>
                    )}
                  </div>
                  
                  {/* Transfer details */}
                  {sourceAccount && destinationAccount && transferAmount && !errorMessage && (
                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h5 className="text-sm font-medium mb-2 text-gray-300">Transfer Details</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-400">From:</div>
                        <div className="text-white font-medium">{assets.find(a => a.id === sourceAccount)?.name}</div>
                        
                        <div className="text-gray-400">To:</div>
                        <div className="text-white font-medium">{assets.find(a => a.id === destinationAccount)?.name}</div>
                        
                        <div className="text-gray-400">Amount:</div>
                        <div className="text-white font-medium">
                          {transferAmount ? `$${parseFloat(transferAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$0.00'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Proceed Button */}
                  <button
                    onClick={handleTransfer}
                    disabled={!sourceAccount || !destinationAccount || !transferAmount || isTransferring || !!errorMessage}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center transition-all ${
                      !sourceAccount || !destinationAccount || !transferAmount || !!errorMessage
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isTransferring ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Proceed with Transfer'
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Main Goal Card */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">Your Financial Goal</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="bg-gray-900/50 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.7)] rounded-xl p-4 border border-gray-800">
                <h4 className="font-semibold text-lg text-white mb-3">About Your Goal</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Your financial goal is displayed on the right. Track your progress and customize it to stay motivated on your journey.
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Progress Tracking</div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-300 text-sm">Based on your Savings asset</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Customization</div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-300 text-sm">Change image and colors</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Celebration</div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-gray-300 text-sm">Click the card when complete for a surprise</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-2/3">
              <MainGoalCard assets={assets} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for the Main Goal Card
function MainGoalCard({ assets }: { assets: Asset[] }) {
  const [goalType, setGoalType] = useState<string>("");
  const [goalName, setGoalName] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");
  const [customColor, setCustomColor] = useState<string>("");
  const [isEditingImage, setIsEditingImage] = useState<boolean>(false);
  const [isEditingColor, setIsEditingColor] = useState<boolean>(false);
  const [jiggling, setJiggling] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [autoJiggleActive, setAutoJiggleActive] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [newGoalType, setNewGoalType] = useState<string>("million");
  const [newGoalName, setNewGoalName] = useState<string>("Next Million");
  const [newTargetAmount, setNewTargetAmount] = useState<string>("1000000");
  const [isSubmittingNewGoal, setIsSubmittingNewGoal] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [presetImages, setPresetImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1461997307459-dd57528c622f?q=80&w=500&auto=format&fit=crop"
  ]);
  const [presetColors, setPresetColors] = useState<string[]>([
    "from-blue-500 to-blue-700",
    "from-purple-500 to-violet-700",
    "from-green-500 to-emerald-700",
    "from-amber-500 to-orange-600",
    "from-red-500 to-rose-700",
    "from-indigo-500 to-indigo-900",
    "from-teal-500 to-cyan-700",
    "from-pink-500 to-fuchsia-700"
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get the savings asset to track progress
  const savingsAsset = assets.find(asset => asset.id === "5");
  const savingsAmount = savingsAsset?.balance || 0;
  
  // Load goal data from localStorage on component mount
  useEffect(() => {
    const storedGoalType = localStorage.getItem("firstMillionGoalType") || "million";
    const storedGoalName = localStorage.getItem("firstMillionGoalName") || "First Million";
    const storedTargetAmount = localStorage.getItem("firstMillionTargetAmount") || "1000000";
    const storedCustomImage = localStorage.getItem("firstMillionGoalImage") || "";
    const storedCustomColor = localStorage.getItem("firstMillionGoalColor") || "";
    
    setGoalType(storedGoalType);
    setGoalName(storedGoalName);
    setTargetAmount(storedTargetAmount);
    setCustomImage(storedCustomImage);
    setCustomColor(storedCustomColor);
  }, []);
  
  // Calculate progress
  const target = parseFloat(targetAmount) || 1000000;
  const progress = Math.min(100, (savingsAmount / target) * 100);
  const formattedProgress = progress.toFixed(1);
  const isMillionGoal = goalType === "million";
  const isCompleted = progress >= 100;
  
  // Default background and goal images based on goal type
  const defaultBgGradient = customColor || (isMillionGoal 
    ? "from-amber-500 to-orange-600" 
    : "from-indigo-500 to-purple-600");
  
  // Default image based on goal type or name
  const getDefaultImage = () => {
    if (customImage) return customImage;
    
    // For million dollar goal, don't use default image
    if (isMillionGoal) {
      return "";
    }
    
    const goalNameLower = goalName.toLowerCase();
    if (goalNameLower.includes("car") || goalNameLower.includes("vehicle")) {
      return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=500&auto=format&fit=crop";
    }
    if (goalNameLower.includes("house") || goalNameLower.includes("home")) {
      return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop";
    }
    if (goalNameLower.includes("vacation") || goalNameLower.includes("travel")) {
      return "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=500&auto=format&fit=crop";
    }
    
    return "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=500&auto=format&fit=crop";
  };
  
  // Save custom image to localStorage
  const handleImageChange = (imageUrl: string) => {
    setCustomImage(imageUrl);
    localStorage.setItem("firstMillionGoalImage", imageUrl);
    setIsEditingImage(false);
  };
  
  // Handle image upload from device
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleImageChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save custom color to localStorage
  const handleColorChange = (color: string) => {
    setCustomColor(color);
    localStorage.setItem("firstMillionGoalColor", color);
    setIsEditingColor(false);
  };
  
  // Auto-jiggle animation for completed goals
  useEffect(() => {
    let jigglingInterval: NodeJS.Timeout;
    
    if (isCompleted && !autoJiggleActive) {
      setAutoJiggleActive(true);
      
      jigglingInterval = setInterval(() => {
        setJiggling(true);
        setTimeout(() => {
          setJiggling(false);
        }, 1000);
      }, 5000);
    }
    
    return () => {
      if (jigglingInterval) clearInterval(jigglingInterval);
    };
  }, [isCompleted, autoJiggleActive]);
  
  // Handle card click for celebration effects
  const handleCardClick = () => {
    if (isCompleted) {
      // Stop auto-jiggling when user clicks
      setAutoJiggleActive(false);
      
      if (!isFlipped) {
        setJiggling(true);
        setShowConfetti(true);
        
        // Play "spaghetti" effect (confetti) when goal is complete
        setTimeout(() => {
          setJiggling(false);
          setTimeout(() => {
            setShowConfetti(false);
          }, 3000);
        }, 1000);
      }
    }
  };
  
  // Function to flip the card to add a new goal
  const handleFlipCard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click
    
    // Only allow flipping when goal is completed
    if (isCompleted) {
      // Toggle flip state
      setIsFlipped(!isFlipped);
      
      // Reset new goal form fields if closing the form
      if (isFlipped) {
        setNewGoalType("million");
        setNewGoalName("Next Million");
        setNewTargetAmount("1000000");
      }
      
      // Show the back side of the card (the form) when flipping
      const cardContainer = document.querySelector('.card-container');
      if (cardContainer) {
        if (!isFlipped) {
          cardContainer.classList.add('flipped');
        } else {
          cardContainer.classList.remove('flipped');
        }
      }
    }
  };
  
  // Handle new goal submission
  const handleNewGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewGoal(true);
    
    // Simulate API call/processing
    setTimeout(() => {
      // Save new goal to localStorage
      localStorage.setItem("firstMillionGoalType", newGoalType);
      localStorage.setItem("firstMillionGoalName", newGoalName);
      localStorage.setItem("firstMillionTargetAmount", newTargetAmount);
      
      // Reset the savings asset to 0
      const updatedAssets = assets.map(asset => {
        if (asset.id === "5") { // Savings asset
          return { ...asset, balance: 0 };
        }
        return asset;
      });
      
      // Save updated assets (without React elements)
      const serializableAssets = updatedAssets.map(({ id, name, balance, color }) => ({
        id, name, balance, color
      }));
      saveAssets(serializableAssets);
      
      setIsSubmittingNewGoal(false);
      setShowSuccessMessage(true);
      
      // Show success message then flip card back and reload
      setTimeout(() => {
        setIsFlipped(false);
        // Reload to reflect changes
        window.location.reload();
      }, 2000);
    }, 1500);
  };
  
  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] group h-full ${jiggling ? 'animate-wiggle' : ''}`}
      onClick={handleCardClick}
    >
      {/* Flip card container */}
      <div className={`card-container ${isFlipped ? 'flipped' : ''}`}>
        {/* FRONT SIDE OF CARD */}
        <div className="card-side card-front rounded-xl overflow-hidden">
          {/* Confetti effect on completion when clicked */}
          {showConfetti && (
            <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
              <div className="confetti-container">
                {Array.from({ length: 100 }).map((_, i) => {
                  const randomX = Math.random() * 100;
                  const randomDelay = Math.random() * 3;
                  const randomSize = 5 + Math.random() * 10;
                  const randomRotation = Math.random() * 360;
                  const colors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'];
                  const randomColor = colors[Math.floor(Math.random() * colors.length)];
                  
                  return (
                    <div 
                      key={i}
                      className="confetti absolute"
                      style={{
                        left: `${randomX}%`,
                        top: '-20px',
                        width: `${randomSize}px`,
                        height: `${randomSize}px`,
                        backgroundColor: randomColor,
                        transform: `rotate(${randomRotation}deg)`,
                        animation: `fall 3s linear ${randomDelay}s`,
                        zIndex: 50
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Money bill animation for million dollar goal */}
          {isMillionGoal && (
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              {Array.from({ length: 10 }).map((_, i) => {
                const randomX = Math.random() * 100;
                const randomDelay = Math.random() * 15;
                const randomDuration = 7 + Math.random() * 8;
                
                return (
                  <div 
                    key={i}
                    className="absolute"
                    style={{
                      left: `${randomX}%`,
                      top: '-50px',
                      animation: `floatBill ${randomDuration}s linear ${randomDelay}s infinite`,
                      opacity: 0.7,
                      zIndex: i
                    }}
                  >
                    <div className="w-12 h-6 bg-green-100 rounded-sm flex items-center justify-center border border-green-800 shadow-lg transform rotate-12">
                      <span className="text-green-800 text-xs font-bold">$100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Background image with gradient overlay */}
          {getDefaultImage() ? (
            <div 
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: `url(${getDefaultImage()})` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${defaultBgGradient} opacity-80`}></div>
            </div>
          ) : (
            // Cool graphics when no image (especially for million dollar goal)
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-800 to-black overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${defaultBgGradient} opacity-80`}></div>
              <div className="grid grid-cols-8 grid-rows-8 h-full w-full opacity-20">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="border border-white/10 flex items-center justify-center"
                    style={{ 
                      animation: `pulse ${3 + (i % 5)}s infinite alternate ${i * 0.1}s`,
                      backgroundColor: `rgba(255, 255, 255, ${(i % 10) * 0.01})`
                    }}
                  >
                    {i % 8 === 0 && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Edit buttons group */}
          <div className="absolute top-4 right-4 z-30 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Edit image button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingImage(!isEditingImage);
                setIsEditingColor(false);
              }}
              className="bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/40 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            
            {/* Edit color button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingColor(!isEditingColor);
                setIsEditingImage(false);
              }}
              className="bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/40 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"></path>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </button>
          </div>
          
          {/* Hidden file input for device upload */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden"
          />
          
          {/* Image selection dropdown with scrolling */}
          {isEditingImage && (
            <div className="absolute top-14 right-4 z-30 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-gray-700 w-64 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h4 className="text-white text-sm font-medium mb-3">Choose a background image</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {presetImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleImageChange(img)}
                    className={`w-full h-16 bg-cover bg-center rounded-lg cursor-pointer hover:ring-2 ring-white/70 transition-all ${
                      img === customImage ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  ></div>
                ))}
              </div>
              <div className="mb-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload from device
                </button>
              </div>
              <div className="mb-2">
                <p className="text-white/70 text-xs mb-1">Or enter a custom URL:</p>
                <input
                  type="text"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded text-white text-xs p-2"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleImageChange(customImage)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 rounded"
                >
                  Apply
                </button>
                <button
                  onClick={() => setIsEditingImage(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs py-1.5 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Color selection dropdown */}
          {isEditingColor && (
            <div className="absolute top-14 right-4 z-30 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-gray-700 w-64 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h4 className="text-white text-sm font-medium mb-3">Choose a color theme</h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {presetColors.map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleColorChange(color)}
                    className={`h-12 rounded-lg cursor-pointer hover:ring-2 ring-white/70 transition-all ${
                      color === customColor ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    <div className={`h-full w-full rounded-lg bg-gradient-to-br ${color}`}></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomColor("")}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 rounded"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setIsEditingColor(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs py-1.5 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          {/* Card content with relative positioning */}
          <div className="relative z-10 p-6">
            <div className="flex flex-col h-full">
              {/* Goal details */}
              <div className="mb-4">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full mb-2">
                  {isMillionGoal ? "Main Goal" : "Custom Goal"}
                </span>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {goalName}
                </h2>
                <p className="text-white/80 text-sm">
                  {isMillionGoal 
                    ? "Reaching your first million is the hardest, but most rewarding milestone" 
                    : "Track your progress and reach your dream faster than you thought possible"}
                </p>
              </div>
              
              {/* Enhanced Goal progress with prettier bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{formattedProgress}% Complete</span>
                  <span className="text-white text-sm">
                    {formatCurrency(savingsAmount)} of {formatCurrency(target)}
                  </span>
                </div>
                <div className="h-3 bg-black/30 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out relative ${
                      isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  >
                    {/* Animated glow effect on the progress bar */}
                    <div className="absolute inset-0 bg-white opacity-30 animate-pulse-light"></div>
                    
                    {/* Shine effect for progress bar */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        animation: 'shimmer 2s infinite'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Estimated completion and motivation */}
              <div className="mt-auto">
                {progress < 100 ? (
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 text-white">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full p-2 bg-white/20 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Keep Going!</p>
                        <p className="text-sm text-white/70">
                          Every dollar you add to your savings gets you closer to your {goalName.toLowerCase()}.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-500/30 backdrop-blur-sm rounded-xl p-4 text-white">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full p-2 bg-white/20 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Congratulations!</p>
                        <p className="text-sm text-white/70">
                          You've reached your goal! Click this card to celebrate!
                        </p>
                      </div>
                    </div>
                    
                    {/* Swipe hint */}
                    <div className="flex items-center justify-center mt-2 mb-2">
                      <div className="relative flex items-center justify-center">
                        <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-50"></div>
                        <div className="relative inline-flex h-2 w-2 rounded-full bg-white"></div>
                      </div>
                      <span className="ml-2 text-xs text-white/70 animate-pulse">Swipe to add a new goal</span>
                      <div className="relative flex items-center justify-center ml-2">
                        <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-50"></div>
                        <div className="relative inline-flex h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                    
                    {/* Add flip button for new goal */}
                    <button
                      onClick={handleFlipCard}
                      className="w-full mt-4 bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Add New Goal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* BACK SIDE OF CARD - New Goal Form */}
        <div className="card-side card-back bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl overflow-hidden">
          <div className="relative z-10 p-6 h-full">
            <div className="flex flex-col h-full">
              <div className="mb-4 flex justify-between items-start">
                <h2 className="text-xl font-bold text-white">Set Your New Goal</h2>
                <button
                  onClick={handleFlipCard}
                  className="bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/40 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              {showSuccessMessage ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mx-auto mb-4 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Goal Created!</h3>
                    <p className="text-white/70">Your new goal has been set. Let's start this journey!</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleNewGoalSubmit} className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    {/* Goal Type Selection */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Goal Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            newGoalType === "million" 
                              ? "bg-purple-500/50 border-2 border-purple-400" 
                              : "bg-white/10 border border-white/20 hover:bg-white/20"
                          }`}
                          onClick={() => setNewGoalType("million")}
                        >
                          <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 mr-2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M16 8v5a3 3 0 0 1-6 0v-1a2 2 0 0 1 4 0"/>
                            </svg>
                            <span className="text-white text-sm font-medium">Million</span>
                          </div>
                          <p className="text-white/60 text-xs">Set your next million dollar goal</p>
                        </div>
                        
                        <div
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            newGoalType === "custom" 
                              ? "bg-purple-500/50 border-2 border-purple-400" 
                              : "bg-white/10 border border-white/20 hover:bg-white/20"
                          }`}
                          onClick={() => setNewGoalType("custom")}
                        >
                          <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 mr-2">
                              <path d="M12 6v6l4 2"/>
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                            <span className="text-white text-sm font-medium">Custom</span>
                          </div>
                          <p className="text-white/60 text-xs">Create a personalized financial goal</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Goal Name Input */}
                    <div>
                      <label htmlFor="goalName" className="block text-white text-sm font-medium mb-2">Goal Name</label>
                      <input
                        id="goalName"
                        type="text"
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter goal name"
                        required
                      />
                    </div>
                    
                    {/* Target Amount Input */}
                    <div>
                      <label htmlFor="targetAmount" className="block text-white text-sm font-medium mb-2">Target Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-white/50">$</span>
                        <input
                          id="targetAmount"
                          type="text"
                          inputMode="decimal"
                          value={newTargetAmount}
                          onChange={(e) => {
                            // Only allow numbers and a single decimal point
                            const value = e.target.value;
                            if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
                              setNewTargetAmount(value);
                            }
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-8 pr-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter target amount"
                          required
                        />
                      </div>
                      <p className="mt-1 text-white/60 text-xs">
                        Your savings will be reset to $0 when creating a new goal.
                      </p>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-auto pt-4">
                    <button
                      type="submit"
                      disabled={isSubmittingNewGoal}
                      className={`w-full py-3 rounded-lg font-medium flex items-center justify-center transition-all ${
                        isSubmittingNewGoal
                          ? 'bg-white/20 text-white/50 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg'
                      }`}
                    >
                      {isSubmittingNewGoal ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Goal...
                        </span>
                      ) : (
                        'Create New Goal'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes floatBill {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(400px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0.7;
          }
        }
        
        @keyframes pulse-light {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
        
        .confetti {
          width: 10px;
          height: 10px;
          background-color: #f00;
          position: absolute;
        }
      `}</style>
    </div>
  );
} 