import React, { useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, Sparkles, Loader2, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import html2pdf from 'html2pdf.js';

export default function Export() {
  const { profile, entries, weeklyReports, monthlyReports, addWeeklyReport, addMonthlyReport } = useAppStore();
  const componentRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState<'narrative' | 'weekly' | 'monthly'>('narrative');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomValue, setZoomValue] = useState(0.8);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `OJT_Report_${profile.name.replace(/\s+/g, '_')}`,
  });

  const handleExportPDF = () => {
    const element = componentRef.current;
    if (!element) return;

    // Create a clone of the element to avoid modifying the UI
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Create a temporary container for the clone
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = (reportType === 'weekly' || reportType === 'monthly') ? '330.2mm' : '215.9mm';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Ensure all elements in the clone are visible
    const hiddenElements = clone.querySelectorAll('.hidden, .print\\:hidden');
    hiddenElements.forEach(el => {
      el.classList.remove('hidden');
      el.classList.remove('print:hidden');
    });

    // Strip flex and gap to ensure html2pdf pagination works exactly like print mode
    clone.classList.remove('flex', 'flex-col', 'gap-8');
    clone.style.display = 'block';

    Array.from(clone.children).forEach(child => {
      const el = child as HTMLElement;
      el.classList.remove('shadow-lg', 'bg-white');
      el.style.boxShadow = 'none';
      el.style.margin = '0';
      el.style.backgroundColor = 'white';
    });

    const opt = {
      margin:       0,
      filename:     `OJT_Report_${profile.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF:        { 
        unit: 'mm', 
        format: [215.9, 330.2] as [number, number], 
        orientation: (reportType === 'weekly' || reportType === 'monthly' ? 'landscape' : 'portrait') as 'landscape' | 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
      document.body.removeChild(container);
    });
  };

  const handleExportWord = () => {
    const content = componentRef.current?.innerHTML;
    if (!content) return;

    const styles = `
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid black; padding: 8px; }
        th { font-weight: bold; }
        .border-none { border: none !important; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        .mb-12 { margin-bottom: 48px; }
        .mt-1 { margin-top: 4px; }
        .mt-8 { margin-top: 32px; }
        .mt-16 { margin-top: 64px; }
        .pt-4 { padding-top: 16px; }
        .pb-2 { padding-bottom: 8px; }
        .pr-8 { padding-right: 32px; }
        .pl-8 { padding-left: 32px; }
        .text-sm { font-size: 10pt; }
        .text-lg { font-size: 14pt; }
        .indent-8 { text-indent: 32px; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        .border-b { border-bottom: 1px solid black !important; }
        .w-full { width: 100%; }
        .w-1\\/2 { width: 50%; }
        .w-1\\/3 { width: 33.33%; }
        .w-2\\/3 { width: 66.66%; }
        .w-1\\/6 { width: 16.66%; }
        .w-3\\/6 { width: 50%; }
        .w-\\[15\\%\\] { width: 15%; }
        .w-\\[30\\%\\] { width: 30%; }
        .w-\\[25\\%\\] { width: 25%; }
        .w-\\[20\\%\\] { width: 20%; }
        .w-\\[10\\%\\] { width: 10%; }
        .align-bottom { vertical-align: bottom !important; }
        .align-top { vertical-align: top; }
        .align-middle { vertical-align: middle; }
        .pb-1 { padding-bottom: 4px; }
        .pb-\\[2px\\] { padding-bottom: 2px; }
        .leading-tight { line-height: 1.25; }
        .break-inside-avoid { page-break-inside: avoid; }
        .print\\:break-after-page { page-break-after: always; }
        @page {
          size: ${(reportType === 'weekly' || reportType === 'monthly') ? '13in 8.5in' : '8.5in 13in'};
          margin: 1in;
        }
        @page WordSection1 {
          size: ${(reportType === 'weekly' || reportType === 'monthly') ? '13in 8.5in' : '8.5in 13in'};
          mso-page-orientation: ${(reportType === 'weekly' || reportType === 'monthly') ? 'landscape' : 'portrait'};
          margin: 1.0in 1.0in 1.0in 1.0in;
        }
        div.WordSection1 { page: WordSection1; }
      </style>
    `;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>OJT Report</title>
        ${styles}
      </head>
      <body>
        <div class="WordSection1">
          ${content}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OJT_Report_${profile.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group entries by week
  const groupedEntries = React.useMemo(() => {
    const groups = new Map<string, typeof entries>();
    
    entries.forEach(entry => {
      const date = parseISO(entry.date);
      const start = startOfWeek(date, { weekStartsOn: 1 });
      
      const key = format(start, 'yyyy-MM-dd');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    // Sort entries within each group
    groups.forEach(group => {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return Array.from(groups.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [entries]);

  const groupedEntriesByMonth = React.useMemo(() => {
    const groups = new Map<string, typeof entries>();
    
    entries.forEach(entry => {
      const date = parseISO(entry.date);
      const start = startOfMonth(date);
      
      const key = format(start, 'yyyy-MM');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });

    groups.forEach(group => {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return Array.from(groups.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [entries]);

  const handleGenerateMissingSummaries = async () => {
    if (!process.env.GEMINI_API_KEY) {
      alert('Gemini API Key is missing.');
      return;
    }

    setIsGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
      for (const [weekKey, weekEntries] of groupedEntries) {
        const firstEntryDate = parseISO(weekEntries[0].date);
        const weekStart = startOfWeek(firstEntryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(firstEntryDate, { weekStartsOn: 1 });
        
        const existingReport = weeklyReports?.find((r: any) => {
          const rStart = parseISO(r.weekStartDate);
          return rStart >= weekStart && rStart <= weekEnd;
        });

        if (!existingReport) {
          const startDateStr = format(weekStart, 'yyyy-MM-dd');
          const endDateStr = format(weekEnd, 'yyyy-MM-dd');
          
          const entriesText = JSON.stringify(
            weekEntries.map(e => ({ 
              date: e.date, 
              accomplishment: e.accomplishment, 
              problemsEncountered: e.problemsEncountered,
              actionTaken: e.actionTaken
            })), 
            null, 2
          );

          const prompt = `You are an assistant that generates a short and simple Weekly OJT (On-the-Job Training) narrative report based on a student's daily entries.
          
          Date Range: ${startDateStr} to ${endDateStr}
          
          Daily Entries for this period:
          ${entriesText}
          
          Task:
          1. Analyze the daily entries provided.
          2. Write a short, simple, and concise "Weekly Narrative / Reflection" summarizing the main accomplishments, learnings, and challenges. Keep it brief (1-2 short paragraphs maximum).
          3. Write a brief "Comments & Suggestions" section (e.g., feedback or self-improvement notes). Keep it to 1-2 sentences.
          
          Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
          
          {
            "narrative": "string (Short and simple narrative summary)",
            "commentsAndSuggestions": "string (Brief comments and suggestions)"
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
            addWeeklyReport({
              weekStartDate: startDateStr,
              weekEndDate: endDateStr,
              narrative: parsed.narrative || '',
              commentsAndSuggestions: parsed.commentsAndSuggestions || ''
            });
          }
        }
      }

      // Generate Monthly Summaries
      for (const [monthKey, monthEntries] of groupedEntriesByMonth) {
        const firstEntryDate = parseISO(monthEntries[0].date);
        const monthStart = startOfMonth(firstEntryDate);
        const monthStr = format(monthStart, 'yyyy-MM');
        
        const existingReport = monthlyReports?.find((r: any) => r.month === monthStr);

        if (!existingReport) {
          const entriesText = JSON.stringify(
            monthEntries.map(e => ({ 
              date: e.date, 
              accomplishment: e.accomplishment, 
              problemsEncountered: e.problemsEncountered,
              actionTaken: e.actionTaken
            })), 
            null, 2
          );

          const prompt = `You are an assistant that generates a short and simple Monthly OJT (On-the-Job Training) narrative report based on a student's daily entries.
          
          Month: ${format(monthStart, 'MMMM yyyy')}
          
          Daily Entries for this period:
          ${entriesText}
          
          Task:
          1. Analyze the daily entries provided.
          2. Write a short, simple, and concise "Monthly Narrative / Reflection" summarizing the main accomplishments, learnings, and challenges for the entire month. Keep it brief (2-3 short paragraphs maximum).
          3. Write a brief "Comments & Suggestions" section (e.g., feedback or self-improvement notes). Keep it to 1-2 sentences.
          
          Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
          
          {
            "narrative": "string (Short and simple narrative summary)",
            "commentsAndSuggestions": "string (Brief comments and suggestions)"
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
            addMonthlyReport({
              month: monthStr,
              narrative: parsed.narrative || '',
              commentsAndSuggestions: parsed.commentsAndSuggestions || ''
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate some summaries. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          @media print {
            @page {
              size: ${(reportType === 'weekly' || reportType === 'monthly') ? '330.2mm 215.9mm landscape' : '215.9mm 330.2mm portrait'};
              margin: 0;
            }
            body {
              margin: 0;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Export Reports</h2>
          <p className="text-muted-foreground">Preview, print, or export your OJT reports.</p>
        </div>
        <div className="flex items-center space-x-2 bg-muted/50 p-1.5 rounded-lg border border-border">
          <Label className="text-sm font-medium whitespace-nowrap pl-2">Zoom:</Label>
          <input 
            type="range" 
            min="0.3" 
            max="1.5" 
            step="0.05" 
            value={zoomValue} 
            onChange={(e) => setZoomValue(parseFloat(e.target.value))} 
            className="w-24 md:w-32"
          />
          <span className="text-xs text-muted-foreground w-10">{Math.round(zoomValue * 100)}%</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <select 
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-[250px]"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as 'narrative' | 'weekly' | 'monthly')}
        >
          <option value="narrative">Narrative Report (Daily)</option>
          <option value="weekly">Weekly Journal Report</option>
          <option value="monthly">Monthly Journal Report</option>
        </select>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleGenerateMissingSummaries} 
            variant="outline" 
            className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Auto-Generate Summaries'}
          </Button>
          <Button onClick={handleExportWord} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
            <FileText className="mr-2 h-4 w-4" />
            Export to Word
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
            <Download className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="bg-gray-200 mt-6 p-4 rounded-xl overflow-auto flex justify-center max-h-[calc(100vh-280px)] min-h-[500px]">
        {/* Printable Area Wrapper for Zoom */}
        <div 
          className="origin-top" 
          style={{ zoom: zoomValue } as React.CSSProperties}
        >
          <div 
            ref={componentRef} 
            className="flex flex-col items-center gap-8 print:block print:gap-0"
          >
            {reportType === 'narrative' ? (
              <NarrativeReportTemplate profile={profile} groupedEntries={groupedEntries} weeklyReports={weeklyReports} />
            ) : reportType === 'weekly' ? (
              <WeeklyJournalTemplate profile={profile} weeklyReports={weeklyReports} />
            ) : (
              <MonthlyJournalTemplate profile={profile} groupedEntriesByMonth={groupedEntriesByMonth} monthlyReports={monthlyReports} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NarrativeReportTemplate({ profile, groupedEntries, weeklyReports }: { profile: any, groupedEntries: any[], weeklyReports?: any[] }) {
  return (
    <>
      {groupedEntries.map(([weekKey, weekEntries], index) => {
        const totalHours = weekEntries.reduce((sum: number, e: any) => sum + e.workingHours, 0);
        
        const firstEntryDate = parseISO(weekEntries[0].date);
        const lastEntryDate = parseISO(weekEntries[weekEntries.length - 1].date);
        
        let displayDateCovered = '';
        if (firstEntryDate.getMonth() === lastEntryDate.getMonth()) {
          displayDateCovered = `${format(firstEntryDate, 'MMMM dd')}-${format(lastEntryDate, 'dd, yyyy')}`;
        } else {
          displayDateCovered = `${format(firstEntryDate, 'MMMM dd')} - ${format(lastEntryDate, 'MMMM dd, yyyy')}`;
        }

        const weekStart = startOfWeek(firstEntryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(firstEntryDate, { weekStartsOn: 1 });
        
        const report = weeklyReports?.find((r: any) => {
          const rStart = parseISO(r.weekStartDate);
          return rStart >= weekStart && rStart <= weekEnd;
        });
        
        return (
          <div 
            key={weekKey} 
            className="bg-white shadow-lg print:shadow-none p-[20mm] text-black print:p-[20mm] print:m-0 break-inside-avoid print:break-after-page html2pdf__page-break" 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: 'always',
              breakAfter: 'page',
              width: '215.9mm',
              height: 'auto',
              minHeight: '330.2mm',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            <h3 className="text-center font-bold mb-4 uppercase">
              WEEK {index + 1}: {profile.hostEstablishment.toUpperCase()}
            </h3>
            <p className="text-center mb-4">Date Covered: {displayDateCovered}</p>
            
            <table className="w-full border-collapse border border-black text-sm mb-6">
              <thead>
                <tr>
                  <th className="border border-black p-2 w-[15%] text-center">DAY</th>
                  <th className="border border-black p-2 w-[20%] text-center">DATE</th>
                  <th className="border border-black p-2 w-[50%] text-center">DAILY ACCOMPLISHMENT REPORT</th>
                  <th className="border border-black p-2 w-[15%] text-center">NO. OF WORKING HOURS</th>
                </tr>
              </thead>
              <tbody>
                {weekEntries.map((entry: any) => (
                  <tr key={entry.id}>
                    <td className="border border-black p-2 text-center capitalize font-bold">
                      {format(parseISO(entry.date), 'EEEE')}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {format(parseISO(entry.date), 'MMMM dd, yyyy')}
                    </td>
                    <td className="border border-black p-2 whitespace-pre-wrap">
                      {entry.status === 'holiday' ? 'HOLIDAY' : entry.status === 'absent' ? 'ABSENT' : entry.accomplishment}
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      {entry.workingHours > 0 ? entry.workingHours : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <table className="w-full mb-6 border-none">
              <tbody>
                <tr>
                  <td className="w-2/3 border-none"></td>
                  <td className="w-1/3 border-none font-bold text-right" style={{ border: 'none' }}>
                    Total No. of Hours : {totalHours} Hours
                  </td>
                </tr>
              </tbody>
            </table>

            {report?.narrative && (
              <div className="mt-8 text-justify indent-8 leading-relaxed whitespace-pre-wrap">
                {report.narrative}
              </div>
            )}
            
            {/* MS Word explicit page break */}
            <div style={{ pageBreakBefore: 'always' }} />
          </div>
        );
      })}
    </>
  );
}

function MonthlyJournalTemplate({ profile, groupedEntriesByMonth, monthlyReports }: { profile: any, groupedEntriesByMonth: any[], monthlyReports: any[] }) {
  if (groupedEntriesByMonth.length === 0) return <div>No data available.</div>;

  return (
    <>
      {groupedEntriesByMonth.map(([monthKey, monthEntries], index) => {
        const firstEntryDate = parseISO(monthEntries[0].date);
        const monthStart = startOfMonth(firstEntryDate);
        const monthStr = format(monthStart, 'yyyy-MM');
        
        const report = monthlyReports?.find((r: any) => r.month === monthStr);

        return (
          <div 
            key={monthKey} 
            className="bg-white shadow-lg print:shadow-none p-[10mm] text-black print:p-[10mm] print:m-0 print:break-after-page html2pdf__page-break flex flex-col" 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: 'always',
              breakAfter: 'page',
              width: '330.2mm',
              height: 'auto',
              minHeight: '215.9mm',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            <table className="w-full border-collapse border border-black mb-2 text-sm shrink-0">
              <tbody>
                <tr>
                  <td className="border border-black p-2 w-[15%] text-center align-middle">
                    <img 
                      src={`${window.location.origin}/logo-capsu.jpg`}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      alt="Capiz State University Logo" 
                      className="w-20 h-20 mx-auto object-contain"
                    />
                  </td>
                  <td className="border border-black p-0 w-[55%] align-top">
                    <table className="w-full h-full border-none">
                      <tbody>
                        <tr>
                          <td className="border-b border-black p-1 align-top h-[50%]">
                            <div className="text-[10px]">Document Type:</div>
                            <div className="text-center font-bold text-sm">FORM</div>
                            <div className="text-center text-[10px]">ISO 9001:2015</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1 align-top h-[50%]">
                            <div className="text-[10px] float-left">Document Title:</div>
                            <div className="text-center font-bold text-sm mt-1 uppercase">STUDENT'S MONTHLY JOURNAL REPORT</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td className="border border-black p-0 w-[30%] text-[10px]">
                    <table className="w-full h-full border-none">
                      <tbody>
                        <tr>
                          <td className="border-b border-r border-black p-1 w-1/2">Document Code</td>
                          <td className="border-b border-black p-1 w-1/2 font-bold text-center">EAL-F01</td>
                        </tr>
                        <tr>
                          <td className="border-b border-r border-black p-1">Revision No.</td>
                          <td className="border-b border-black p-1 font-bold text-center">00</td>
                        </tr>
                        <tr>
                          <td className="border-b border-r border-black p-1">Effective Date</td>
                          <td className="border-b border-black p-1 font-bold text-center">October 07, 2019</td>
                        </tr>
                        <tr>
                          <td className="border-r border-black p-1">Page</td>
                          <td className="p-1 font-bold text-center">1 of 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full mb-1 text-xs border-none font-bold shrink-0">
              <tbody>
                <tr>
                  <td className="w-[5%] whitespace-nowrap border-none align-bottom pb-1">NAME:</td>
                  <td className="w-[45%] border-none align-bottom px-2">
                    <div className="border-b border-black font-normal text-center pb-1">{profile.name}</div>
                  </td>
                  <td className="w-[15%] whitespace-nowrap pl-2 border-none align-bottom pb-1">COURSE & YEAR:</td>
                  <td className="w-[15%] border-none align-bottom px-2">
                    <div className="border-b border-black font-normal text-center pb-1">{profile.courseAndYear}</div>
                  </td>
                  <td className="w-[5%] whitespace-nowrap pl-2 border-none align-bottom pb-1">Major:</td>
                  <td className="w-[15%] border-none align-bottom px-2">
                    <div className="border-b border-black font-normal text-center pb-1">{profile.major}</div>
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full mb-2 text-xs border-none font-bold shrink-0">
              <tbody>
                <tr>
                  <td className="w-[20%] whitespace-nowrap border-none align-bottom pb-1">OFFICE/DEPARTMENT:</td>
                  <td className="w-[80%] border-none align-bottom px-2">
                    <div className="border-b border-black font-normal pb-1">{profile.hostEstablishment}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mb-2 text-center font-bold uppercase text-sm shrink-0">
              MONTH OF {format(monthStart, 'MMMM yyyy')}
            </div>

            <div className="border border-black p-4 mb-4 text-sm flex-1">
              <div className="font-bold mb-2 uppercase underline">Monthly Narrative / Reflection:</div>
              <div className="whitespace-pre-wrap leading-relaxed text-justify">
                {report?.narrative || 'No summary generated yet. Use the "Auto-Generate" button to create one.'}
              </div>
            </div>

            <div className="mb-4 text-xs shrink-0">
              <div className="mb-1 uppercase font-bold">COMMENTS AND SUGGESTIONS:</div>
              <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap mb-1">
                {report?.commentsAndSuggestions || ' '}
              </div>
              <div className="border-b border-black min-h-[1.2rem] mb-1"></div>
            </div>

            <table className="w-full mt-auto border-none text-xs font-bold shrink-0">
              <tbody>
                <tr>
                  <td className="w-1/2 pr-16 border-none align-bottom">
                    <div className="mb-8">SUBMITTED:</div>
                    <div className="border-b border-black text-center pt-4 font-normal">{profile.name}</div>
                    <div className="text-left font-normal mt-1">Intern/Trainee</div>
                  </td>
                  <td className="w-1/2 pl-16 border-none align-bottom">
                    <div className="mb-8">ATTESTED:</div>
                    <div className="border-b border-black text-center pt-4 font-normal">{profile.headOffice}</div>
                    <div className="text-center font-normal mt-1">On-Site Supervisor</div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* MS Word explicit page break */}
            <div style={{ pageBreakBefore: 'always' }} />
          </div>
        );
      })}
    </>
  );
}
function WeeklyJournalTemplate({ profile, weeklyReports }: { profile: any, weeklyReports: any[] }) {
  if (!weeklyReports || weeklyReports.length === 0) return <div>No weekly reports available. Please generate them in the Weekly Reports tab.</div>;

  // Sort chronologically ascending
  const sortedReports = [...weeklyReports].sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());
  
  const chunkArray = (arr: any[], size: number) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  const getWeekOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + " Week";
  };

  // Group 1 week per layout page to match strictly the blank PDF template
  return (
    <>
      {sortedReports.map((report, chunkIndex) => {
        const startStr = format(parseISO(report.weekStartDate), 'MMM d, yyyy');
        const endStr = format(parseISO(report.weekEndDate), 'MMM d, yyyy');
        const globalIndex = chunkIndex + 1;
        
        return (
          <div 
            key={`weekly-page-${chunkIndex}`} 
            className="bg-white shadow-lg print:shadow-none p-[10mm] text-black print:p-[10mm] print:m-0 print:break-after-page html2pdf__page-break flex flex-col" 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: 'always',
              breakAfter: 'page',
              width: '330.2mm',
              height: 'auto',
              minHeight: '215.9mm',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            <table className="w-full border-collapse border border-black mb-2 text-sm shrink-0">
              <tbody>
                <tr>
                  <td className="border border-black p-2 w-[12%] text-center align-middle">
                    <img 
                      src={`${window.location.origin}/logo-capsu.jpg`}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      alt="Capiz State University Logo" 
                      className="w-20 h-20 mx-auto object-contain"
                    />
                  </td>
                  <td className="border border-black p-0 w-[63%] align-top">
                    <table className="w-full h-full border-none">
                      <tbody>
                        <tr>
                          <td className="border-b border-black p-1 align-top h-[50%]">
                            <div className="text-[10px]">Document Type:</div>
                            <div className="text-center font-bold text-sm">FORM</div>
                            <div className="text-center text-[10px]">ISO 9001:2015</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1 align-top h-[50%]">
                            <div className="text-[10px] float-left">Document Title:</div>
                            <div className="text-center font-bold text-sm mt-1 uppercase">STUDENT'S WEEKLY JOURNAL REPORT</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td className="border border-black p-0 w-[25%] text-[10px]">
                    <table className="w-full h-full border-none">
                      <tbody>
                        <tr>
                          <td className="border-b border-r border-black p-1 w-1/2">Document Code</td>
                          <td className="border-b border-black p-1 w-1/2 font-bold text-center">EAL-F01</td>
                        </tr>
                        <tr>
                          <td className="border-b border-r border-black p-1">Revision No.</td>
                          <td className="border-b border-black p-1 font-bold text-center">00</td>
                        </tr>
                        <tr>
                          <td className="border-b border-r border-black p-1">Effective Date</td>
                          <td className="border-b border-black p-1 font-bold text-center">October 07, 2019</td>
                        </tr>
                        <tr>
                          <td className="border-r border-black p-1">Page</td>
                          <td className="p-1 font-bold text-center">1 of 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

          <table className="w-full mb-1 text-xs border-none font-bold shrink-0">
            <tbody>
              <tr>
                <td className="w-[5%] whitespace-nowrap border-none align-bottom pb-1">NAME:</td>
                <td className="w-[45%] border-none align-bottom px-2">
                  <div className="border-b border-black font-normal text-center pb-1">{profile.name}</div>
                </td>
                <td className="w-[15%] whitespace-nowrap pl-2 border-none align-bottom pb-1">COURSE & YEAR:</td>
                <td className="w-[15%] border-none align-bottom px-2">
                  <div className="border-b border-black font-normal text-center pb-1">{profile.courseAndYear}</div>
                </td>
                <td className="w-[5%] whitespace-nowrap pl-2 border-none align-bottom pb-1">Major:</td>
                <td className="w-[15%] border-none align-bottom px-2">
                  <div className="border-b border-black font-normal text-center pb-1">{profile.major}</div>
                </td>
              </tr>
            </tbody>
          </table>
          <table className="w-full mb-2 text-xs border-none font-bold shrink-0">
            <tbody>
              <tr>
                <td className="w-[20%] whitespace-nowrap border-none align-bottom pb-1">OFFICE/DEPARTMENT:</td>
                <td className="w-[80%] border-none align-bottom px-2">
                  <div className="border-b border-black font-normal pb-1">{profile.hostEstablishment}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex flex-col flex-1 my-2 border border-black min-h-[85mm]">
            <table className="w-full border-collapse text-xs table-fixed flex-1 h-full">
              <thead>
                <tr className="h-[24px]">
                  <th className="border-b border-r border-black p-1 w-[12%] text-center align-middle font-bold">DATE<br/>COVERED</th>
                  <th className="border-b border-r border-black p-1 w-[33%] text-center align-middle font-bold">ACCOMPLISHMENT</th>
                  <th className="border-b border-r border-black p-1 w-[25%] text-center align-middle font-bold">PROBLEMS ENCOUNTERED</th>
                  <th className="border-b border-r border-black p-1 w-[20%] text-center align-middle font-bold">ACTION TAKEN</th>
                  <th className="border-b border-black p-1 w-[10%] text-center align-middle font-bold">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-black p-2 text-center align-top whitespace-pre-wrap">
                    <div className="font-bold">{getWeekOrdinal(globalIndex)}</div>
                    <div className="mt-1 leading-tight">({startStr}<br/>to<br/>{endStr})</div>
                  </td>
                  <td 
                    className="border-r border-black p-2 align-top whitespace-pre-wrap"
                    style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #000 23px, #000 24px)', backgroundPosition: '0 1px', lineHeight: '24px' }}
                  >
                    {report.accomplishment || report.narrative}
                  </td>
                  <td 
                    className="border-r border-black p-2 align-top whitespace-pre-wrap"
                    style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #000 23px, #000 24px)', backgroundPosition: '0 1px', lineHeight: '24px' }}
                  >
                    {report.problemsEncountered}
                  </td>
                  <td 
                    className="border-r border-black p-2 align-top whitespace-pre-wrap"
                    style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #000 23px, #000 24px)', backgroundPosition: '0 1px', lineHeight: '24px' }}
                  >
                    {report.actionTaken}
                  </td>
                  <td className="p-2 align-top whitespace-pre-wrap">
                    {report.remarks}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-2 mb-4 text-xs shrink-0">
            <div className="mb-1 uppercase">COMMENTS AND SUGGESTIONS:</div>
            <div className="border-b border-black min-h-[1.5rem] whitespace-pre-wrap mb-1 leading-6">
              {(report.commentsAndSuggestions && report.commentsAndSuggestions.split('\n')[0]) || ' '}
            </div>
            <div className="border-b border-black min-h-[1.5rem] whitespace-pre-wrap mb-1 leading-6">
              {(report.commentsAndSuggestions && report.commentsAndSuggestions.split('\n')[1]) || ' '}
            </div>
            <div className="border-b border-black min-h-[1.5rem] whitespace-pre-wrap mb-1 leading-6">
              {(report.commentsAndSuggestions && report.commentsAndSuggestions.split('\n').slice(2).join('\n')) || ' '}
            </div>
          </div>

          <table className="w-full mt-2 border-none text-xs font-bold shrink-0">
            <tbody>
              <tr>
                <td className="w-1/2 pr-16 border-none align-bottom">
                  <div className="mb-8">SUBMITTED:</div>
                  <div className="border-b border-black text-center pt-4 font-normal">{profile.name}</div>
                  <div className="text-left font-normal mt-1">Intern/Trainee</div>
                </td>
                <td className="w-1/2 pl-16 border-none align-bottom">
                  <div className="mb-8">ATTESTED:</div>
                  <div className="border-b border-black text-center pt-4 font-normal">{profile.headOffice}</div>
                  <div className="text-center font-normal mt-1">On-Site Supervisor</div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ pageBreakBefore: 'always' }} />
        </div>
      )})}
    </>
  );
}
