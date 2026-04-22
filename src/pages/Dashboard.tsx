import React from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export default function Dashboard() {
  const { profile, entries } = useAppStore();

  const totalHours = entries.reduce((sum, entry) => sum + entry.workingHours, 0);
  const progressPercentage = Math.min(100, Math.round((totalHours / (profile?.requiredHours || 486)) * 100)) || 0;

  // Group entries by week for the chart
  const chartData = React.useMemo(() => {
    const weeks = new Map<string, number>();
    
    entries.forEach(entry => {
      const date = parseISO(entry.date);
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const weekLabel = format(start, 'MMM dd');
      
      weeks.set(weekLabel, (weeks.get(weekLabel) || 0) + entry.workingHours);
    });

    return Array.from(weeks.entries()).map(([name, hours]) => ({ name, hours }));
  }, [entries]);

  return (
    <div className="grid grid-cols-4 gap-5 auto-rows-[minmax(155px,auto)] h-full">
      {/* Daily Narrative Editor / Recent entries */}
      <Card className="col-span-4 lg:col-span-2 row-span-2 flex flex-col">
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle>Recent Entries</CardTitle>
          <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">
            {entries.length} Total
          </span>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto flex flex-col gap-3">
          {entries.slice(-3).reverse().map(entry => (
            <div key={entry.id} className="bg-muted border border-dashed border-border rounded-xl p-4 text-[15px] leading-relaxed">
              <div className="font-semibold text-sm mb-2 text-foreground">{format(parseISO(entry.date), 'MMM dd, yyyy')}</div>
              <div className="text-foreground">{entry.accomplishment}</div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-muted-foreground text-sm text-center py-8">No entries yet.</div>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      <Card className="col-span-4 lg:col-span-2 row-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>Weekly Velocity Tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-2">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="hours" fill="var(--color-primary)" radius={[6, 6, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <Card className="col-span-4 lg:col-span-1 row-span-2">
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 p-3.5 bg-muted border border-border rounded-xl font-medium cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-6 text-red-500 font-bold text-xs">PDF</div>
            <div className="text-sm">Formal Executive</div>
          </div>
          <div className="flex items-center gap-2.5 p-3.5 bg-muted border border-border rounded-xl font-medium cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-6 text-green-500 font-bold text-xs">CSV</div>
            <div className="text-sm">Raw Data Log</div>
          </div>
          <div className="flex items-center gap-2.5 p-3.5 bg-muted border border-border rounded-xl font-medium cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-6 text-blue-500 font-bold text-xs">JSON</div>
            <div className="text-sm">Developer Sync</div>
          </div>
        </CardContent>
      </Card>

      {/* Template Manager */}
      <Card className="col-span-4 lg:col-span-1 row-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>Custom Templates</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-border">
            <span className="text-[13px]">Exec Summary</span>
            <span className="text-[11px] px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">Active</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-border">
            <span className="text-[13px]">Casual Daily</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-border">
            <span className="text-[13px]">Project Focus</span>
          </div>
          <div className="mt-auto text-xs text-primary font-semibold cursor-pointer pt-4">
            + Create New Template
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats Snapshot */}
      <Card className="col-span-4 lg:col-span-2 row-span-1 flex flex-row justify-around items-center py-6">
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-primary">{totalHours}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Hours</div>
        </div>
        <div className="w-px h-10 bg-border"></div>
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-primary">{progressPercentage}%</div>
          <div className="text-xs text-muted-foreground mt-1">Progress</div>
        </div>
        <div className="w-px h-10 bg-border"></div>
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-primary">{entries.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Days Logged</div>
        </div>
        <div className="w-px h-10 bg-border"></div>
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-primary">{entries.length > 0 ? (totalHours / entries.length).toFixed(1) : 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Avg Hours/Day</div>
        </div>
      </Card>
    </div>
  );
}
