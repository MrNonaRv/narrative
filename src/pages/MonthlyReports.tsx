import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import GenerateMonthlyModal from '@/components/GenerateMonthlyModal';

export default function MonthlyReports() {
  const { monthlyReports, addMonthlyReport, updateMonthlyReport, deleteMonthlyReport, bulkUpdateMonthlyReports } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isGeneratingProblems, setIsGeneratingProblems] = useState(false);
  const [isBulkGeneratingProblems, setIsBulkGeneratingProblems] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  const today = new Date();
  const [formData, setFormData] = useState({
    month: format(today, 'yyyy-MM'),
    accomplishment: '',
    problemsEncountered: '',
    actionTaken: '',
    remarks: '',
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
    setFormData({
      month: format(today, 'yyyy-MM'),
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

    const reportsMissingProblems = monthlyReports.filter(
      r => {
        const hasAccomplishment = (r.accomplishment || r.narrative) && (r.accomplishment || r.narrative).trim().length > 0;
        return hasAccomplishment && (isMissing(r.problemsEncountered) || isMissing(r.actionTaken));
      }
    );

    if (reportsMissingProblems.length === 0) {
      alert("All monthly reports already have Problems Encountered and Actions Taken!");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      alert("Gemini API Key is missing. Check your settings.");
      return;
    }

    if (!confirm(`Are you sure you want to let AI auto-fill missing problems for ${reportsMissingProblems.length} monthly reports? This might take a few minutes.`)) {
      return;
    }

    setIsBulkGeneratingProblems(true);
    setBulkProgress({ current: 0, total: reportsMissingProblems.length });
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
        const accomplishment = report.accomplishment || report.narrative || '';
        const prompt = `Based on the following monthly OJT accomplishments summary, generate plausible "Problems Encountered" and "Actions Taken" to resolve them. Keep them brief and realistic for an internship. Use VERY SIMPLE, EASY-TO-UNDERSTAND English words. Do not use complicated words or fancy corporate jargon.

Accomplishments Summary: "${accomplishment}"

Return strictly in this JSON format without markdown:
{
  "problemsEncountered": "description of the problem...",
  "actionTaken": "how it was resolved..."
}`;
        
        try {
          const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });
          
          if (response?.text) {
            const parsed = cleanJson(response.text);
            
            if (parsed.problemsEncountered || parsed.actionTaken || parsed['Problem Encountered']) {
              updatedReportsList.push({
                ...report,
                problemsEncountered: parsed.problemsEncountered || parsed['Problem Encountered'] || parsed.problem || '',
                actionTaken: parsed.actionTaken || parsed['Action Taken'] || parsed.action || ''
              });
            }
          }
        } catch (err) {
          console.error(`AI generation failed for monthly report ${report.month}:`, err);
        }
        
        // Wait 4 seconds between calls to respect Gemini free tier limits (15 RPM)
        await new Promise(res => setTimeout(res, 4000));
      }
      
      if (updatedReportsList.length > 0) {
        bulkUpdateMonthlyReports(updatedReportsList);
        alert(`Successfully filled in problems for ${updatedReportsList.length} monthly reports!`);
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

  const sortedReports = [...monthlyReports].sort((a, b) => b.month.localeCompare(a.month));

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
          <h2 className="text-2xl font-bold tracking-tight">Monthly Reports</h2>
          <p className="text-muted-foreground">Summarize your monthly progress and reflections.</p>
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accomplishment">Accomplishment</Label>
                    <Textarea 
                      id="accomplishment" 
                      required
                      className="min-h-[100px]"
                      placeholder="Summarize activities and accomplishments for this month"
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
                            const prompt = `Based on the following monthly OJT accomplishments, generate a plausible "Problem Encountered" and the "Action Taken" to resolve it. Keep them brief and realistic for an internship. Use VERY SIMPLE, EASY-TO-UNDERSTAND English words. Do not use complicated words or fancy corporate jargon. If the accomplishment doesn't naturally suggest a problem, invent a minor typical one (e.g., software issue, confusion, clarification needed).

Accomplishment: "${formData.accomplishment}"

Return strictly in this JSON format without markdown:
{
  "problemsEncountered": "description of the problem...",
  "actionTaken": "how it was resolved..."
}`;
                            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json" } });
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
                      placeholder="Any issues or challenges?"
                      value={formData.problemsEncountered}
                      onChange={(e) => setFormData({...formData, problemsEncountered: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actionTaken">Action Taken</Label>
                    <Textarea 
                      id="actionTaken" 
                      className="min-h-[80px]"
                      placeholder="How were the problems addressed?"
                      value={formData.actionTaken}
                      onChange={(e) => setFormData({...formData, actionTaken: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input 
                      id="remarks" 
                      placeholder="Additional notes"
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    />
                  </div>
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
                      <span className="font-medium text-gray-900">Accomplishment / Narrative:</span>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap leading-relaxed">{report.accomplishment || report.narrative}</p>
                    </div>
                    {report.problemsEncountered && (
                      <div>
                        <span className="font-medium text-gray-900">Problems Encountered:</span>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{report.problemsEncountered}</p>
                      </div>
                    )}
                    {report.actionTaken && (
                      <div>
                        <span className="font-medium text-gray-900">Action Taken:</span>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{report.actionTaken}</p>
                      </div>
                    )}
                    {report.remarks && (
                      <div>
                        <span className="font-medium text-gray-900">Remarks:</span>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{report.remarks}</p>
                      </div>
                    )}
                    
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
