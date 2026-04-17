import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, Sparkles } from 'lucide-react';
import GenerateMonthlyModal from '@/components/GenerateMonthlyModal';

export default function MonthlyReports() {
  const { monthlyReports, addMonthlyReport, updateMonthlyReport, deleteMonthlyReport } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  
  const today = new Date();
  const [formData, setFormData] = useState({
    month: format(today, 'yyyy-MM'),
    narrative: '',
    commentsAndSuggestions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      updateMonthlyReport(currentId, formData);
    } else {
      addMonthlyReport(formData);
    }
    resetForm();
  };

  const editReport = (report: any) => {
    setFormData({
      month: report.month,
      narrative: report.narrative,
      commentsAndSuggestions: report.commentsAndSuggestions
    });
    setCurrentId(report.id);
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({
      month: format(today, 'yyyy-MM'),
      narrative: '',
      commentsAndSuggestions: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const sortedReports = [...monthlyReports].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monthly Reports</h2>
          <p className="text-muted-foreground">Summarize your monthly progress and reflections.</p>
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
              <CardTitle>{isEditing ? 'Edit Monthly Report' : 'New Monthly Report'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input 
                    id="month" 
                    type="month" 
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="narrative">Monthly Narrative / Reflection</Label>
                  <Textarea 
                    id="narrative" 
                    required
                    className="min-h-[200px]"
                    placeholder="Summarize your overall experience, key achievements, and growth during this month."
                    value={formData.narrative}
                    onChange={(e) => setFormData({...formData, narrative: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments & Suggestions</Label>
                  <Textarea 
                    id="comments" 
                    placeholder="Any feedback for the host establishment or facilitator?"
                    value={formData.commentsAndSuggestions}
                    onChange={(e) => setFormData({...formData, commentsAndSuggestions: e.target.value})}
                  />
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
                No monthly reports yet. Start by adding one on the left.
              </CardContent>
            </Card>
          ) : (
            sortedReports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Month of {format(parseISO(`${report.month}-01`), 'MMMM yyyy')}
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => editReport(report)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteMonthlyReport(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Narrative:</span>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap leading-relaxed">{report.narrative}</p>
                    </div>
                    
                    {report.commentsAndSuggestions && (
                      <div>
                        <span className="font-medium text-gray-900">Comments & Suggestions:</span>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{report.commentsAndSuggestions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <GenerateMonthlyModal 
        isOpen={isAutoModalOpen} 
        onClose={() => setIsAutoModalOpen(false)} 
      />
    </div>
  );
}
