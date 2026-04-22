import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, parseISO, subDays, eachDayOfInterval, startOfWeek } from 'date-fns';

export default function Progress() {
  const { entries } = useAppStore();
  const today = new Date();
  
  // Default to last 30 days
  const [startDate, setStartDate] = useState(format(subDays(today, 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [viewType, setViewType] = useState<'cumulative' | 'daily' | 'weekly'>('cumulative');

  const chartData = useMemo(() => {
    if (!startDate || !endDate) return { daily: [], weekly: [], dayOfWeek: [] };

    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      // Ensure start is before end
      if (start > end) return { daily: [], weekly: [], dayOfWeek: [] };

      const days = eachDayOfInterval({ start, end });
      
      // Calculate starting cumulative hours (hours before startDate)
      let cumulative = entries
        .filter(e => e.date < startDate)
        .reduce((sum, e) => sum + (Number(e.workingHours) || 0), 0);

      const weeklyMap = new Map<string, number>();
      const dowMap = new Map<number, { total: number; count: number }>();
      for (let i = 0; i < 7; i++) dowMap.set(i, { total: 0, count: 0 });

      const daily = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = entries.find(e => e.date === dateStr);
        const hours = entry ? (Number(entry.workingHours) || 0) : 0;

        cumulative += hours;

        // Weekly aggregation
        const weekStart = format(startOfWeek(day, { weekStartsOn: 1 }), 'MMM dd');
        weeklyMap.set(weekStart, (weeklyMap.get(weekStart) || 0) + hours);

        // Day of week aggregation
        const dow = day.getDay();
        const dowData = dowMap.get(dow)!;
        if (entry) {
          dowData.total += hours;
          dowData.count += 1;
        }

        return {
          date: format(day, 'MMM dd'),
          fullDate: dateStr,
          hours,
          cumulativeHours: cumulative
        };
      });

      const weekly = Array.from(weeklyMap.entries()).map(([name, hours]) => ({ name, hours }));

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = Array.from(dowMap.entries()).map(([dow, data]) => ({
        name: dayNames[dow],
        avgHours: data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 0
      }));

      return { daily, weekly, dayOfWeek };
    } catch (e) {
      return { daily: [], weekly: [], dayOfWeek: [] };
    }
  }, [entries, startDate, endDate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'cumulativeHours' ? 'Total Hours' : 'Hours'}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Progress Visualization</h2>
        <p className="text-muted-foreground">Analyze your OJT hours and trends over time.</p>
      </div>

      <div className="grid grid-cols-4 gap-5 auto-rows-[minmax(155px,auto)] flex-1">
        
        {/* Controls */}
        <Card className="col-span-4 lg:col-span-4 row-span-1 flex flex-col justify-center">
          <CardContent className="pt-6 pb-6 flex flex-wrap items-end gap-6">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Data Point</Label>
              <div className="flex bg-muted p-1 rounded-lg border border-border">
                {(['cumulative', 'daily', 'weekly'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setViewType(type)}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md capitalize transition-colors ${
                      viewType === type 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Chart */}
        <Card className="col-span-4 lg:col-span-3 row-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>
              {viewType === 'cumulative' && 'Cumulative Hours Trend'}
              {viewType === 'daily' && 'Daily Hours Logged'}
              {viewType === 'weekly' && 'Weekly Hours Comparison'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'cumulative' ? (
                <AreaChart data={chartData.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cumulativeHours" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                </AreaChart>
              ) : viewType === 'daily' ? (
                <BarChart data={chartData.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={chartData.weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Secondary Stats / Chart */}
        <Card className="col-span-4 lg:col-span-1 row-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Avg Hours by Day</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.dayOfWeek} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--color-muted-foreground)'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} />
                <Tooltip cursor={{fill: 'var(--color-muted)'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--color-border)'}} />
                <Bar dataKey="avgHours" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
