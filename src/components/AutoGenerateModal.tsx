import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GoogleGenAI } from '@google/genai';
import { format, parseISO, addDays } from 'date-fns';
import { Sparkles, Loader2, X, ChevronRight, Save } from 'lucide-react';

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AutoGenerateModal({ isOpen, onClose }: AutoGenerateModalProps) {
  const { weeklyReports, addEntry, entries } = useAppStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [weekStartDate, setWeekStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [narrative, setNarrative] = useState('');
  
  // Generated state
  const [generatedEntries, setGeneratedEntries] = useState<any[]>([]);

  // Auto-fill when a weekly report is selected
  useEffect(() => {
    if (selectedReportId) {
      const report = weeklyReports.find(r => r.id === selectedReportId);
      if (report) {
        setWeekStartDate(report.weekStartDate);
        setNarrative(report.narrative);
      }
    }
  }, [selectedReportId, weeklyReports]);

  const handleGenerate = async () => {
    if (!narrative.trim()) {
      setError('Please provide a weekly narrative to base the daily entries on.');
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      setError('Gemini API Key is missing. Please configure it in your environment.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      
      const start = parseISO(weekStartDate);
      const end = addDays(start, 6);
      const existingEntriesThisWeek = entries.filter(e => {
        const d = parseISO(e.date);
        return d >= start && d <= end;
      });

      const existingEntriesText = existingEntriesThisWeek.length > 0 
        ? JSON.stringify(existingEntriesThisWeek.map(e => ({ date: e.date, accomplishment: e.accomplishment, workingHours: e.workingHours })), null, 2)
        : "None";

      const prompt = `You are an assistant that generates daily OJT (On-the-Job Training) narrative entries based on a weekly summary and any previously logged daily entries.
      
      Week Start Date (Monday): ${weekStartDate}
      Weekly Narrative Summary: ${narrative}
      
      Previously logged daily entries for this week:
      ${existingEntriesText}
      
      Task:
      1. Analyze the weekly narrative and the previously logged entries.
      2. Generate the missing daily entries for the work week (Monday to Friday) so that the combination of existing and new entries covers the entire weekly narrative.
      3. If there are no previously logged entries, generate all 5 daily entries (Monday to Friday).
      4. If there are existing entries, only generate entries for the missing days, ensuring the new accomplishments align with the weekly summary but don't duplicate what's already in the existing entries.
      5. IMPORTANT: Do not generate any entries for days strictly described as "Holiday" or "Absent" in the weekly narrative.
      6. STYLE: Use VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words, big vocabulary or formal corporate jargon. Keep it natural and easy to understand.
      
      Return ONLY a valid JSON array of objects representing the NEW daily entries to be added. Do not include markdown formatting like \`\`\`json.
      
      [
        {
          "date": "YYYY-MM-DD",
          "accomplishment": "string (detailed daily accomplishment)",
          "workingHours": 8,
          "problemsEncountered": "string (any problems faced, or empty string)",
          "actionTaken": "string (actions taken to solve problems, or empty string)",
          "remarks": "string (additional remarks, or empty string)"
        }
      ]`;

      const { generateContentWithRetry } = await import('@/lib/gemini');
      const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3);

      if (response.text) {
        const parsed = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
        setGeneratedEntries(parsed);
        setStep(2);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate entries. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAll = () => {
    generatedEntries.forEach(entry => {
      addEntry({
        date: entry.date,
        accomplishment: entry.accomplishment,
        workingHours: Number(entry.workingHours) || 8,
        problemsEncountered: entry.problemsEncountered || '',
        actionTaken: entry.actionTaken || '',
        remarks: entry.remarks || ''
      });
    });
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStep(1);
      setGeneratedEntries([]);
      setNarrative('');
      setSelectedReportId('');
    }, 300);
  };

  const handleEntryChange = (index: number, field: string, value: string | number) => {
    const updated = [...generatedEntries];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedEntries(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/50 rounded-t-[20px] shrink-0">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            Auto-Generate Daily Entries
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-6">
          {step === 1 ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <Label>Base on Existing Weekly Report (Optional)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                >
                  <option value="">-- Select a Weekly Report --</option>
                  {weeklyReports.map(report => (
                    <option key={report.id} value={report.id}>
                      Week of {format(parseISO(report.weekStartDate), 'MMM dd, yyyy')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Week Start Date (Monday)</Label>
                  <Input 
                    type="date" 
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Weekly Narrative / Summary</Label>
                <Textarea 
                  className="min-h-[200px]"
                  placeholder="Paste your weekly summary here. The AI will break this down into daily entries..."
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                />
              </div>

              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

              <div className="flex justify-end pt-4">
                <Button onClick={handleGenerate} disabled={isGenerating || !narrative.trim()} size="lg">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Entries
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Review and modify the generated entries before saving.</p>
                <Button variant="outline" onClick={() => setStep(1)}>Back to Edit Prompt</Button>
              </div>

              {generatedEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No new entries needed. All days for this week already have logged entries.
                </div>
              ) : (
                <div className="grid gap-6">
                  {generatedEntries.map((entry, index) => (
                    <Card key={index} className="border-primary/20 shadow-sm">
                      <CardHeader className="py-3 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                          <Input 
                            type="date" 
                            value={entry.date}
                            onChange={(e) => handleEntryChange(index, 'date', e.target.value)}
                            className="w-40 h-8 font-semibold"
                          />
                          <div className="flex items-center gap-2 ml-auto">
                            <Label className="text-xs">Hours:</Label>
                            <Input 
                              type="number" 
                              value={entry.workingHours}
                              onChange={(e) => handleEntryChange(index, 'workingHours', e.target.value)}
                              className="w-20 h-8"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 grid gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Accomplishment</Label>
                          <Textarea 
                            value={entry.accomplishment}
                            onChange={(e) => handleEntryChange(index, 'accomplishment', e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Problems Encountered</Label>
                            <Textarea 
                              value={entry.problemsEncountered}
                              onChange={(e) => handleEntryChange(index, 'problemsEncountered', e.target.value)}
                              className="min-h-[60px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Action Taken</Label>
                            <Textarea 
                              value={entry.actionTaken}
                              onChange={(e) => handleEntryChange(index, 'actionTaken', e.target.value)}
                              className="min-h-[60px]"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4 sticky bottom-0 bg-card py-4 border-t border-border">
                <Button onClick={handleSaveAll} size="lg" className="w-full sm:w-auto" disabled={generatedEntries.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  Save All {generatedEntries.length} Entries
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
