// Updated ReferEarn Component (UI remains mostly same, but fix total % to 24.4 and amount to ₹732)
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateReferralLink } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Handshake, DollarSign, Link as LinkIcon, Copy, Share2, Users, TrendingUp, ArrowRight, Zap, Target, BarChart3, InfoIcon, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
export default function ReferEarn() {
  const { data, updateData } = useLocalStorage();
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState(data.referralLink || '');
  const [activeTab, setActiveTab] = useState(1);
  const commissionLevels = [
    { level: 1, commission: "10%", amount: "₹299.90", color: "from-blue-500 to-blue-600", people: 5 },
    { level: 2, commission: "5%", amount: "₹149.95", color: "from-green-500 to-green-600", people: 25 },
    { level: 3, commission: "2.5%", amount: "₹74.98", color: "from-amber-500 to-amber-600", people: 125 },
    { level: 4, commission: "2%", amount: "₹59.98", color: "from-purple-500 to-purple-600", people: 625 },
    { level: 5, commission: "1.5%", amount: "₹44.99", color: "from-pink-500 to-pink-600", people: 3125 },
    { level: 6, commission: "1%", amount: "₹29.99", color: "from-indigo-500 to-indigo-600", people: 15625 },
    { level: 7, commission: "0.8%", amount: "₹23.99", color: "from-orange-500 to-orange-600", people: 78125 },
    { level: 8, commission: "0.6%", amount: "₹17.99", color: "from-teal-500 to-teal-600", people: 390625 },
    { level: 9, commission: "0.5%", amount: "₹14.99", color: "from-rose-500 to-rose-600", people: 1953125 },
    { level: 10, commission: "0.5%", amount: "₹14.99", color: "from-cyan-500 to-cyan-600", people: 9765625 }
  ];
  const totalCommission = 24.4; // ✅ FIXED: Corrected from 34.4% to actual sum 24.4%
  const totalAmount = "₹731.76"; // ✅ FIXED: Corrected calculation
  const handleGenerateLink = () => {
    const newLink = generateReferralLink();
    setReferralLink(newLink);
    updateData(data => ({ ...data, referralLink: newLink }));
    toast({
      title: "Referral Link Generated!",
      description: "Your unique referral link has been created.",
    });
  };
  const handleCopyLink = async () => {
    if (!referralLink) {
      toast({
        title: "No Link Available",
        description: "Please generate a referral link first.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };
  const handleShareLink = async () => {
    if (!referralLink) {
      toast({
        title: "No Link Available",
        description: "Please generate a referral link first.",
        variant: "destructive",
      });
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SwissGain Affiliate Program',
          text: 'Join SwissGain and start earning with premium jewelry sales!',
          url: referralLink
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };
  // Get the active level details
  const activeLevel = commissionLevels.find(level => level.level === activeTab);
  return (
    <div className="py-12 bg-gradient-to-b from-muted/20 to-muted/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ... other sections remain the same ... */}
           <div className="text-center mb-12">
                  <Badge variant="outline" className="mb-4 py-1 px-3 text-primary font-semibold">
                    Multi-Level Commission
                  </Badge>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Refer & Earn Program</h1>
                  <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Refer new affiliates and earn up to {totalCommission}% total commission across 10 levels when your referrals make purchases.
                  </p>
                </div>
       
                {/* How It Works Section */}
                <div className="mb-16">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-foreground mb-3">How The Referral Program Works</h2>
                    <p className="text-muted-foreground text-lg">A step-by-step guide to earning through our multi-level commission system</p>
                  </div>
                 
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <Card className="text-center border-0 shadow-md bg-gradient-to-b from-blue-50 to-white">
                          <CardContent className="p-6">
                            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-4">
                              <div className="font-bold">1</div>
                            </div>
                            <UserPlus className="h-10 w-10 text-primary mx-auto mb-4" />
                            <CardTitle className="text-lg mb-3">Share Your Link</CardTitle>
                            <CardDescription>
                              Share your unique referral link with friends, family, and social networks.
                            </CardDescription>
                          </CardContent>
                        </Card>
       
                        <Card className="text-center border-0 shadow-md bg-gradient-to-b from-amber-50 to-white">
                          <CardContent className="p-6">
                            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-4">
                              <div className="font-bold">2</div>
                            </div>
                            <Handshake className="h-10 w-10 text-primary mx-auto mb-4" />
                            <CardTitle className="text-lg mb-3">They Join & Pay</CardTitle>
                            <CardDescription>
                              Your referral pays ₹999 membership fee and buys a ₹2999 product to activate.
                            </CardDescription>
                          </CardContent>
                        </Card>
       
                        <Card className="text-center border-0 shadow-md bg-gradient-to-b from-green-50 to-white">
                          <CardContent className="p-6">
                            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-4">
                              <div className="font-bold">3</div>
                            </div>
                            <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                            <CardTitle className="text-lg mb-3">You Earn Commission</CardTitle>
                            <CardDescription>
                              Earn ₹299.90 (10%) from their purchase, plus commissions from their network across 10 levels.
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </div>
       
                      <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          Important Note
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          To qualify for commissions, your referral must first pay the ₹999 membership fee AND purchase at least one product worth ₹2999.
                          You'll then earn commissions on all their future purchases and the purchases of everyone in their downline across 10 levels.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
        {/* Commission Structure Section - Updated with Sidebar Tabs */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Multi-Level Commission Structure</h2>
            <p className="text-muted-foreground text-lg">Earn from up to 10 levels of your referral network with every purchase</p>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Commission</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{totalCommission}%</h3>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <Progress value={totalCommission} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Per Sale Value</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{totalAmount}</h3>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Based on ₹2999 sale</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Network Levels</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">10</h3>
                  </div>
                  <div className="bg-purple-500/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Deep earning potential</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Max Potential</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">∞</h3>
                  </div>
                  <div className="bg-amber-500/10 p-2 rounded-full">
                    <Target className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Unlimited earnings</p>
              </CardContent>
            </Card>
          </div>
          {/* Sidebar Tabs Commission Levels */}
          <Card className="border-0 shadow-lg mb-10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Commission Breakdown (₹2999 Sale)</CardTitle>
              <CardDescription>
                Select a level to see detailed information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Sidebar with tabs */}
                <div className="w-full md:w-1/3 bg-muted/30 p-4">
                  <div className="space-y-2">
                    {commissionLevels.map((level) => (
                      <div
                        key={level.level}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                          activeTab === level.level
                            ? `bg-gradient-to-r ${level.color} text-white shadow-md`
                            : 'bg-white hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveTab(level.level)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 ${
                              activeTab === level.level
                                ? 'bg-white/20 text-white'
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {level.level}
                            </div>
                            <div>
                              <h3 className="font-semibold">Level {level.level}</h3>
                              <p className={`text-sm ${
                                activeTab === level.level ? 'opacity-90' : 'text-muted-foreground'
                              }`}>
                                {level.commission} Commission
                              </p>
                            </div>
                          </div>
                          <div className="font-semibold">
                            {level.amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Content area */}
                <div className="w-full md:w-2/3 p-6">
                  {activeLevel && (
                    <>
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold mb-2">Level {activeLevel.level} Details</h3>
                        <div className="h-2 w-full bg-gradient-to-r from-primary to-primary rounded-full mb-4"></div>
                        <p className="text-muted-foreground">
                          This level represents the {activeLevel.level}
                          {activeLevel.level === 1 ? 'st' :
                           activeLevel.level === 2 ? 'nd' :
                           activeLevel.level === 3 ? 'rd' : 'th'}
                          tier in your referral network.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Commission Rate</p>
                          <p className="text-2xl font-bold text-foreground">{activeLevel.commission}</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Amount per Sale</p>
                          <p className="text-2xl font-bold text-foreground">{activeLevel.amount}</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Network Size</p>
                          <p className="text-2xl font-bold text-foreground">{activeLevel.people.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                        <p className="font-semibold mb-2">Potential Earnings:</p>
                        <p className="text-2xl text-primary font-bold">
                          ₹{(activeLevel.people * parseFloat(activeLevel.amount.replace('₹', '').replace(',', ''))).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Based on {activeLevel.people.toLocaleString()} people making ₹2999 purchases
                        </p>
                      </div>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          How This Level Works
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          You earn {activeLevel.commission} ({activeLevel.amount}) on every ₹2999 purchase made by
                          anyone at Level {activeLevel.level} in your network. This includes people referred by your
                          referrals {activeLevel.level > 1 ? `(and their referrals${activeLevel.level > 2 ? ', and so on' : ''})` : ''}.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="p-6 border-t">
                <div className="bg-muted p-6 rounded-xl">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Commission Flow Explanation
                  </h3>
                 
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary rounded-full p-1 mt-1 flex-shrink-0">
                        <ArrowRight className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-sm">
                        When someone in your network makes a ₹2999 purchase, you earn 10% (₹299.90) as a Level 1 commission.
                      </p>
                    </div>
                   
                    <div className="flex items-start gap-3">
                      <div className="bg-primary rounded-full p-1 mt-1 flex-shrink-0">
                        <ArrowRight className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-sm">
                        When someone referred by your referral makes a purchase, you earn 5% (₹149.95) as a Level 2 commission.
                      </p>
                    </div>
                   
                    <div className="flex items-start gap-3">
                      <div className="bg-primary rounded-full p-1 mt-1 flex-shrink-0">
                        <ArrowRight className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-sm">
                        This continues through 10 levels, with decreasing percentages but increasing potential as your network grows.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    * Potential earnings based on exponential network growth with 5 referrals per person and all making ₹2999 purchases.
                    Actual results will vary based on your referral efforts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* ... rest of the component remains the same, including Referral Link, Earnings Potential, Current Stats ... */}
         {/* Your Referral Link Section */}
        {/* <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Your Referral Link</h2>
            <p className="text-muted-foreground text-lg">Generate and share your unique referral link to start earning</p>
          </div>
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardContent className="p-8 space-y-6">
              {referralLink ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="flex-1"
                      data-testid="input-referral-link"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-copy-referral"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button
                      onClick={handleShareLink}
                      className="flex-1 gradient-primary text-primary-foreground"
                      data-testid="button-share-referral"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Link
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateLink}
                  className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                  data-testid="button-generate-link"
                >
                  <LinkIcon className="mr-2 h-5 w-5" />
                  Generate My Referral Link
                </Button>
              )}
             
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Pro Tip
                </h4>
                <p className="text-sm text-muted-foreground">
                  Share your link on social media, with friends, and in communities interested in jewelry businesses.
                  The more people you refer, the more you earn through multiple levels!
                </p>
              </div>
            </CardContent>
          </Card>
        </div> */}
        {/* Earnings Potential - Updated for accuracy */}
        <div className="bg-gradient-to-r from-primary to-primary rounded-2xl p-8 text-white text-center mb-12">
          <h3 className="text-2xl font-bold mb-4">Unlimited Earning Potential!</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            There's no limit to how much you can earn. The more you refer, the more you make through multiple levels!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold mb-1" data-testid="text-earnings-5-referrals">₹1,499.5</div>
              <p className="text-sm text-blue-100">5 Direct Referrals (Level 1 only)</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold mb-1" data-testid="text-earnings-10-referrals">₹2,999</div>
              <p className="text-sm text-blue-100">10 Direct Referrals (Level 1 only)</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold mb-1" data-testid="text-earnings-20-referrals">₹5,998</div>
              <p className="text-sm text-blue-100">20 Direct Referrals (Level 1 only)</p>
            </div>
          </div>
         
          <p className="text-blue-200 text-sm">
            * Plus additional earnings from multi-level commissions on all purchases in your network (total ~24.4% per sale)
          </p>
        </div>
        {/* Current Stats */}
        {/* <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">Your Referral Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-total-referrals">
                  {data.earnings?.totalReferrals || 0}
                </div>
                <p className="text-muted-foreground">Total Referrals</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent mb-2" data-testid="text-referral-earnings">
                  ₹{(data.earnings?.referralEarnings || 0).toLocaleString()}
                </div>
                <p className="text-muted-foreground">Referral Earnings</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-pending-referrals">
                  {data.earnings?.pendingReferrals || 0}
                </div>
                <p className="text-muted-foreground">Pending Referrals</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent mb-2" data-testid="text-avg-monthly">
                  ₹{Math.round((data.earnings?.referralEarnings || 0) / Math.max(1, new Date().getMonth() + 1)).toLocaleString()}
                </div>
                <p className="text-muted-foreground">Avg. Monthly</p>
              </CardContent>
            </Card>
          </div>
        </div> */}
      </div>
    </div>
  );
}