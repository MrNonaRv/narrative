import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GoogleGenAI } from '@google/genai';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Sparkles, Loader2, X, ChevronRight, Save } from 'lucide-react';

interface GenerateWeeklyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateWeeklyModal({ isOpen, onClose }: GenerateWeeklyModalProps) {
  const { entries, addWeeklyReport } = useAppStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const initialStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const [startDate, setStartDate] = useState(format(initialStart, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(initialStart, 4), 'yyyy-MM-dd'));
  
  // Generated state
  const [generatedReport, setGeneratedReport] = useState({
    accomplishment: '',
    problemsEncountered: '',
    actionTaken: '',
    remarks: '',
    commentsAndSuggestions: ''
  });

  const handleGenerate = async () => {
    if (!process.env.GEMINI_API_KEY) {
      setError('Gemini API Key is missing. Please configure it in your environment.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      const existingEntriesThisPeriod = entries.filter(e => {
        const d = parseISO(e.date);
        return d >= start && d <= end;
      });

      if (existingEntriesThisPeriod.length === 0) {
        throw new Error('No daily entries found for this date range. Please log some daily entries first.');
      }

      const entriesText = JSON.stringify(
        existingEntriesThisPeriod.map(e => ({ 
          date: e.date, 
          accomplishment: e.accomplishment, 
          problemsEncountered: e.problemsEncountered,
          actionTaken: e.actionTaken
        })), 
        null, 2
      );

      const prompt = `You are an assistant that generates a short and simple Weekly OJT (On-the-Job Training) journal report based on a student's daily entries.
      
      Date Range: ${startDate} to ${endDate}
      
      Daily Entries for this period:
      ${entriesText}
      
      Task:
      1. Analyze the daily entries provided.
      2. Write a short, simple, and concise "Accomplishment" summary combining the main tasks completed.
      3. Write a short "Problems Encountered" summary of the week's challenges. If none, say "None".
      4. Write a short "Action Taken" summary. If none, say "N/A".
      5. Provide an empty string "" for "remarks" unless there is something highly specific to remark.
      6. Write a brief "Comments & Suggestions" section (e.g., feedback or self-improvement notes). Keep it to 1 sentence.
      7. IMPORTANT: Do not include or mention any days marked as "Holiday", "Absent", or entries with 0 working hours in your task summaries.
      
      Return ONLY a valid JSON object. Do not include markdown formatting.
      
      {
        "accomplishment": "string",
        "problemsEncountered": "string",
        "actionTaken": "string",
        "remarks": "string",
        "commentsAndSuggestions": "string"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        setGeneratedReport({
          accomplishment: parsed.accomplishment || parsed.narrative || '',
          problemsEncountered: parsed.problemsEncountered || '',
          actionTaken: parsed.actionTaken || '',
          remarks: parsed.remarks || '',
          commentsAndSuggestions: parsed.commentsAndSuggestions || ''
        });
        setStep(2);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    addWeeklyReport({
      weekStartDate: startDate,
      weekEndDate: endDate,
      accomplishment: generatedReport.accomplishment,
      problemsEncountered: generatedReport.problemsEncountered,
      actionTaken: generatedReport.actionTaken,
      remarks: generatedReport.remarks,
      commentsAndSuggestions: generatedReport.commentsAndSuggestions
    });
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStep(1);
      setGeneratedReport({ 
        accomplishment: '', 
        problemsEncountered: '',
        actionTaken: '',
        remarks: '',
        commentsAndSuggestions: '' 
      });
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/50 rounded-t-[20px] shrink-0">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            Auto-Generate Weekly Report
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-6">
          {step === 1 ? (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  Select a date range. The AI will analyze your existing daily entries for that period and generate a short, simple weekly narrative.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const date = parseISO(newStart);
                      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                      const weekEnd = addDays(weekStart, 4);
                      setStartDate(format(weekStart, 'yyyy-MM-dd'));
                      setEndDate(format(weekEnd, 'yyyy-MM-dd'));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md">{error}</div>}

              <div className="flex justify-end pt-4">
                <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Daily Entries...
                    </>
                  ) : (
                    <>
                      Generate Weekly Report
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Review and modify the generated report before saving.</p>
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-auto pr-2">
                <div className="space-y-2">
                  <Label>Accomplishment Summary</Label>
                  <Textarea 
                    className="min-h-[100px] leading-relaxed"
                    value={generatedReport.accomplishment}
                    onChange={(e) => setGeneratedReport({...generatedReport, accomplishment: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Problems Encountered</Label>
                  <Textarea 
                    className="min-h-[80px]"
                    value={generatedReport.problemsEncountered}
                    onChange={(e) => setGeneratedReport({...generatedReport, problemsEncountered: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Action Taken</Label>
                  <Textarea 
                    className="min-h-[80px]"
                    value={generatedReport.actionTaken}
                    onChange={(e) => setGeneratedReport({...generatedReport, actionTaken: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Input 
                    value={generatedReport.remarks}
                    onChange={(e) => setGeneratedReport({...generatedReport, remarks: e.target.value})}
                  />
                </div>
                <div className="space-y-2 border-t pt-4">
                  <Label>Comments & Suggestions</Label>
                  <Textarea 
                    className="min-h-[80px]"
                    value={generatedReport.commentsAndSuggestions}
                    onChange={(e) => setGeneratedReport({...generatedReport, commentsAndSuggestions: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 sticky bottom-0 bg-card py-4 border-t border-border">
                <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Weekly Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
