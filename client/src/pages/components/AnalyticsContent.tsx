// components/dashboard/AnalyticsContent.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function AnalyticsContent({ data, affiliateEarnings, referralEarnings, timeframe, setTimeframe }: any) {
  const totalAffiliate = affiliateEarnings?.reduce((s: number, e: any) => s + e.amount, 0) || 0;
  const totalReferral = referralEarnings?.reduce((s: number, e: any) => s + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Earnings Analytics</CardTitle>
              <CardDescription>Track your earnings performance over time</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {['weekly', 'monthly', 'yearly'].map((t) => (
                <Button
                  key={t}
                  variant={timeframe === t ? 'default' : 'outline'}
                 size="sm"
                  onClick={() => setTimeframe(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center border rounded-lg bg-muted/50">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Earnings Overview</h3>
              <p className="text-muted-foreground mb-4">
                {timeframe === 'monthly' ? 'Monthly' : timeframe === 'yearly' ? 'Yearly' : 'Weekly'} earnings summary
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Affiliate Earnings:</span>
                  <span className="font-medium">₹{totalAffiliate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Referral Earnings:</span>
                  <span className="font-medium">₹{totalReferral}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span>Total Earnings:</span>
                  <span className="font-medium text-green-600">₹{totalAffiliate + totalReferral}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Performance</CardTitle>
            <CardDescription>Sales and conversion metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span className="text-sm">Total Sales</span><span className="font-medium">{data.earnings?.totalSales || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm">Conversion Rate</span><span className="font-medium">12.5%</span></div>
            <div className="flex justify-between"><span className="text-sm">Avg. Commission</span><span className="font-medium">₹100.00</span></div>
            <div className="flex justify-between"><span className="text-sm">Top Product</span><span className="font-medium">Neckchain</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Performance</CardTitle>
            <CardDescription>Referral and signup metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span className="text-sm">Total Referrals</span><span className="font-medium">{data.earnings?.totalReferrals || 0}</span></div>
            <div className="flex justify-between"><span className="text-sm">Signup Rate</span><span className="font-medium">8.3%</span></div>
            <div className="flex justify-between"><span className="text-sm">Avg. Bonus</span><span className="font-medium">₹299.90</span></div>
            <div className="flex justify-between"><span className="text-sm">Active Referrers</span><span className="font-medium">3</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}