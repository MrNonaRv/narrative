import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GoogleGenAI } from '@google/genai';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Sparkles, Loader2, X, ChevronRight, Save } from 'lucide-react';

interface GenerateMonthlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateMonthlyModal({ isOpen, onClose }: GenerateMonthlyModalProps) {
  const { entries, addMonthlyReport } = useAppStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Generated state
  const [generatedReport, setGeneratedReport] = useState({
    narrative: '',
    commentsAndSuggestions: ''
  });

  const handleGenerate = async () => {
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
      
      const start = startOfMonth(parseISO(`${month}-01`));
      const end = endOfMonth(start);
      
      const existingEntriesThisPeriod = entries.filter(e => {
        const d = parseISO(e.date);
        return d >= start && d <= end;
      });

      if (existingEntriesThisPeriod.length === 0) {
        throw new Error('No daily entries found for this month. Please log some daily entries first.');
      }

      const entriesText = JSON.stringify(
        existingEntriesThisPeriod.map(e => ({ 
          date: e.date, 
          accomplishment: e.accomplishment, 
          problemsEncountered: e.problemsEncountered,
          actionTaken: e.actionTaken
        }))
      );

      const prompt = `You are an assistant that generates a short and simple Monthly OJT (On-the-Job Training) narrative report based on a student's daily entries.
      
      Month: ${format(start, 'MMMM yyyy')}
      
      Daily Entries for this period:
      ${entriesText}
      
      Task:
      1. Analyze the daily entries provided.
      2. Write a short, simple, and concise "Monthly Narrative / Reflection" summarizing the main accomplishments, learnings, and challenges for the entire month. Keep it brief (2-3 short paragraphs maximum).
      3. Write a brief "Comments & Suggestions" section (e.g., feedback or self-improvement notes). Keep it to 1-2 sentences.
      4. IMPORTANT: Do not include or mention any days marked as "Holiday", "Absent", or entries with 0 working hours in your narrative summarizing the accomplishments. Focus only on actual work done.
      5. STYLE: Use VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words, big vocabulary or formal corporate jargon. Keep it natural and easy to understand.
      
      Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
      
      {
        "narrative": "string (Short and simple narrative summary)",
        "commentsAndSuggestions": "string (Brief comments and suggestions)"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
        setGeneratedReport({
          narrative: parsed.narrative || '',
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
    addMonthlyReport({
      month: month,
      narrative: generatedReport.narrative,
      commentsAndSuggestions: generatedReport.commentsAndSuggestions
    });
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setStep(1);
      setGeneratedReport({ narrative: '', commentsAndSuggestions: '' });
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/50 rounded-t-[20px] shrink-0">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            Auto-Generate Monthly Report
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
                  Select a month. The AI will analyze your existing daily entries for that month and generate a monthly narrative.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Select Month</Label>
                <Input 
                  type="month" 
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
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
                      Generate Monthly Report
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Narrative / Reflection</Label>
                  <Textarea 
                    className="min-h-[250px] leading-relaxed"
                    value={generatedReport.narrative}
                    onChange={(e) => setGeneratedReport({...generatedReport, narrative: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comments & Suggestions</Label>
                  <Textarea 
                    className="min-h-[100px]"
                    value={generatedReport.commentsAndSuggestions}
                    onChange={(e) => setGeneratedReport({...generatedReport, commentsAndSuggestions: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 sticky bottom-0 bg-card py-4 border-t border-border">
                <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Monthly Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
