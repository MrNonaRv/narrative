import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Pencil, Trash2, Sparkles } from 'lucide-react';
import GenerateWeeklyModal from '@/components/GenerateWeeklyModal';

export default function WeeklyReports() {
  const { weeklyReports, addWeeklyReport, updateWeeklyReport, deleteWeeklyReport } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  
  const today = new Date();
  const initialStart = startOfWeek(today, { weekStartsOn: 1 });
  const initialEnd = addDays(initialStart, 4); // Friday

  const [formData, setFormData] = useState({
    weekStartDate: format(initialStart, 'yyyy-MM-dd'),
    weekEndDate: format(initialEnd, 'yyyy-MM-dd'),
    accomplishment: '',
    problemsEncountered: '',
    actionTaken: '',
    remarks: '',
    commentsAndSuggestions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      updateWeeklyReport(currentId, formData);
    } else {
      addWeeklyReport(formData);
    }
    resetForm();
  };

  const editReport = (report: any) => {
    setFormData({
      weekStartDate: report.weekStartDate,
      weekEndDate: report.weekEndDate,
      accomplishment: report.accomplishment || report.narrative || '',
      problemsEncountered: report.problemsEncountered || '',
      actionTaken: report.actionTaken || '',
      remarks: report.remarks || '',
      commentsAndSuggestions: report.commentsAndSuggestions || ''
    });
    setCurrentId(report.id);
    setIsEditing(true);
  };

  const resetForm = () => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = addDays(start, 4);
    setFormData({
      weekStartDate: format(start, 'yyyy-MM-dd'),
      weekEndDate: format(end, 'yyyy-MM-dd'),
      accomplishment: '',
      problemsEncountered: '',
      actionTaken: '',
      remarks: '',
      commentsAndSuggestions: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const sortedReports = [...weeklyReports].sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly Reports</h2>
          <p className="text-muted-foreground">Summarize your weekly progress and reflections.</p>
        </div>
        <Button onClick={() => setIsAutoModalOpen(true)} className="bg-primary text-white hover:bg-primary/90">
          <Sparkles className="w-4 h-4 mr-2" />
          Auto-Generate from Daily Entries
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Weekly Report' : 'New Weekly Report'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      required
                      value={formData.weekStartDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const date = parseISO(newStart);
                        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                        const weekEnd = addDays(weekStart, 4);
                        setFormData({
                          ...formData, 
                          weekStartDate: format(weekStart, 'yyyy-MM-dd'),
                          weekEndDate: format(weekEnd, 'yyyy-MM-dd')
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      required
                      value={formData.weekEndDate}
                      onChange={(e) => setFormData({...formData, weekEndDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-auto pr-2 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="accomplishment">Accomplishment</Label>
                    <Textarea 
                      id="accomplishment" 
                      required
                      className="min-h-[100px]"
                      placeholder="Summarize activities and accomplishments"
                      value={formData.accomplishment}
                      onChange={(e) => setFormData({...formData, accomplishment: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="problemsEncountered">Problems Encountered</Label>
                    <Textarea 
                      id="problemsEncountered" 
                      className="min-h-[80px]"
                      placeholder="Any problems this week?"
                      value={formData.problemsEncountered}
                      onChange={(e) => setFormData({...formData, problemsEncountered: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actionTaken">Action Taken</Label>
                    <Textarea 
                      id="actionTaken" 
                      className="min-h-[80px]"
                      placeholder="How did you solve them?"
                      value={formData.actionTaken}
                      onChange={(e) => setFormData({...formData, actionTaken: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input 
                      id="remarks" 
                      placeholder="Additional remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="comments">Comments & Suggestions (Optional)</Label>
                    <Textarea 
                      id="comments" 
                      placeholder="Feedback for the host establishment or facilitator"
                      value={formData.commentsAndSuggestions}
                      onChange={(e) => setFormData({...formData, commentsAndSuggestions: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button type="submit" className="flex-1">
                    {isEditing ? 'Update' : 'Save'} Report
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {sortedReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No weekly reports yet. Start by adding one on the left.
              </CardContent>
            </Card>
          ) : (
            sortedReports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Week of {format(parseISO(report.weekStartDate), 'MMM d')} - {format(parseISO(report.weekEndDate), 'MMM d, yyyy')}
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => editReport(report)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteWeeklyReport(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm mt-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-900 block mb-1">Accomplishment:</span>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{report.accomplishment || report.narrative}</p>
                      </div>
                      
                      <div className="space-y-4">
                        {report.problemsEncountered && (
                          <div>
                            <span className="font-medium text-gray-900 block mb-1">Problems Encountered:</span>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.problemsEncountered}</p>
                          </div>
                        )}
                        {report.actionTaken && (
                          <div>
                            <span className="font-medium text-gray-900 block mb-1">Action Taken:</span>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.actionTaken}</p>
                          </div>
                        )}
                        {report.remarks && (
                          <div>
                            <span className="font-medium text-gray-900 block mb-1">Remarks:</span>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {report.commentsAndSuggestions && (
                      <div className="border-t pt-2 mt-2">
                        <span className="font-medium text-gray-900 block mb-1">Comments & Suggestions:</span>
                        <p className="text-gray-700 whitespace-pre-wrap">{report.commentsAndSuggestions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <GenerateWeeklyModal 
        isOpen={isAutoModalOpen} 
        onClose={() => setIsAutoModalOpen(false)} 
      />
    </div>
  );
}
