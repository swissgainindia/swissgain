import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, Eye, FileText } from 'lucide-react';

interface ReportsContentProps {
  reports: any[];
}

export function ReportsContent({ reports }: ReportsContentProps) {
  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>
                Download detailed reports of your earnings and performance
              </CardDescription>
            </div>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Generate New Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports?.map((report: any) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">{report.title}</CardTitle>
              <CardDescription>
                {report.type} Report • {report.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Period:</span>
                  <span>{report.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Generated:</span>
                  <span>{report.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant="default">Ready</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>
            Create a custom report with specific date ranges and metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <select
                  id="reportType"
                  className="w-full p-2 border rounded-lg bg-background"
                  defaultValue="earnings"
                >
                  <option value="earnings">Earnings Report</option>
                  <option value="performance">Performance Report</option>
                  <option value="affiliate">Affiliate Sales</option>
                  <option value="referral">Referral Activity</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateRange">Date Range</Label>
                <select
                  id="dateRange"
                  className="w-full p-2 border rounded-lg bg-background"
                  defaultValue="last-month"
                >
                  <option value="last-week">Last Week</option>
                  <option value="last-month">Last Month</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="last-year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="format">Format</Label>
                <select
                  id="format"
                  className="w-full p-2 border rounded-lg bg-background"
                  defaultValue="pdf"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV File</option>
                </select>
              </div>
              <div>
                <Label htmlFor="metrics">Include Metrics</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Earnings Breakdown</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Conversion Rates</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Performance Trends</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}