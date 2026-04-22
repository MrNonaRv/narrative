import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, Sparkles, Upload, Download, Loader2 } from 'lucide-react';
import AutoGenerateModal from '@/components/AutoGenerateModal';
import * as XLSX from 'xlsx';
import BulkReviseEntriesModal from '@/components/BulkReviseEntriesModal';

export default function DailyEntries() {
  const { entries, addEntry, updateEntry, deleteEntry, bulkUpdateEntries, profile } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isBulkReviseOpen, setIsBulkReviseOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBulkGeneratingProblems, setIsBulkGeneratingProblems] = useState(false);
  const [isGeneratingProblems, setIsGeneratingProblems] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present' as 'present' | 'holiday' | 'absent',
    accomplishment: '',
    workingHours: 8,
    problemsEncountered: '',
    actionTaken: '',
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      updateEntry(currentId, formData);
    } else {
      addEntry(formData);
    }
    resetForm();
  };

  const editEntry = (entry: any) => {
    setFormData({
      date: entry.date,
      status: entry.status || 'present',
      accomplishment: entry.accomplishment,
      workingHours: entry.workingHours,
      problemsEncountered: entry.problemsEncountered,
      actionTaken: entry.actionTaken,
      remarks: entry.remarks
    });
    setCurrentId(entry.id);
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'present',
      accomplishment: '',
      workingHours: 8,
      problemsEncountered: '',
      actionTaken: '',
      remarks: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const allEntries: any[] = [];
        
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          
          data.forEach((row: any) => {
            // Try to find fields regardless of case
            const date = row.Date || row.date || row.DATE;
            const accomplishment = row.Accomplishment || row.accomplishment || row.ACCOMPLISHMENT || row.Task || row.task;
            const hours = parseFloat(row.Hours || row.hours || row.HOURS || row['Working Hours'] || row['working hours'] || '8');
            const problems = row.Problems || row.problems || row.PROBLEMS || row['Problems Encountered'] || row['problems encountered'];
            const action = row.Action || row.action || row.ACTION || row['Action Taken'] || row['action taken'];
            const remarks = row.Remarks || row.remarks || row.REMARKS;

            if (date && accomplishment) {
              // Convert Excel date to JS date if it's a number
              let formattedDate = date;
              if (typeof date === 'number') {
                const jsDate = new Date((date - 25569) * 86400 * 1000);
                formattedDate = format(jsDate, 'yyyy-MM-dd');
              } else {
                try {
                  formattedDate = format(new Date(date), 'yyyy-MM-dd');
                } catch (e) {
                  formattedDate = date;
                }
              }

              allEntries.push({
                date: formattedDate,
                accomplishment: String(accomplishment),
                workingHours: isNaN(hours) ? 8 : hours,
                problemsEncountered: problems ? String(problems) : '',
                actionTaken: action ? String(action) : '',
                remarks: remarks ? String(remarks) : ''
              });
            }
          });
        });

        if (allEntries.length > 0) {
          // Deduplicate within the imported file first (keep the first one found for each date)
          const uniqueImported = allEntries.reduce((acc: any[], current) => {
            const x = acc.find(item => item.date === current.date);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, []);

          let addedCount = 0;
          let skippedCount = 0;
          
          uniqueImported.forEach(entry => {
            const exists = entries.some(e => e.date === entry.date);
            if (!exists) {
              addEntry(entry);
              addedCount++;
            } else {
              skippedCount++;
            }
          });

          if (skippedCount > 0) {
            alert(`Import complete: ${addedCount} new entries added, ${skippedCount} duplicates skipped.`);
          } else {
            alert(`Successfully imported ${addedCount} entries.`);
          }
        } else {
          alert('No valid entries found in the Excel file. Please ensure your columns are named correctly (Date, Accomplishment, etc.)');
        }
      } catch (err) {
        console.error(err);
        alert('Error parsing Excel file. Please make sure it is a valid .xlsx or .xls file.');
      } finally {
        setIsImporting(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Date': format(new Date(), 'yyyy-MM-dd'),
        'Accomplishment': 'Sample accomplishment description',
        'Working Hours': 8,
        'Problems Encountered': 'Optional: Describe any issues',
        'Action Taken': 'Optional: Describe how you solved them',
        'Remarks': 'Optional: Any extra notes'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Week 1');
    XLSX.writeFile(wb, 'OJT_Daily_Entries_Template.xlsx');
  };

  const handleExportExcel = () => {
    if (entries.length === 0) {
      alert("No data to export.");
      return;
    }

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

  const handleBulkFillMissingProblems = async () => {
    const isMissing = (text: string | undefined) => {
      if (!text) return true;
      const lower = text.trim().toLowerCase();
      // Expanded missing check
      return lower === '' || lower === 'none' || lower === 'n/a' || lower === 'na' || lower === '.' || lower === '-' || lower === '???';
    };

    const entriesMissingProblems = entries.filter(
      r => {
        const hasAccomplishment = r.accomplishment && r.accomplishment.trim().length > 0;
        return hasAccomplishment && (isMissing(r.problemsEncountered) || isMissing(r.actionTaken));
      }
    );

    if (entriesMissingProblems.length === 0) {
      alert("All daily entries already have Problems Encountered and Actions Taken!");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      alert("Gemini API Key is missing. Check your settings.");
      return;
    }

    if (!confirm(`Are you sure you want to let AI auto-fill missing problems for ${entriesMissingProblems.length} daily entries? This might take a few minutes.`)) {
      return;
    }

    setIsBulkGeneratingProblems(true);
    setBulkProgress({ current: 0, total: entriesMissingProblems.length });
    const updatedEntriesList: any[] = [];

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
      
      for (let i = 0; i < entriesMissingProblems.length; i++) {
        const entry = entriesMissingProblems[i];
        setBulkProgress({ current: i + 1, total: entriesMissingProblems.length });
        const prompt = `Based on the following daily OJT accomplishment, generate a plausible "Problem Encountered" and the "Action Taken" to resolve it. Keep them brief and realistic for an internship. Use VERY SIMPLE, EASY-TO-UNDERSTAND English words. Do not use complicated words or fancy corporate jargon. If the accomplishment doesn't naturally suggest a problem, invent a minor typical one (e.g., software issue, confusion, clarification needed).

Accomplishment: "${entry.accomplishment}"

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
              updatedEntriesList.push({
                ...entry,
                problemsEncountered: parsed.problemsEncountered || parsed['Problem Encountered'] || parsed.problem || '',
                actionTaken: parsed.actionTaken || parsed['Action Taken'] || parsed.action || ''
              });
            }
          }
        } catch (err) {
          console.error(`AI generation failed for ${entry.date}:`, err);
        }
        
        // Wait 4 seconds between calls to respect Gemini free tier limits (15 RPM)
        await new Promise(res => setTimeout(res, 4000));
      }
      
      if (updatedEntriesList.length > 0) {
        bulkUpdateEntries(updatedEntriesList);
        alert(`Successfully filled in problems for ${updatedEntriesList.length} daily entries!`);
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

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          <h2 className="text-2xl font-bold tracking-tight">Daily Entries</h2>
          <p className="text-muted-foreground">Log your daily accomplishments and challenges.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" onClick={handleExportExcel} className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="ghost" onClick={downloadTemplate} className="text-xs text-muted-foreground hover:text-primary">
            Download Template
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImportExcel}
              disabled={isImporting}
            />
            <Button variant="outline" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100" disabled={isImporting}>
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import Excel'}
            </Button>
          </div>
          <Button onClick={() => setIsAutoModalOpen(true)} className="bg-primary text-white hover:bg-primary/90">
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Generate from Weekly
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsBulkReviseOpen(true)} 
            className="border-primary text-primary hover:bg-primary/5"
            disabled={entries.length === 0}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Revise All (AI)
          </Button>
          <Button 
            onClick={handleBulkFillMissingProblems} 
            variant="outline" 
            className="text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 disabled:opacity-50"
            disabled={isBulkGeneratingProblems || entries.length === 0}
          >
            {isBulkGeneratingProblems ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isBulkGeneratingProblems ? `Filling... (${bulkProgress.current}/${bulkProgress.total})` : 'Auto-fill All Missing Problems'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Entry' : 'New Entry'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="date">Date</Label>
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
                        }}
                      >
                        Yesterday
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[10px] px-2 rounded-full"
                        onClick={() => setFormData({...formData, date: format(new Date(), 'yyyy-MM-dd')})}
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                  <Input 
                    id="date" 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
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
                  <Label htmlFor="hours">Working Hours</Label>
                  <Input 
                    id="hours" 
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
                  <Label htmlFor="accomplishment">Daily Accomplishment</Label>
                  <Textarea 
                    id="accomplishment" 
                    required
                    placeholder="What did you do today?"
                    value={formData.accomplishment}
                    onChange={(e) => setFormData({...formData, accomplishment: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="problems">Problems Encountered</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100"
                      disabled={isGeneratingProblems}
                      onClick={async () => {
                        if (!formData.accomplishment.trim()) {
                          alert("Please write your 'Daily Accomplishment' first so the AI knows what to base the problems on.");
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
                          const prompt = `Based on the following daily OJT accomplishment, generate a plausible "Problem Encountered" and the "Action Taken" to resolve it. Keep them brief and realistic for an internship. Use VERY SIMPLE, EASY-TO-UNDERSTAND English words. Do not use complicated words or fancy corporate jargon. If the accomplishment doesn't naturally suggest a problem, invent a minor typical one (e.g., software issue, confusion, clarification needed).

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
                    id="problems" 
                    placeholder="Any issues or challenges?"
                    value={formData.problemsEncountered}
                    onChange={(e) => setFormData({...formData, problemsEncountered: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actions">Action Taken</Label>
                  <Textarea 
                    id="actions" 
                    placeholder="How did you solve the problems?"
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

                <div className="flex space-x-2 pt-2">
                  <Button type="submit" className="flex-1">
                    {isEditing ? 'Update' : 'Save'} Entry
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
          {sortedEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No entries yet. Start by adding one on the left.
              </CardContent>
            </Card>
          ) : (
            sortedEntries.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}</h3>
                        {entry.status === 'holiday' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Holiday</span>
                        )}
                        {entry.status === 'absent' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Absent</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.workingHours} hours</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => editEntry(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Accomplishment:</span>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{entry.accomplishment}</p>
                    </div>
                    
                    {entry.problemsEncountered && (
                      <div>
                        <span className="font-medium text-red-600">Problems:</span>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{entry.problemsEncountered}</p>
                      </div>
                    )}
                    
                    {entry.actionTaken && (
                      <div>
                        <span className="font-medium text-green-600">Action Taken:</span>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{entry.actionTaken}</p>
                      </div>
                    )}
                    
                    {entry.remarks && (
                      <div>
                        <span className="font-medium text-gray-500">Remarks:</span>
                        <p className="mt-1 text-gray-700">{entry.remarks}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <AutoGenerateModal 
        isOpen={isAutoModalOpen} 
        onClose={() => setIsAutoModalOpen(false)} 
      />

      <BulkReviseEntriesModal
        isOpen={isBulkReviseOpen}
        onClose={() => setIsBulkReviseOpen(false)}
      />
    </div>
  );
}
