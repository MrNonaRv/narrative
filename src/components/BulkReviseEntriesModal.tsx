import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, X, Check, ArrowRight } from 'lucide-react';
import { DailyEntry } from '@/types';

interface BulkReviseEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkReviseEntriesModal({ isOpen, onClose }: BulkReviseEntriesModalProps) {
  const { entries, bulkUpdateEntries } = useAppStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [revisedEntries, setRevisedEntries] = useState<DailyEntry[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  const handleBulkRevise = async () => {
    if (entries.length === 0) {
      setError('No entries found to revise.');
      return;
    }
    
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      setError('Gemini API Key is missing.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      
      // Prepare entries for AI - only passing essential fields to save tokens
      const entriesToProcess = entries.map(e => ({
        id: e.id,
        date: e.date,
        accomplishment: e.accomplishment,
        problemsEncountered: e.problemsEncountered,
        actionTaken: e.actionTaken
      }));

      const prompt = `You are an OJT supervisor. Your task is to revise and improve ALL of the following daily accomplishment entries.
      
      Instructions:
      1. Fix grammar and spelling, but USE VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words or formal corporate jargon.
      2. Keep the original meaning and keep it easy to understand for a normal student level.
      3. Use clear action verbs (e.g., "Helped with", "Made", "Checked").
      4. Ensure "Problems Encountered" and "Action Taken" are short and simple.
      5. Maintain the original IDs so we can map them back.
      
      Entries to revise:
      ${JSON.stringify(entriesToProcess, null, 2)}
      
      Return ONLY a valid JSON array of objects representing the REVISED entries. Do not include markdown formatting like \`\`\`json.
      Structure:
      [
        {
          "id": "string (the original id)",
          "accomplishment": "string (revised accomplishment)",
          "problemsEncountered": "string (revised problems)",
          "actionTaken": "string (revised actions)"
        }
      ]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
        
        // Merge back with original entries to keep fields like status and workingHours
        const merged = parsed.map((revised: any) => {
          const original = entries.find(e => e.id === revised.id);
          if (!original) return null;
          return {
            ...original,
            accomplishment: revised.accomplishment,
            problemsEncountered: revised.problemsEncountered,
            actionTaken: revised.actionTaken
          };
        }).filter(Boolean);

        setRevisedEntries(merged);
        setStep(2);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to revise entries. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAll = () => {
    bulkUpdateEntries(revisedEntries);
    onClose();
    setTimeout(() => {
      setStep(1);
      setRevisedEntries([]);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border-primary/20 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-primary/5 py-4 px-6 shrink-0">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-6 h-6" />
            Bulk Revise All Entries
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full hover:bg-primary/10">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-0">
          {step === 1 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="bg-primary/10 p-6 rounded-full">
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold">Improve All Entries At Once</h3>
                <p className="text-muted-foreground">
                  The AI will analyze all {entries.length} of your current daily entries and revise them for better tone, grammar, and professional quality.
                </p>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-700 mt-4 text-left font-medium">
                  <p>✨ **What happens:**</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Better grammar and spelling</li>
                    <li>More professional phrasing</li>
                    <li>Automatic formatting consistency</li>
                  </ul>
                </div>
              </div>

              {error && <p className="text-red-500 font-medium">{error}</p>}

              <div className="flex gap-4 w-full max-w-sm pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleBulkRevise} disabled={isGenerating || entries.length === 0} className="flex-1 gap-2 shadow-lg shadow-primary/20">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Revising {entries.length} items...
                    </>
                  ) : (
                    <>
                      Start Bulk Revision
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-slate-50">
              <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Showing {revisedEntries.length} revised entries. Review changes below.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} size="sm">Back</Button>
                  <Button onClick={handleApplyAll} size="sm" className="gap-2">
                    <Check className="w-4 h-4" />
                    Apply All Changes
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {revisedEntries.map((revised, idx) => {
                  const original = entries.find(e => e.id === revised.id);
                  return (
                    <div key={revised.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original - {revised.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 italic whitespace-pre-wrap">{original?.accomplishment}</p>
                      </div>
                      <div className="p-4 border-l border-border bg-primary/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Revised</span>
                          <Sparkles className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{revised.accomplishment}</p>
                        
                        {(revised.problemsEncountered || original?.problemsEncountered) && (
                           <div className="mt-3 pt-3 border-t border-primary/10">
                              <p className="text-[10px] font-bold text-primary/60 uppercase">Problems & Action:</p>
                              <p className="text-xs text-slate-700 mt-1">
                                <span className="font-semibold">P:</span> {revised.problemsEncountered || 'None'}
                              </p>
                              <p className="text-xs text-slate-700 mt-0.5">
                                <span className="font-semibold">A:</span> {revised.actionTaken || 'None'}
                              </p>
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
