import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { 
  format, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Clock, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function CalendarView() {
  const { entries, addEntry, updateEntry, deleteEntry, profile } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleExportExcel = () => {
    if (entries.length === 0) {
      alert("No data to export.");
      return;
    }

    // Prepare data in the same format as the import template
    const exportData = [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        'Date': entry.date,
        'Accomplishment': entry.accomplishment,
        'Working Hours': entry.workingHours,
        'Problems Encountered': entry.problemsEncountered || '',
        'Action Taken': entry.actionTaken || '',
        'Remarks': entry.remarks || ''
      }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Entries');
    XLSX.writeFile(wb, `OJT_Daily_Entries_Backup_${(profile?.name || 'Student').replace(/\s+/g, '_')}.xlsx`);
  };
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present' as 'present' | 'holiday' | 'absent',
    accomplishment: '',
    workingHours: 8,
    problemsEncountered: '',
    actionTaken: '',
    remarks: ''
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = 'MMMM yyyy';

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDayClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const existingEntry = entries.find(e => e.date === dayStr);
    
    setSelectedDate(day);
    
    if (existingEntry) {
      setFormData({
        date: existingEntry.date,
        status: existingEntry.status || 'present',
        accomplishment: existingEntry.accomplishment,
        workingHours: existingEntry.workingHours,
        problemsEncountered: existingEntry.problemsEncountered || '',
        actionTaken: existingEntry.actionTaken || '',
        remarks: existingEntry.remarks || ''
      });
      setCurrentId(existingEntry.id);
      setIsEditing(true);
    } else {
      setFormData({
        date: dayStr,
        status: 'present',
        accomplishment: '',
        workingHours: 8,
        problemsEncountered: '',
        actionTaken: '',
        remarks: ''
      });
      setCurrentId(null);
      setIsEditing(false);
    }
    
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      updateEntry(currentId, formData);
    } else {
      addEntry(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (currentId) {
      setEntryToDelete(currentId);
    }
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
      setEntryToDelete(null);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">View and manage your daily notes visually.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportExcel} className="hidden sm:flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
          <div className="flex items-center space-x-4 ml-4">
          <Button variant="outline" onClick={prevMonth} size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold w-40 text-center">
            {format(currentMonth, dateFormat)}
          </div>
          <Button variant="outline" onClick={nextMonth} size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

      <Card className="flex-1 flex flex-col min-h-0 bg-white shadow-sm border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 shrink-0 rounded-t-xl">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {calendarDays.map((day, i) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const entry = entries.find(e => e.date === dayStr);
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-2 cursor-pointer transition-colors relative hover:bg-muted/50",
                  !isSelectedMonth && "bg-muted/20 text-muted-foreground/50 opacity-40 hover:opacity-100",
                  isWeekend && "bg-gray-50/50",
                  (i + 1) % 7 === 0 && "border-r-0"
                )}
              >
                <div className="flex justify-between items-start mb-1 gap-1">
                  <span className={cn(
                    "text-sm font-medium h-7 flex items-center justify-center rounded-full whitespace-nowrap px-1.5",
                    isTodayDate ? "bg-primary text-primary-foreground" : ""
                  )}>
                    {(!isSelectedMonth || day.getDate() === 1) ? format(day, 'MMM d') : format(day, 'd')}
                  </span>
                  {entry && (
                    <div className="flex gap-1 flex-col items-end shrink-0">
                      {(entry.status === 'holiday' || entry.status === 'absent') && (
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                          entry.status === 'holiday' ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"
                        )}>
                          {entry.status === 'holiday' ? 'Holiday' : 'Absent'}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.workingHours}h
                      </span>
                    </div>
                  )}
                </div>
                
                {entry && (
                  <div className="mt-2 text-xs overflow-hidden text-gray-600 line-clamp-3 leading-tight">
                    {entry.accomplishment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/50 rounded-t-xl shrink-0 py-4">
              <CardTitle className="text-lg">
                {isEditing ? 'Edit Entry' : 'Add Entry'} - {selectedDate && format(selectedDate, 'MMM d, yyyy')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="calendarDate">Date</Label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[10px] px-2 rounded-full"
                        onClick={() => {
                          const dt = new Date();
                          dt.setDate(dt.getDate() - 1);
                          setFormData({...formData, date: format(dt, 'yyyy-MM-dd')});
                          setSelectedDate(dt);
                        }}
                      >
                        Yesterday
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[10px] px-2 rounded-full"
                        onClick={() => {
                          const dt = new Date();
                          setFormData({...formData, date: format(dt, 'yyyy-MM-dd')});
                          setSelectedDate(dt);
                        }}
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                  <Input 
                    id="calendarDate"
                    type="date" 
                    value={formData.date}
                    onChange={(e) => {
                      const newDateStr = e.target.value;
                      setFormData({...formData, date: newDateStr});
                      setSelectedDate(parseISO(newDateStr));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.status}
                    onChange={(e) => {
                      const status = e.target.value as 'present' | 'holiday' | 'absent';
                      if (status !== 'present') {
                        setFormData({...formData, status, workingHours: 0, accomplishment: status === 'holiday' ? 'Holiday' : 'Absent (Leave)'});
                      } else {
                        setFormData({...formData, status, workingHours: 8, accomplishment: (formData.accomplishment === 'Holiday' || formData.accomplishment === 'Absent (Leave)') ? '' : formData.accomplishment});
                      }
                    }}
                  >
                    <option value="present">Present (Working)</option>
                    <option value="holiday">Holiday</option>
                    <option value="absent">Absent / Leave</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.5" 
                    required
                    value={formData.workingHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData({...formData, workingHours: isNaN(val) ? 0 : val});
                    }}
                    disabled={formData.status !== 'present'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Daily Accomplishment</Label>
                  <Textarea 
                    required
                    className="min-h-[100px]"
                    placeholder="What did you do today?"
                    value={formData.accomplishment}
                    onChange={(e) => setFormData({...formData, accomplishment: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Problems (Optional)</Label>
                    <Textarea 
                      className="min-h-[60px] text-sm"
                      value={formData.problemsEncountered}
                      onChange={(e) => setFormData({...formData, problemsEncountered: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Action Taken (Optional)</Label>
                    <Textarea 
                      className="min-h-[60px] text-sm"
                      value={formData.actionTaken}
                      onChange={(e) => setFormData({...formData, actionTaken: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                  {isEditing ? (
                    <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  ) : (
                    <div /> // Spacer
                  )}
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Entry
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="border-b border-border bg-muted/50 rounded-t-xl py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Entry
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEntryToDelete(null)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm">
                Are you sure you want to delete this log entry? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEntryToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete Forever
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
