import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import GenerateWeeklyModal from '@/components/GenerateWeeklyModal';

export default function WeeklyReports() {
  const { weeklyReports, addWeeklyReport, updateWeeklyReport, deleteWeeklyReport, bulkUpdateWeeklyReports } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isGeneratingProblems, setIsGeneratingProblems] = useState(false);
  const [isBulkGeneratingProblems, setIsBulkGeneratingProblems] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
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

  const handleBulkFillMissingProblems = async () => {
    const isMissing = (text: string | undefined) => {
      if (!text) return true;
      const lower = text.trim().toLowerCase();
      // Expanded missing check
      return lower === '' || lower === 'none' || lower === 'n/a' || lower === 'na' || lower === '.' || lower === '-' || lower === '???';
    };

    const reportsMissingProblems = weeklyReports.filter(
      r => {
        const text = r.accomplishment || r.narrative || '';
        const hasAccomplishment = text.trim().length > 0;
        return hasAccomplishment && (isMissing(r.problemsEncountered) || isMissing(r.actionTaken));
      }
    );

    if (reportsMissingProblems.length === 0) {
      alert("All weekly reports already have Problems Encountered and Actions Taken!");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      alert("Gemini API Key is missing. Check your settings.");
      return;
    }

    if (!confirm(`Are you sure you want to let AI auto-fill missing problems for ${reportsMissingProblems.length} reports? This might take a few minutes.`)) {
      return;
    }

    setIsBulkGeneratingProblems(true);
    setBulkProgress({ current: 0, total: reportsMissingProblems.length });
    
    // Yield to let React render the loading screen
    await new Promise(res => setTimeout(res, 100));

    const updatedReportsList: any[] = [];

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const { generateContentWithRetry } = await import('@/lib/gemini');

      const cleanJson = (text: string) => {
        try {
          const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
          return JSON.parse(cleaned);
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          return {};
        }
      };
      
      for (let i = 0; i < reportsMissingProblems.length; i++) {
        const report = reportsMissingProblems[i];
        setBulkProgress({ current: i + 1, total: reportsMissingProblems.length });
        const prompt = `Based on the following weekly OJT accomplishments, generate a plausible "Problem Encountered" and the "Action Taken" to resolve it. Keep them brief and realistic for an internship. Use VERY SIMPLE, EASY-TO-UNDERSTAND English words. Do not use complicated words or fancy corporate jargon. If the accomplishment doesn't naturally suggest a problem, invent a minor typical one (e.g., software issue, confusion, clarification needed).

Accomplishment: "${report.accomplishment || report.narrative || ''}"

Return strictly in this JSON format without markdown:
{
  "problemsEncountered": "description of the problem...",
  "actionTaken": "how it was resolved..."
}`;
        
        try {
          const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });
          
          if (response?.text) {
            const parsed = cleanJson(response.text);
            
            const p = parsed.problemsEncountered || parsed.ProblemsEncountered || parsed['Problem Encountered'] || parsed.problem || parsed.problems || '';
            const a = parsed.actionTaken || parsed.ActionTaken || parsed['Action Taken'] || parsed.action || parsed.actions || '';
            const fallbackP = Object.values(parsed)[0] as string;
            const fallbackA = Object.values(parsed)[1] as string;

            if (p || a || Object.keys(parsed).length > 0) {
              updatedReportsList.push({
                ...report,
                problemsEncountered: p || fallbackP || '',
                actionTaken: a || fallbackA || ''
              });
            }
          }
        } catch (err) {
          console.error(`AI generation failed for weekly report starting ${report.weekStartDate}:`, err);
        }
        
        // Wait 4 seconds between calls to respect Gemini free tier limits (15 RPM)
        await new Promise(res => setTimeout(res, 4000));
      }
      
      if (updatedReportsList.length > 0) {
        bulkUpdateWeeklyReports(updatedReportsList);
        alert(`Successfully filled in problems for ${updatedReportsList.length} weekly reports!`);
      } else {
        alert("Could not generate any updates. Please check your internet connection.");
      }
    } catch (err) {
      console.error("Bulk Generation Critical Error:", err);
      alert("An error occurred during bulk generation.");
    } finally {
      setIsBulkGeneratingProblems(false);
    }
  };

  const sortedReports = [...(weeklyReports || [])]
    .filter(r => r && r.weekStartDate)
    .sort((a, b) => {
      try {
        return new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime();
      } catch (e) {
        return 0;
      }
    });

  return (
    <div className="space-y-6">
      {isBulkGeneratingProblems && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-purple-400" />
          <h3 className="text-2xl font-bold mb-2">Auto-filling Problems (AI)</h3>
          <p className="text-lg opacity-90 mb-1">
            Analyzing accomplishments and generating plausible problems...
          </p>
          <p className="text-md font-mono bg-black/40 px-4 py-1 rounded-full mt-2">
            Progress: {bulkProgress.current} / {bulkProgress.total} reports
          </p>
          <p className="text-sm opacity-70 mt-4 max-w-sm text-center">
            This takes about 4 seconds per report to ensure high-quality AI responses and respect rate limits. Please do not close this tab.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly Reports</h2>
          <p className="text-muted-foreground">Summarize your weekly progress and reflections.</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleBulkFillMissingProblems} 
            variant="outline" 
            className="text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 disabled:opacity-50"
            disabled={isBulkGeneratingProblems}
          >
            {isBulkGeneratingProblems ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isBulkGeneratingProblems ? `Filling... (${bulkProgress.current}/${bulkProgress.total})` : 'Auto-fill All Missing Problems'}
          </Button>
          <Button onClick={() => setIsAutoModalOpen(true)} className="bg-primary text-white hover:bg-primary/90">
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Generate from Daily Entries
          </Button>
        </div>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="problemsEncountered">Problems Encountered</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[10px] text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100"
                        disabled={isGeneratingProblems}
                        onClick={async () => {
                          if (!formData.accomplishment.trim()) {
                            alert("Please write your 'Accomplishment' first so the AI knows what to base the problems on.");
                            return;
                          }
                          const apiKey = process.env.GEMINI_API_KEY || '';
                          if (!apiKey) {
                            alert("Gemini API Key is missing.");
                            return;
                          }
                          setIsGeneratingProblems(true);
                          try {
                            const ai = new (await import('@google/genai')).GoogleGenAI({ apiKey: apiKey! });
                            const prompt = `Based on the following weekly OJT accomplishments, generate a plausible "Problem Encountered" and the "Action Taken" to resolve it. Keep them brief and realistic for an internship. Use VERY SIMPLE, EASY-TO-UNDERSTAND English words. Do not use complicated words or fancy corporate jargon. If the accomplishment doesn't naturally suggest a problem, invent a minor typical one (e.g., software issue, confusion, clarification needed).

Accomplishment: "${formData.accomplishment}"

Return strictly in this JSON format without markdown:
{
  "problemsEncountered": "description of the problem...",
  "actionTaken": "how it was resolved..."
}`;
                            const { generateContentWithRetry } = await import('@/lib/gemini');
                            const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });
                            if (response.text) {
                              let parsed: any = {};
                              try {
                                const cleanedText = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
                                parsed = JSON.parse(cleanedText);
                              } catch(e) {
                                const match = response.text.match(/\{[\s\S]*\}/);
                                if (match) parsed = JSON.parse(match[0]);
                              }
                              setFormData(prev => ({
                                ...prev,
                                problemsEncountered: parsed.problemsEncountered || parsed['Problem Encountered'] || parsed.problem || '',
                                actionTaken: parsed.actionTaken || parsed['Action Taken'] || parsed.action || ''
                              }));
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Failed to auto-generate.");
                          } finally {
                            setIsGeneratingProblems(false);
                          }
                        }}
                      >
                        {isGeneratingProblems ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        {isGeneratingProblems ? 'Generating...' : 'Auto-fill (AI)'}
                      </Button>
                    </div>
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
