import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, ExternalLink } from 'lucide-react';

const BASE_URL = 'https://tools.eiduktaxandwealth.com/downloads';

interface DownloadFile {
  name: string;
  filename: string;
  description: string;
}

const excelWorkbooks: DownloadFile[] = [
  {
    name: 'Accountable Plan Expense Report',
    filename: 'accountable-plan-expense-report.xlsx',
    description: 'Track and document business expenses for accountable plan reimbursements.',
  },
  {
    name: 'Client Expense Tracker',
    filename: 'client-expense-tracker.xlsx',
    description: 'Comprehensive expense tracking for client-related business expenses.',
  },
  {
    name: 'FMC Child Timesheet',
    filename: 'fmc-child-timesheet.xlsx',
    description: 'Time tracking for Family Management Company child employment.',
  },
  {
    name: 'Home Office Tracker',
    filename: 'home-office-tracker.xlsx',
    description: 'Calculate and document home office deduction expenses.',
  },
  {
    name: 'HUD Tool - Investor',
    filename: 'hud-tool-investor.xlsx',
    description: 'HUD statement analysis tool for real estate investors.',
  },
  {
    name: 'Rental Property P&L Complete',
    filename: 'rental-property-pl-complete.xlsx',
    description: 'Full profit and loss tracking for rental properties.',
  },
  {
    name: 'REP Material Participation Daily Log',
    filename: 'rep-material-participation-daily-log.xlsx',
    description: 'Daily activity log for Real Estate Professional material participation.',
  },
  {
    name: 'STR Material Participation Log',
    filename: 'str-material-participation-log.xlsx',
    description: 'Activity tracking for Short-Term Rental material participation requirements.',
  },
];

export default function Downloads() {
  const handleDownload = (filename: string) => {
    window.open(`${BASE_URL}/${filename}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Downloads
            </h1>
            <p className="text-muted-foreground mt-1">
              Excel workbooks and tools for tax planning and documentation
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open(BASE_URL, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View All on Website
          </Button>
        </div>

        {/* Excel Workbooks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Excel Workbooks
            </CardTitle>
            <CardDescription>
              {excelWorkbooks.length} downloadable tools and templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {excelWorkbooks.map((file) => (
                <div
                  key={file.filename}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {file.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {file.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-4 gap-2 shrink-0"
                    onClick={() => handleDownload(file.filename)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
