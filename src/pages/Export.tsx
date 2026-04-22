import React, { useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, Sparkles, Loader2, Download, Edit3, Image as ImageIcon, Trash2, Plus, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import html2pdf from 'html2pdf.js';
import NarrativeReviseModal from '@/components/NarrativeReviseModal';

export default function Export() {
  const { profile, setProfile, entries, weeklyReports, monthlyReports, addWeeklyReport, addMonthlyReport, updateWeeklyReport, updateMonthlyReport } = useAppStore();
  const componentRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState<'narrative' | 'weekly' | 'monthly'>('narrative');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomValue, setZoomValue] = useState(0.8);
  const [isNarrativeModalOpen, setIsNarrativeModalOpen] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `OJT_Report_${(profile?.name || 'Student').replace(/\s+/g, '_')}`,
  });

  const handleExportPDF = () => {
    const element = componentRef.current;
    if (!element) return;

    // Clone the element to avoid modifying the UI while exporting
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Create a temporary isolated container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Strip flex and generic gap spacing from the wrapper which misaligns physical PDF pages 
    clone.classList.remove('gap-8', 'flex', 'flex-col', 'items-center');
    clone.style.display = 'block';

    const opt = {
      margin:       0,
      filename:     `OJT_Report_${(profile?.name || 'Student').replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        windowWidth: (reportType === 'weekly' || reportType === 'monthly') ? 1248 : 800
      },
      jsPDF:        { 
        unit: 'in', 
        format: reportType === 'narrative' ? 'letter' : [8.5, 13] as [number, number], 
        orientation: (reportType === 'weekly' || reportType === 'monthly' ? 'landscape' : 'portrait') as 'landscape' | 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    // Temporarily suppress html2canvas parsing errors spamming the console
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Error parsing CSS component value, unexpected EOF')) {
        return; // Suppress harmless html2canvas token parser crash for Tailwind v4
      }
      originalConsoleError(...args);
    };

    html2pdf().set(opt).from(clone).save()
      .then(() => {
        if (container.parentNode) document.body.removeChild(container);
        console.error = originalConsoleError; // Restore
      })
      .catch((e: any) => {
        if (container.parentNode) document.body.removeChild(container);
        console.error = originalConsoleError; // Ensure we always restore on failure
        console.error('PDF Export Error:', e);
      });
  };

  const handleExportWord = async () => {
    try {
      const container = componentRef.current;
      if (!container) return;

      // Clone the element to avoid modifying the visual UI
      const clone = container.cloneNode(true) as HTMLElement;

      // Aggressive inline style application for MS Word compatibility
      const all = clone.querySelectorAll('*');
      all.forEach(node => {
        const el = node as HTMLElement;
        const classList = Array.from(el.classList);

        // Base styles for word if not set
        if (el.tagName === 'TABLE') {
          el.style.borderCollapse = 'collapse';
          el.style.width = '100%';
          el.style.marginBottom = '10pt';
        }
        if (el.tagName === 'TD' || el.tagName === 'TH') {
          el.style.padding = '5pt';
          el.style.verticalAlign = 'top';
          if (!classList.includes('border-none')) {
            el.style.border = '1px solid black';
          }
        }

        if (el.tagName === 'IMG') {
          el.style.maxWidth = '100%';
          el.style.height = 'auto';
          el.style.display = 'block';
          el.style.margin = '5pt auto';
        }

        // Mapping Tailwind classes to inline styles
        // ... Alignment
        if (classList.includes('text-center')) el.style.textAlign = 'center';
        if (classList.includes('text-right')) el.style.textAlign = 'right';
        if (classList.includes('text-left')) el.style.textAlign = 'left';
        if (classList.includes('text-justify')) {
          el.style.textAlign = 'justify';
          (el.style as any).textJustify = 'inter-ideograph'; // Word specific justify
        }

        // Flex containers (simplified for Word)
        if (classList.includes('flex')) {
          if (classList.includes('flex-col')) {
             el.style.display = 'block';
          }
          
          if (classList.includes('items-center') && classList.includes('justify-center')) {
            el.style.display = 'block';
            el.style.textAlign = 'center';
            // If it's a full-height centerer, add some top padding as word doesn't support flex h-full well
            if (classList.includes('h-full') || classList.length <= 4) { // heuristic for the wrapper centering 
               el.style.marginTop = '30%'; // Use % or fixed large PT to push to center
            }
          }
        }

        // Special handling for the <Page> wrapper specifically
        if (el.style.pageBreakAfter === 'always' || classList.includes('html2pdf__page-break')) {
          el.style.display = 'block'; // force block layout over flex for the main page
          el.style.height = '100%'; // Helps Word respect page bounds
          el.style.position = 'relative'; 
        }

        // Fonts & Weights
        if (classList.includes('font-bold')) el.style.fontWeight = 'bold';
        if (classList.includes('font-semibold')) el.style.fontWeight = 'bold';
        if (classList.includes('font-normal')) el.style.fontWeight = 'normal';
        if (classList.includes('uppercase')) el.style.textTransform = 'uppercase';
        if (classList.includes('underline')) el.style.textDecoration = 'underline';
        if (classList.includes('italic')) el.style.fontStyle = 'italic';

        // Text sizes
        if (classList.includes('text-2xl')) el.style.fontSize = '24pt';
        if (classList.includes('text-xl')) el.style.fontSize = '18pt';
        if (classList.includes('text-lg')) el.style.fontSize = '14pt';
        if (classList.includes('text-sm')) el.style.fontSize = '10pt';
        if (classList.includes('text-xs')) el.style.fontSize = '8pt';
        
        // Look for text-[...] syntax explicitly
        el.className.split(' ').forEach(cls => {
           if (cls.startsWith('text-[') && cls.endsWith(']')) {
             el.style.fontSize = cls.substring(6, cls.length - 1);
           }
        });

        // Specific Spacings
        if (classList.includes('indent-8')) el.style.textIndent = '48pt';
        if (classList.includes('whitespace-pre-wrap')) el.style.whiteSpace = 'pre-wrap';
        if (classList.includes('leading-relaxed')) {
          el.style.lineHeight = '1.8';
        }
        if (classList.includes('leading-tight')) {
          el.style.lineHeight = '1.2';
        }

        // Layouts for Word (Grid to Table-like stacking)
        if (classList.includes('grid')) {
          el.style.display = 'block';
          el.style.width = '100%';
        }
        
        // Remove percentage heights that break in Word
        if (el.className.includes('h-[') && el.className.includes('%]')) {
          el.style.height = 'auto';
          el.style.minHeight = '0';
        }

        // Margins
        if (classList.includes('mt-1')) el.style.marginTop = '4pt';
        if (classList.includes('mt-2')) el.style.marginTop = '8pt';
        if (classList.includes('mt-4')) el.style.marginTop = '16pt';
        if (classList.includes('mt-8')) el.style.marginTop = '32pt';
        if (classList.includes('mt-16')) el.style.marginTop = '64pt';
        if (classList.includes('mt-24')) el.style.marginTop = '96pt';
        
        if (classList.includes('mb-1')) el.style.marginBottom = '4pt';
        if (classList.includes('mb-2')) el.style.marginBottom = '8pt';
        if (classList.includes('mb-4')) el.style.marginBottom = '16pt';
        if (classList.includes('mb-6')) el.style.marginBottom = '24pt';
        if (classList.includes('mb-8')) el.style.marginBottom = '32pt';
        if (classList.includes('mb-12')) el.style.marginBottom = '48pt';
        if (classList.includes('mb-24')) el.style.marginBottom = '96pt';

        // Paddings
        if (classList.includes('p-2')) el.style.padding = '8pt';
        if (classList.includes('p-4')) el.style.padding = '16pt';
        if (classList.includes('p-8')) el.style.padding = '32pt';
        if (classList.includes('pt-4')) el.style.paddingTop = '16pt';
        if (classList.includes('pb-1')) el.style.paddingBottom = '4pt';
        if (classList.includes('pb-2')) el.style.paddingBottom = '8pt';
        if (classList.includes('pr-6')) el.style.paddingRight = '24pt';
        if (classList.includes('pr-8')) el.style.paddingRight = '32pt';
        if (classList.includes('pl-8')) el.style.paddingLeft = '32pt';
        if (classList.includes('pl-16')) el.style.paddingLeft = '64pt';

        // Widths (Special attention to Tailwind bracket notation)
        if (classList.includes('w-full')) el.style.width = '100%';
        if (classList.includes('w-16')) el.style.width = '64pt';
        if (classList.includes('w-20')) el.style.width = '80pt';
        
        // Match bracket notation (Tailwind v3/v4 style)
        el.className.split(' ').forEach(cls => {
          if (cls.startsWith('w-[') && cls.endsWith(']')) {
            el.style.width = cls.substring(3, cls.length - 1);
          }
          if (cls.startsWith('p-[') && cls.endsWith(']')) {
            el.style.padding = cls.substring(3, cls.length - 1);
          }
          if (cls.startsWith('m-[') && cls.endsWith(']')) {
            el.style.margin = cls.substring(3, cls.length - 1);
          }
          if (cls.startsWith('mt-[') && cls.endsWith(']')) {
            el.style.marginTop = cls.substring(4, cls.length - 1);
          }
          if (cls.startsWith('mb-[') && cls.endsWith(']')) {
            el.style.marginBottom = cls.substring(4, cls.length - 1);
          }
        });

        // Grid specifically for Word (Table-like fallback)
        if (classList.includes('grid')) {
          el.style.display = 'block';
          el.style.width = '100%';
        }
        
        // Children of doc-grid
        if (el.parentElement?.classList.contains('grid')) {
           el.style.display = 'inline-block';
           el.style.width = '45%';
           el.style.margin = '2%';
           el.style.verticalAlign = 'top';
        }

        // Borders
        if (classList.includes('border-b')) el.style.borderBottom = '1px solid black';
        if (classList.includes('border-2')) el.style.border = '2px solid #ccc';
        if (classList.includes('border-dashed')) el.style.borderStyle = 'dashed';
        if (classList.includes('border-black')) el.style.borderColor = 'black';

        // Backgrounds
        if (classList.includes('bg-gray-50')) el.style.backgroundColor = '#f9fafb';

        // Page Breaks
        if (classList.includes('html2pdf__page-break') || classList.includes('print:break-after-page') || el.style.pageBreakAfter === 'always') {
          el.style.pageBreakAfter = 'always';
          (el.style as any).msoBreakType = 'page-break';
          // MS Word specific explicit page break
          el.insertAdjacentHTML('afterend', '<br clear="all" style="page-break-before:always; mso-break-type:page-break" />');
        }
      });

      // Handle section containers that wrap pages (like Internship Experience)
      const sectionContainers = clone.querySelectorAll('#internship-experience-section, #documentation-section');
      sectionContainers.forEach(container => {
         (container as HTMLElement).style.display = 'contents';
      });

      // Process images to Base64 for embedding
      const images = Array.from(clone.querySelectorAll('img'));
      const originalImages = Array.from(container.querySelectorAll('img'));
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        const originalImg = originalImages[i] as HTMLImageElement;
        let src = img.src;

        // Ensure we handle absolute URLs correctly before fetching
        if (src.startsWith('/')) {
          src = window.location.origin + src;
        }
        
        // Use a safe width for Word
        const detectedWidth = originalImg?.naturalWidth || originalImg?.clientWidth || originalImg?.width || 400;
        const displayWidth = detectedWidth > 0 ? Math.min(detectedWidth, 650) : 400;

        img.setAttribute('width', displayWidth.toString());
        img.style.width = `${displayWidth}pt`; // Using pt for Word
        img.style.height = 'auto';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        img.style.margin = '10pt auto';

        // Check if image is hidden in UI
        if (window.getComputedStyle(originalImg).display === 'none') {
           img.style.display = 'none';
           continue; 
        }

        // If it's already a data URL, we still need to set the attributes above, then continue
        if (src.startsWith('data:')) {
          continue;
        }
        
        try {
          const res = await fetch(src);
          if (!res.ok) throw new Error('Fetch failed');
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.src = base64;
          img.setAttribute('src', base64); // Set both for max compatibility
        } catch (err) {
          console.warn('Failed to embed image in Word export:', src, err);
          // Fallback to absolute URL if fetch fails
          img.src = src;
        }
      }

      const msoOrientation = (reportType === 'weekly' || reportType === 'monthly') ? 'landscape' : 'portrait';
      const msoSize = (reportType === 'weekly' || reportType === 'monthly') ? '13in 8.5in' : '8.27in 11.69in';

      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>OJT Report</title>
          <style>
            @page OjtSection {
              size: ${msoSize};
              mso-page-orientation: ${msoOrientation};
              margin: 1.0in 1.0in 1.0in 1.0in;
            }
            div.OjtSection { page: OjtSection; }
            body { font-family: "Times New Roman", Times, serif; font-size: 12pt; }
            img { display: block; margin: 10px auto; max-width: 100%; }
          </style>
        </head>
        <body>
          <div class="OjtSection">
            ${clone.innerHTML}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OJT_Report_${(profile?.name || 'Student').replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to initiate Word export:', err);
    }
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
    console.log("Auto-generation started...");
    
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      alert('Gemini API Key is missing. Please set it in the Settings menu.');
      return;
    }

    if (entries.length === 0) {
      alert('You have no daily entries yet. Please log some activities first!');
      return;
    }

    try {
      setIsGenerating(true);
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: apiKey! });

      const cleanJson = (text: string) => {
        try {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleaned);
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw e;
        }
      };

      let generatedCount = 0;

      // 1. Generate Weekly Summaries
      console.log(`Checking ${groupedEntries.length} weeks...`);
      for (const [weekKey, weekEntries] of groupedEntries) {
        const firstEntryDate = parseISO(weekEntries[0].date);
        const weekStart = startOfWeek(firstEntryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(firstEntryDate, { weekStartsOn: 1 });
        
        const existingReport = (weeklyReports || []).find((r: any) => {
          const rStart = parseISO(r.weekStartDate);
          return format(rStart, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd');
        });

        // Generate if report doesn't exist OR if the narrative summary is missing
        if (!existingReport || !existingReport.narrative || !existingReport.accomplishment) {
          console.log(`Generating weekly report for: ${format(weekStart, 'yyyy-MM-dd')}`);
          const startDateStr = format(weekStart, 'yyyy-MM-dd');
          const endDateStr = format(weekEnd, 'yyyy-MM-dd');
          
          const entriesText = JSON.stringify(
            weekEntries.map(e => ({ 
              date: e.date, 
              accomplishment: e.accomplishment, 
              problemsEncountered: e.problemsEncountered,
              actionTaken: e.actionTaken
            }))
          );

          const prompt = `Generate a Weekly OJT journal report summary as JSON.
          Date Range: ${startDateStr} to ${endDateStr}
          Entries: ${entriesText}
          Task: Base the "problemsEncountered" and "actionTaken" on the provided accomplishments. If no specific problems are listed, deduce or invent a minor, realistic problem related to the tasks (e.g., software bug, minor delay, clarification needed) and a corresponding logical action taken. Do NOT say "None" or "N/A".
          Style: Use VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words, big vocabulary or formal corporate jargon.
          Return JSON: {"accomplishment": "...", "problemsEncountered": "...", "actionTaken": "...", "narrative": "reflection summary", "commentsAndSuggestions": "notes"}`;

          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                responseMimeType: "application/json"
              }
            });
            
            if (response.text) {
              const parsed = cleanJson(response.text);
              const reportData = {
                weekStartDate: startDateStr,
                weekEndDate: endDateStr,
                accomplishment: parsed.accomplishment || (existingReport?.accomplishment) || '',
                problemsEncountered: parsed.problemsEncountered || (existingReport?.problemsEncountered) || '',
                actionTaken: parsed.actionTaken || (existingReport?.actionTaken) || '',
                narrative: parsed.narrative || '',
                commentsAndSuggestions: parsed.commentsAndSuggestions || (existingReport?.commentsAndSuggestions) || '',
                remarks: existingReport?.remarks || ''
              };

              if (existingReport) {
                updateWeeklyReport(existingReport.id, reportData);
              } else {
                addWeeklyReport(reportData);
              }
              generatedCount++;
            }
          } catch (apiErr) {
            console.error("Weekly generation error:", apiErr);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 2. Generate Monthly Summaries
      console.log(`Checking ${groupedEntriesByMonth.length} months...`);
      for (const [monthKey, monthEntries] of groupedEntriesByMonth) {
        const firstEntryDate = parseISO(monthEntries[0].date);
        const monthStart = startOfMonth(firstEntryDate);
        const monthStr = format(monthStart, 'yyyy-MM');
        
        const existingReport = (monthlyReports || []).find((r: any) => r.month === monthStr);

        if (!existingReport || !existingReport.narrative || !existingReport.accomplishment) {
          console.log(`Generating monthly report for: ${monthStr}`);
          const entriesText = JSON.stringify(
            monthEntries.map(e => ({ 
              date: e.date, 
              accomplishment: e.accomplishment, 
              problemsEncountered: e.problemsEncountered,
              actionTaken: e.actionTaken
            }))
          );

          const prompt = `Generate a Monthly OJT journal report summary as JSON.
          Month: ${format(monthStart, 'MMMM yyyy')}
          Entries: ${entriesText}
          Task: Base the "problemsEncountered" and "actionTaken" on the provided accomplishments. If no specific problems are listed, deduce or invent a minor, realistic problem related to the tasks (e.g., software bug, minor delay, clarification needed) and a corresponding logical action taken. Do NOT say "None" or "N/A".
          Style: Use VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words, big vocabulary or formal corporate jargon.
          Return JSON: {"accomplishment": "...", "problemsEncountered": "...", "actionTaken": "...", "narrative": "reflection summary", "commentsAndSuggestions": "notes"}`;

          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: {
                responseMimeType: "application/json"
              }
            });

            if (response.text) {
              const parsed = cleanJson(response.text);
              const reportData = {
                month: monthStr,
                accomplishment: parsed.accomplishment || (existingReport?.accomplishment) || '',
                problemsEncountered: parsed.problemsEncountered || (existingReport?.problemsEncountered) || '',
                actionTaken: parsed.actionTaken || (existingReport?.actionTaken) || '',
                narrative: parsed.narrative || '',
                commentsAndSuggestions: parsed.commentsAndSuggestions || (existingReport?.commentsAndSuggestions) || '',
                remarks: existingReport?.remarks || ''
              };

              if (existingReport) {
                updateMonthlyReport(existingReport.id, reportData);
              } else {
                addMonthlyReport(reportData);
              }
              generatedCount++;
            }
          } catch (apiErr) {
            console.error("Monthly generation error:", apiErr);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 3. Generate Narrative Sections
      console.log("Checking narrative sections...");
      const isDefault = (text: string) => !text || text.length < 20 || text.includes(' Almighty God') || text.includes(' vital role in my learning journey') || text.includes('[Your Name]') || text.includes(' Lorem ipsum') || text.includes(' lorem ipsum');
      
      const sectionsToGenerate = [
        isDefault(profile?.introText || ''),
        isDefault(profile?.competenciesText || ''),
        isDefault(profile?.learningsText || ''),
        isDefault(profile?.impactText || ''),
        isDefault(profile?.conclusionText || '')
      ].some(val => val);

      if (sectionsToGenerate) {
        console.log("Generating narrative report sections...");
        const allEntriesText = JSON.stringify(entries.slice(-50).map(e => ({ date: e.date, task: e.accomplishment })));
        const prompt = `Generate Narrative Report sections for OJT based on these student entries: ${allEntriesText}.
        Student: ${profile?.name || ''}
        Host: ${profile?.hostEstablishment || ''}
        Degree: ${profile?.courseAndYear || ''}
        Target Sections: Introduction, Competencies, Impact, Learning, Conclusion.
        Style: Use VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words, big vocabulary or formal corporate jargon.
        Return JSON ONLY: {"introText": "...", "competenciesText": "...", "impactText": "...", "learningsText": "...", "conclusionText": "..."}`;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          if (response.text) {
            const parsed = cleanJson(response.text);
            setProfile({
              introText: parsed.introText || profile?.introText || '',
              competenciesText: parsed.competenciesText || profile?.competenciesText || '',
              impactText: parsed.impactText || profile?.impactText || '',
              learningsText: parsed.learningsText || profile?.learningsText || '',
              conclusionText: parsed.conclusionText || profile?.conclusionText || ''
            });
            generatedCount++;
          }
        } catch (apiErr) {
          console.error("Narrative generation error:", apiErr);
        }
      }

      if (generatedCount > 0) {
        alert(`Successfully auto-generated ${generatedCount} sections and/or reports!`);
      } else {
        alert('All summaries and narrative sections are already completed and up to date.');
      }
    } catch (err: any) {
      console.error("General OJT Generation Error:", err);
      alert(`There was an error during generation: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      console.log("Auto-generation finished.");
    }
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          @media print {
            @page {
              size: ${(reportType === 'weekly' || reportType === 'monthly') ? '330.2mm 215.9mm landscape' : '210mm 297mm portrait'};
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
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setZoomValue(isNaN(val) ? 0.8 : val);
            }} 
            className="w-24 md:w-32"
          />
          <span className="text-xs text-muted-foreground w-10">{Math.round(zoomValue * 100)}%</span>
        </div>
      </div>

      {reportType === 'narrative' && profile.documentationImages && profile.documentationImages.length > 0 && (
        <div className="mb-6 bg-blue-50/30 border border-blue-100 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-bold flex items-center gap-2 text-blue-900">
              <ImageIcon className="h-4 w-4" />
              Photo Documentation Gallery ({profile.documentationImages.length} images)
            </h3>
            <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
              Auto-laid out: 6 images per page (3x2 grid)
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {profile.documentationImages.map((img) => (
              <div key={img.id} className="relative flex-none w-40 group">
                <div className="aspect-[4/3] bg-white border border-blue-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => {
                    setProfile({
                      documentationImages: profile.documentationImages?.filter(i => i.id !== img.id)
                    });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <input 
                  type="text"
                  placeholder="Alt/Caption..."
                  className="w-full mt-1.5 text-[10px] bg-white border border-blue-100 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none"
                  value={img.caption || ''}
                  onChange={(e) => {
                    setProfile({
                      documentationImages: profile.documentationImages?.map(i => 
                        i.id === img.id ? { ...i, caption: e.target.value } : i
                      )
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
          {reportType === 'narrative' && (
            <Button 
              onClick={() => setIsNarrativeModalOpen(true)} 
              variant="outline" 
              className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Customize Text
            </Button>
          )}

          {reportType === 'narrative' && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  const files = Array.from(target.files || []);
                  if (files.length === 0) return;

                  const newImages: any[] = [];
                  let processedCount = 0;

                  files.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        newImages.push({
                          id: (Math.random() * 1000000).toString(36),
                          url: event.target.result as string,
                          caption: ''
                        });
                      }
                      processedCount++;
                      if (processedCount === files.length) {
                        setProfile({
                          documentationImages: [
                            ...(profile?.documentationImages || []),
                            ...newImages
                          ]
                        });
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Photos
              </Button>
            </div>
          )}
          
          <Button 
            onClick={handleGenerateMissingSummaries} 
            variant="outline" 
            className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 disabled:opacity-50"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Auto-Generate Summaries'}
          </Button>
          {reportType === 'narrative' && (
            <Button 
              onClick={handleExportWord} 
              variant="outline" 
              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 disabled:opacity-50"
              disabled={entries.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export to Word
            </Button>
          )}
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 disabled:opacity-50"
            disabled={entries.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
          <Button onClick={handlePrint} disabled={entries.length === 0}>
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
              <MonthlyJournalTemplate profile={profile} weeklyReports={weeklyReports} monthlyReports={monthlyReports} />
            )}
          </div>
        </div>
      </div>
      
      <NarrativeReviseModal 
        isOpen={isNarrativeModalOpen} 
        onClose={() => setIsNarrativeModalOpen(false)} 
      />
    </div>
  );
}

function NarrativeReportTemplate({ profile, groupedEntries, weeklyReports }: { profile: any, groupedEntries: any[], weeklyReports?: any[] }) {
  if (!groupedEntries || groupedEntries.length === 0) {
    return <div className="text-muted-foreground p-8 text-center bg-white border border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto print:hidden">No daily entries available. Please add them in the Daily Entries tab.</div>;
  }

  const pageWrapperStyle = {
    fontFamily: '"Times New Roman", Times, serif', 
    pageBreakAfter: 'always',
    breakAfter: 'page',
    width: '210mm',
    height: 'auto',
    minHeight: '297mm',
    boxSizing: 'border-box' as const,
    position: 'relative' as const
  };

  const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white shadow-lg print:shadow-none px-[20mm] pt-[10mm] pb-[20mm] text-black print:px-[20mm] print:pt-[10mm] print:pb-[20mm] print:m-0 break-inside-avoid print:break-after-page html2pdf__page-break flex flex-col" style={pageWrapperStyle}>
      {children}
    </div>
  );

  return (
    <>
      {/* 1. Title Page */}
      <Page>
        <div className="flex flex-col h-full items-center justify-center text-center mt-8 mb-24" style={{ textAlign: 'center' }}>
          <p className="font-bold" style={{ textAlign: 'center', margin: 0 }}>A Narrative Report in</p>
          <br /><br />
          <p style={{ textAlign: 'center', margin: 0 }}>Computer Science Internship</p>
          <p style={{ textAlign: 'center', margin: 0 }}>Undertaken at {profile.hostEstablishment || 'Local Government Unit of Mambusao'}</p>
          <p style={{ textAlign: 'center', margin: 0 }}>Located at {profile.address || 'Poblacion Proper, Mambusao, Capiz'}</p>
          <br /><br /><br /><br />
          <p style={{ textAlign: 'center', margin: 0 }}>In Partial Fulfillment of the requirements for the course</p>
          <p style={{ textAlign: 'center', margin: 0 }}>Bachelor of Science in {profile.courseAndYear?.includes('BSCS') ? 'Computer Science' : (profile.courseAndYear || 'Computer Science')}</p>
          <br /><br /><br /><br />
          <p style={{ textAlign: 'center', margin: 0 }}>Submitted to:</p>
          <br />
          <p className="font-bold uppercase" style={{ textAlign: 'center', margin: 0 }}>{profile.facilitator || 'PROF. ART JAYSON L. OSUYOS'}</p>
          <p style={{ textAlign: 'center', margin: 0 }}>BSCS SIPP Coordinator/Facilitator</p>
          <br /><br /><br /><br />
          <p style={{ textAlign: 'center', margin: 0 }}>Submitted by:</p>
          <br />
          <p className="font-bold uppercase" style={{ textAlign: 'center', margin: 0 }}>{profile.name || 'Student Intern'}</p>
          <p style={{ textAlign: 'center', margin: 0 }}>Student Intern</p>
          <br /><br /><br /><br />
          <p style={{ textAlign: 'center', margin: 0 }}>{new Date().getFullYear()}</p>
        </div>
      </Page>

      {/* 2. Dedication & Acknowledgement */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 text-lg">DEDICATION & ACKNOWLEDGEMENT</div>
        <div className="mt-8 text-justify indent-8 leading-relaxed whitespace-pre-wrap">
          {profile.dedicationText || `I dedicate this work first and foremost to the Almighty God for the strength, wisdom, and protection He provided throughout my training journey.\n\nTo my beloved parents, for their endless love, support, and encouragement. Their sacrifices have been the foundation of my education and have motivated me to do my best in every challenge I face.\n\nTo my professors and facilitators at CAPIZ STATE UNIVERSITY - MAMBUSAO SATELLITE CAMPUS, especially to ${profile.facilitator || 'PROF. ART JAYSON L. OSUYOS'}, for the guidance and knowledge they have shared.\n\nTo the staff and personnel of the ${profile.hostEstablishment || 'Municipal Disaster Risk Reduction and Management Office (MDRRMO)'}, for the opportunity to have my On-the-Job Training in their office. I am deeply grateful for the trust and for allowing me to experience first-hand the duties and responsibilities in your workplace.\n\nFinally, to my friends and fellow trainees, for the camaraderie and for sharing the challenges and successes during our training. This experience has been more meaningful because of your support.`}
        </div>
      </Page>

      {/* 3. Table of Contents */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 mb-12 text-lg">TABLE OF CONTENTS</div>
        <table className="mx-auto w-[70%] border-none text-left border-collapse" style={{ padding: '0 10%' }}>
          <tbody>
            <tr><td className="border-none font-bold text-right pr-6 py-2 w-16" style={{ width: '40pt', paddingRight: '15pt' }}>I.</td><td className="border-none font-bold py-2">Title Page</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>II.</td><td className="border-none font-bold py-2">Dedication & Acknowledgement</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>III.</td><td className="border-none font-bold py-2">Table of Contents</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>IV.</td><td className="border-none font-bold py-2">Introduction</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>V.</td><td className="border-none font-bold py-2">Internship Experience</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>VI.</td><td className="border-none font-bold py-2">Competencies</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>VII.</td><td className="border-none font-bold py-2">Impact</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>VIII.</td><td className="border-none font-bold py-2">Learning</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2" style={{ paddingRight: '15pt' }}>IX.</td><td className="border-none font-bold py-2">Conclusion</td></tr>
            <tr><td className="border-none font-bold text-right pr-6 py-2 align-top" style={{ paddingRight: '15pt' }}>X.</td><td className="border-none font-bold py-2">Documentation<br/>
              <span className="font-normal block mt-2 ml-4" style={{ marginLeft: '15pt', display: 'block' }}>&bull; Certificate of Completion</span>
              <span className="font-normal block mt-2 ml-4" style={{ marginLeft: '15pt', display: 'block' }}>&bull; OJT Photo Documentation</span>
            </td></tr>
          </tbody>
        </table>
      </Page>

      {/* 4. Introduction */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">IV. INTRODUCTION</div>
        <div className="text-justify indent-8 leading-relaxed mb-6 whitespace-pre-wrap">
          {profile.introText || `On-the-Job Training (OJT) played a vital role in my learning journey as it provided real workplace experience. It helped me apply the knowledge and skills I gained from school in an actual working environment. Through this training, I was able to better understand how tasks are performed in a real emergency response setting and how important it is to follow proper procedures in every situation.\n\nDuring my training, I was able to observe how a real emergency response office operates. I learned how different tasks are carried out in the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)'}, especially in responding to emergencies and assisting the community. This experience also helped me understand the importance of discipline, teamwork, responsibility, and proper communication in the workplace.\n\nOverall, this experience helped me become more aware of how disaster response services operate in the community. It gave me valuable learning that improved my skills, increased my confidence, and prepared me for future challenges in a professional environment.`}
        </div>
      </Page>

      {/* 5. Internship Experience (Weekly Reports) */}
      <div id="internship-experience-section">
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
            <Page key={weekKey}>
              <div className="text-center font-bold uppercase mt-2 mb-4 text-lg underline">V. INTERNSHIP EXPERIENCE</div>
              <div className="text-center font-bold uppercase mb-4 text-[13pt]">
                WEEK {index + 1}: {profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT OF MAMBUSAO'}
              </div>
              <p className="text-center mb-6">Date Covered: {displayDateCovered}</p>
              
              <table className="w-full border-collapse border border-black text-sm mb-6">
                <thead>
                  <tr>
                    <th className="border border-black p-2 w-[15%] text-center uppercase">DAY</th>
                    <th className="border border-black p-2 w-[20%] text-center uppercase">DATE</th>
                    <th className="border border-black p-2 w-[50%] text-center uppercase">DAILY ACCOMPLISHMENT REPORT</th>
                    <th className="border border-black p-2 w-[15%] text-center uppercase">NO. OF WORKING HOURS</th>
                  </tr>
                </thead>
                <tbody>
                  {weekEntries.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="border border-black p-2 text-center capitalize font-bold align-middle">
                        {format(parseISO(entry.date), 'EEEE')}
                      </td>
                      <td className="border border-black p-2 text-center align-middle whitespace-nowrap">
                        {format(parseISO(entry.date), 'MMMM dd, yyyy')}
                      </td>
                      <td className="border border-black p-2 whitespace-pre-wrap">
                        {entry.status === 'holiday' ? 'Holiday' : entry.status === 'absent' ? 'Absent' : entry.accomplishment}
                      </td>
                      <td className="border border-black p-2 text-center font-bold align-middle bg-gray-50/50">
                        {entry.workingHours > 0 ? entry.workingHours : '---'}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="border border-black p-2 text-right font-bold">
                      Total No. of Hours :
                    </td>
                    <td className="border border-black p-2 text-center font-bold">
                      {totalHours} Hours
                    </td>
                  </tr>
                </tbody>
              </table>

              {report?.narrative && (
                <div className="mt-8 text-justify indent-8 leading-relaxed whitespace-pre-wrap">
                  {report.narrative}
                </div>
              )}
            </Page>
          );
        })}
      </div>

      {/* 6. Competencies */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">VI. COMPETENCIES</div>
        <div className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">
          {profile.competenciesText || `I completed my ${profile.requiredHours || '200'} hours of On-the-Job Training at the ${profile.hostEstablishment || 'Local Government Unit (LGU) of Mambusao'}, specifically at the Municipal Disaster Risk Reduction and Management Office (MDRRMO). During my ${profile.requiredHours || '200'} hours of training, I was given the opportunity to experience different activities and tasks related to emergency response and disaster management. This exposure allowed me to observe how the office operates in handling emergencies and providing assistance to the community.\n\nThroughout my training, I developed basic competencies in emergency response, patient care, and disaster preparedness. I also learned how to assist in different emergency situations, follow proper procedures in the workplace, and work with discipline and teamwork. In addition, my ${profile.requiredHours || '200'} hours helped me gain more confidence in performing tasks and improved my understanding of the importance of quick and proper response during emergencies. Overall, the experience was very helpful in enhancing my skills and preparing me for future work.`}
        </div>
      </Page>

      {/* 7. Impact */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">VII. IMPACT</div>
        <div className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">
          {profile.impactText || `My ${profile.requiredHours || '200'} HOURS OF TRAINING at the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO) MAMBUSAO'} had a great impact on my personal and professional development. It helped me become more confident in performing tasks and more responsible in handling assigned duties. Through this experience, I also learned the importance of discipline in the workplace and how it contributes to the proper flow of work, especially in emergency situations.\n\nI also learned the importance of teamwork and cooperation when responding to emergencies. I realized that every role in disaster response is important, and each member of the team contributes to saving lives and ensuring safety. This training helped me understand how effective communication and coordination are essential during emergency operations.\n\nOverall, the ${profile.requiredHours || '200'} HOURS OF TRAINING motivated me to improve myself and develop my skills further. It strengthened my interest in emergency and rescue services and made me more aware of the importance of being prepared in handling disaster and emergency situations. It also helped me understand the value of proper response and assistance in ensuring the safety of the community.`}
        </div>
      </Page>

      {/* 8. Learning */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">VIII. LEARNING</div>
        <div className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">
          {profile.learningsText || `My ${profile.requiredHours || '200'} HOURS ON-THE-JOB TRAINING at the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT (LGU) MAMBUSAO – MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)'} gave me real experience in a workplace setting. It allowed me to see how the office works in helping people during emergencies and disasters. I was able to observe how the office responds to different situations in the community and how important their role is in ensuring public safety.\n\nDuring my ${profile.requiredHours || '200'} HOURS, I learned and experienced different tasks that helped me improve my skills and knowledge. I was exposed to emergency response activities, patient care, and disaster preparedness. I also learned the importance of following proper procedures, working as a team, and staying disciplined in the workplace. Overall, this training helped me gain confidence and better understanding of how emergency services work in real life situations.`}
        </div>
      </Page>

      {/* 9. Conclusion */}
      <Page>
        <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">IX. CONCLUSION</div>
        <div className="text-justify indent-8 leading-relaxed whitespace-pre-wrap">
          {profile.conclusionText || `My ${profile.requiredHours || '200'} HOURS OF ON-THE-JOB TRAINING at the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT (LGU) MAMBUSAO – MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)'} was a very meaningful and valuable experience. It gave me real-life exposure to emergency response work and allowed me to observe how the office handles different emergency situations in the community. This experience helped me understand the importance of readiness, quick action, and proper coordination in times of emergencies.\n\nDuring my training, I was able to develop important skills such as first aid, CPR, patient handling, and the proper use of rescue equipment. I also learned how to apply proper procedures in responding to emergencies, which is very important in ensuring safety and saving lives. In addition, I gained knowledge on how teamwork and communication play a big role in effective emergency response.\n\nOverall, this ${profile.requiredHours || '200'} HOURS OF TRAINING prepared me to become more competent, responsible, and confident in handling tasks related to emergency situations. It helped me improve my skills, develop discipline, and become more aware of the importance of helping others during times of need.`}
        </div>
      </Page>

        {/* 10. Documentation */}
        <div id="documentation-section">
          <Page>
            <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">X. DOCUMENTATION</div>
            <div className="text-center font-bold uppercase mt-8 mb-8 text-lg italic">Certificate of Completion</div>
            {profile.certificateImageUrl ? (
               <div className="flex justify-center mt-8">
                 <img 
                   src={profile.certificateImageUrl} 
                   alt="Certificate of Completion" 
                   className="max-w-full max-h-[700px] object-contain border border-gray-300 shadow-sm"
                 />
               </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-gray-300 rounded-lg mx-8 mt-16 text-muted-foreground bg-gray-50">
                <span>[Insert Certificate Image Here in Word]</span>
                <span className="text-xs mt-2">Go to Settings to upload your scanned certificate</span>
              </div>
            )}
          </Page>

          {profile?.documentationImages && profile.documentationImages.length > 0 ? (
            (() => {
              const chunkArrayLocal = (arr: any[], size: number) => {
                const chunked = [];
                for (let i = 0; i < arr.length; i += size) {
                  chunked.push(arr.slice(i, i + size));
                }
                return chunked;
              };
              const chunks = chunkArrayLocal(profile.documentationImages, 6);
              
              return chunks.map((chunk, pageIdx) => (
                <Page key={`photo-page-${pageIdx}`}>
                  <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">X. DOCUMENTATION</div>
                  <div className="text-center font-bold uppercase mb-4 text-lg italic">OJT Photo Documentation</div>
                  
                  <div className="grid grid-cols-2 grid-rows-3 gap-4 h-[220mm] mt-4">
                    {chunk.map((img: any) => (
                      <div key={img.id} className="flex flex-col items-center border border-gray-200 p-2 rounded bg-white shadow-sm overflow-hidden">
                        <div className="w-full h-[88%] flex items-center justify-center bg-gray-50 border border-gray-100 rounded overflow-hidden">
                          <img 
                            src={img.url} 
                            alt={img.caption || 'Documentation Photo'} 
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="w-full mt-2 text-center text-[10px] font-normal leading-tight italic truncate">
                          {img.caption || 'Photo Documentation'}
                        </div>
                      </div>
                    ))}
                    {/* Fill empty spots in the 3x2 grid to maintain layout if needed, though grid handles it */}
                  </div>
                </Page>
              ));
            })()
          ) : (
            <Page>
              <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">X. DOCUMENTATION</div>
              <div className="text-center font-bold uppercase mt-8 mb-8 text-lg italic">OJT Photo Documentation</div>
              <div className="grid grid-cols-2 gap-4 px-4 mt-8">
                 <div className="h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-muted-foreground bg-gray-50 max-w-full overflow-hidden text-sm">[Photo 1] Paste here</div>
                 <div className="h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-muted-foreground bg-gray-50 max-w-full overflow-hidden text-sm">[Photo 2] Paste here</div>
                 <div className="h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-muted-foreground bg-gray-50 max-w-full overflow-hidden text-sm">[Photo 3] Paste here</div>
                 <div className="h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-muted-foreground bg-gray-50 max-w-full overflow-hidden text-sm">[Photo 4] Paste here</div>
              </div>
            </Page>
          )}
        </div>

      {/* 12. Vision/Mission */}
      <Page>
        <div className="mb-8">
          <div className="font-bold uppercase mb-4 text-[13pt]">VISION</div>
          <div className="leading-relaxed">Center of Academic Excellence Delivering Quality Service to all.</div>
        </div>

        <div className="mb-8">
          <div className="font-bold uppercase mb-4 text-[13pt]">MISSION</div>
          <div className="leading-relaxed text-justify">
            Capiz State University is Committed to provide advanced knowledge and innovation; develop skills, talents and values; undertake relevant research, development and extension services; promote entrepreneurship and environmental consciousness; enhance industry collaboration and linkages with partner agencies.
          </div>
        </div>

        <div className="mb-8">
          <div className="font-bold uppercase mb-4 text-[13pt]">GOALS</div>
          <ol className="list-decimal pl-8 space-y-2 leading-relaxed">
            <li style={{ listStyleType: 'decimal' }}>Globally competitive graduates</li>
            <li style={{ listStyleType: 'decimal' }}>Institutionalized research culture</li>
            <li style={{ listStyleType: 'decimal' }}>Responsive and sustainable extension services</li>
            <li style={{ listStyleType: 'decimal' }}>Maximized profit of viable agro-industrial business ventures</li>
            <li style={{ listStyleType: 'decimal' }}>Effective and efficient administration.</li>
          </ol>
        </div>

        <div className="mb-8">
          <div className="font-bold uppercase mb-4 text-[13pt]">OBJECTIVES</div>
          <ol className="list-decimal pl-8 space-y-2 leading-relaxed">
            <li style={{ listStyleType: 'decimal' }}>Create an environment of shared leadership and responsibilities with competent administrator.</li>
            <li style={{ listStyleType: 'decimal' }}>Provide relevant trainings and seminars to faculty, staff, and students.</li>
            <li style={{ listStyleType: 'decimal' }}>Produce highly competitive graduates</li>
            <li style={{ listStyleType: 'decimal' }}>Conduct relevant and applied researches</li>
            <li style={{ listStyleType: 'decimal' }}>Extend financial support and manpower for outreach activities.</li>
          </ol>
        </div>

        <div className="mb-8">
          <div className="font-bold uppercase mb-4 text-[13pt]">QUALITY POLICY</div>
          <div className="leading-relaxed text-justify">
            <span className="font-bold">CAPSU</span> is committed to be the center of Academic Excellence Delivering the quality service to all by:
            <ul className="list-disc pl-8 mt-2 space-y-1">
              <li style={{ listStyleType: 'disc' }}>Continuing innovations and quality improvements cultivating an efficient and effective environment for maximum clientele satisfaction;</li>
              <li style={{ listStyleType: 'disc' }}>Adhering to laws and regulations, global standards and environmental change requirements;</li>
              <li style={{ listStyleType: 'disc' }}>Participating and sustainable projects for inclusive economic growth;</li>
              <li style={{ listStyleType: 'disc' }}>Showcasing quality outputs; and</li>
              <li style={{ listStyleType: 'disc' }}>Upholding values and integrity and nurturing talents and skills for global competitiveness.</li>
            </ul>
          </div>
        </div>
      </Page>

      {/* 13. Signatures */}
      <Page>
        <div className="mt-auto pb-12">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-[45%] text-center align-bottom">
                  <div className="text-[10px] font-bold mb-4 text-left uppercase underline">SUBMITTED BY:</div>
                  <div className="relative h-16 flex items-end justify-center mb-1">
                    {profile.signatureImageUrl && (
                      <img 
                        src={profile.signatureImageUrl} 
                        className="absolute bottom-0 h-16 w-auto object-contain" 
                        alt="Signature"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="font-bold text-lg leading-none uppercase z-10">{profile.name}</div>
                  </div>
                  <div className="border-b border-black w-full"></div>
                  <div className="text-[10px] uppercase pt-2">Intern / Trainee</div>
                  <div className="text-[10px] pt-1">Date: ________________</div>
                </td>
                <td className="w-[10%]"></td>
                <td className="w-[45%] text-center align-bottom">
                  <div className="text-[10px] font-bold mb-20 uppercase text-left underline">NOTED BY:</div>
                  <div className="font-bold text-lg mb-6 leading-none uppercase">{profile.headOffice}</div>
                  <div className="border-b border-black w-full"></div>
                  <div className="text-[10px] uppercase pt-2">On-Site Supervisor</div>
                  <div className="text-[10px] pt-1">Date: ________________</div>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="h-32"></td>
              </tr>
              <tr>
                <td className="w-[45%] text-center align-bottom mx-auto" colSpan={3}>
                  <div className="text-[10px] font-bold mb-20 uppercase text-center underline">APPROVED BY:</div>
                  <div className="font-bold text-lg mb-6 leading-none uppercase">{profile.facilitator || 'PROF. ART JAYSON L. OSUYOS'}</div>
                  <div className="border-b border-black w-48 mx-auto"></div>
                  <div className="text-[10px] uppercase pt-2">BSCS SIPP Coordinator/Facilitator</div>
                  <div className="text-[10px] pt-1">Date: ________________</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Page>
    </>
  );
}

const linedPaperStyle = {
  backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #000 31px, #000 32px)',
  backgroundSize: '100% 32px',
  lineHeight: '32px',
  paddingTop: '0px',
  paddingBottom: '0px',
};

function MonthlyJournalTemplate({ profile, weeklyReports, monthlyReports }: { profile: any, weeklyReports: any[], monthlyReports: any[] }) {
  if (!weeklyReports || weeklyReports.length === 0) return <div className="text-muted-foreground p-8 text-center bg-white border border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto print:hidden">No reports available. Please generate them in the Weekly Reports tab.</div>;

  // Group weekly reports by month based on weekStartDate
  const reportsByMonth = new Map<string, any[]>();
  weeklyReports.forEach(report => {
    const date = parseISO(report.weekStartDate);
    const key = format(date, 'yyyy-MM');
    if (!reportsByMonth.has(key)) {
      reportsByMonth.set(key, []);
    }
    reportsByMonth.get(key)!.push(report);
  });

  // Sort months
  const sortedMonths = Array.from(reportsByMonth.keys()).sort();

  const getWeekOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + " Week";
  };

  return (
    <>
      {sortedMonths.map((monthKey) => {
        const monthReports = reportsByMonth.get(monthKey)!.sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());
        const monthStart = startOfMonth(parseISO(`${monthKey}-01`));
        const monthEnd = endOfMonth(monthStart);
        const monthReport = (monthlyReports || []).find(r => r.month === monthKey);

        return (
          <div 
            key={monthKey} 
            className="bg-white px-10 pt-4 pb-10 text-black flex flex-col html2pdf__page-break shadow-none" 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: 'always',
              breakAfter: 'page',
              width: '1248px',
              minHeight: '816px',
              height: 'auto',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            {/* Table Header Structure from Image */}
            <table className="w-full border-collapse border border-black mb-4 text-[11px] shrink-0">
              <tbody>
                <tr className="h-20">
                  <td className="border border-black p-2 w-[12%] text-center align-middle">
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
                        <tr className="h-10">
                          <td className="border-b border-black p-1 align-top relative">
                            <div className="flex justify-between w-full">
                               <span className="text-[9px]">Document Type:</span>
                               <span className="font-bold text-sm mx-auto">FORM</span>
                            </div>
                            <div className="text-center text-[9px] absolute bottom-1 w-full left-0">ISO 9001:2015</div>
                          </td>
                        </tr>
                        <tr className="h-10">
                          <td className="p-1 align-top relative">
                            <div className="text-[9px] absolute top-1 left-1">Document Title:</div>
                            <div className="text-center font-bold text-sm mt-3 uppercase tracking-tighter">STUDENT'S MONTHLY JOURNAL REPORT</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td className="border border-black p-0 w-[30%]">
                    <table className="w-full h-full border-none">
                      <tbody>
                        <tr className="h-[20px]">
                          <td className="border-b border-r border-black p-1 text-[9px] w-1/3">Document Code</td>
                          <td className="border-b border-black p-1 font-bold text-center text-[10px]">EAL-F03</td>
                        </tr>
                        <tr className="h-[20px]">
                          <td className="border-b border-r border-black p-1 text-[9px]">Revision No.</td>
                          <td className="border-b border-black p-1 font-bold text-center text-[10px]">00</td>
                        </tr>
                        <tr className="h-[20px]">
                          <td className="border-b border-r border-black p-1 text-[9px]">Effective Date</td>
                          <td className="border-b border-black p-1 font-bold text-center text-[10px]">October 07, 2019</td>
                        </tr>
                        <tr className="h-[20px]">
                          <td className="border-r border-black p-1 text-[9px]">Page</td>
                          <td className="p-1 font-bold text-center text-[10px]">1 of 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Student Info Section - table-based with extra clearance */}
            <div className="mb-8 text-xs uppercase font-bold shrink-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="h-10">
                    <td className="whitespace-nowrap w-[1%] pr-2 align-bottom pb-1">NAME:</td>
                    <td className="border-b border-black align-bottom">
                      <div className="text-center font-normal px-2 leading-none mb-3">{profile.name}</div>
                    </td>
                    <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">COURSE & YEAR:</td>
                    <td className="border-b border-black w-48 align-bottom">
                      <div className="text-center font-normal px-2 leading-none mb-3">{profile.courseAndYear}</div>
                    </td>
                    <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">MAJOR:</td>
                    <td className="border-b border-black w-48 align-bottom">
                      <div className="text-center font-normal px-2 leading-none mb-3">{profile.major}</div>
                    </td>
                  </tr>
                  <tr className="h-10">
                    <td className="whitespace-nowrap w-[1%] pr-2 pt-4 align-bottom pb-1">OFFICE/DEPARTMENT:</td>
                    <td colSpan={5} className="border-b border-black pt-4 align-bottom">
                      <div className="text-left font-normal px-2 leading-none mb-3">{profile.hostEstablishment}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Main Table with BLUE Header */}
            <div className="border border-black flex-col mb-4 shrink-0 overflow-hidden">
              <table className="w-full border-collapse border-none text-[11px] table-fixed">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white h-10">
                    <th className="border border-black p-1 w-[12%] text-center align-middle font-bold uppercase leading-tight">DATE COVERED</th>
                    <th className="border border-black p-1 w-[35%] text-center align-middle font-bold uppercase leading-tight">ACCOMPLISHMENT</th>
                    <th className="border border-black p-1 w-[22%] text-center align-middle font-bold uppercase leading-tight">PROBLEMS ENCOUNTERED</th>
                    <th className="border border-black p-1 w-[20%] text-center align-middle font-bold uppercase leading-tight">ACTION TAKEN</th>
                    <th className="border border-black p-1 w-[11%] text-center align-middle font-bold uppercase leading-tight">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReport ? (
                    <tr className="border-b border-black h-12">
                      <td className="border border-black p-2 text-center align-top font-bold bg-white leading-relaxed">
                        {format(monthStart, 'MMM. d')} - {format(monthEnd, 'MMM. d, yyyy')}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                        {monthReport.accomplishment || monthReport.narrative}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                        {monthReport.problemsEncountered}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                        {monthReport.actionTaken}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                        {monthReport.remarks}
                      </td>
                    </tr>
                  ) : monthReports.map((report, idx) => {
                    const wsStr = format(parseISO(report.weekStartDate), 'MMM. d');
                    const weStr = format(parseISO(report.weekEndDate), idx === monthReports.length - 1 ? 'MMM. d, yyyy' : 'MMM. d');
                    return (
                      <tr key={report.id} className="border-b border-black h-12">
                        <td className="border border-black p-2 text-center align-top font-bold bg-white leading-relaxed">
                          <div>{getWeekOrdinal(idx + 1)}</div>
                          <div className="mt-1 font-normal text-[10px]">({wsStr} to {weStr})</div>
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                          {report.accomplishment || report.narrative}
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                          {report.problemsEncountered}
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                          {report.actionTaken}
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[32px] font-normal" style={linedPaperStyle}>
                          {report.remarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Comments with horizontal lines */}
            <div className="mt-2 mb-12 text-[10px] shrink-0">
              <div className="mb-2 uppercase font-bold">COMMENTS AND SUGGESTIONS:</div>
              <div className="border-b border-black min-h-[24px] mb-1"></div>
              <div className="border-b border-black min-h-[24px] mb-1"></div>
              <div className="border-b border-black min-h-[24px] mb-1"></div>
              <div className="border-b border-black min-h-[24px]"></div>
            </div>

            {/* Signatures Area - absolute stability for PDF */}
            <div className="mt-auto shrink-0 pb-4">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-[45%] text-center align-bottom">
                      <div className="text-[10px] font-bold mb-4 text-left">SUBMITTED:</div>
                      <div className="relative h-16 flex items-end justify-center mb-1">
                        {profile.signatureImageUrl && (
                          <img 
                            src={profile.signatureImageUrl} 
                            className="absolute bottom-0 h-16 w-auto object-contain" 
                            alt="Signature"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="font-normal text-sm leading-none uppercase z-10">{profile.name}</div>
                      </div>
                      <div className="border-b border-black w-full"></div>
                      <div className="text-[10px] uppercase pt-1">Intern/Trainee</div>
                    </td>
                    <td className="w-[10%]"></td>
                    <td className="w-[45%] text-center align-bottom">
                      <div className="text-[10px] font-bold mb-10 uppercase text-left">ATTESTED:</div>
                      <div className="font-normal text-sm mb-4 leading-none uppercase">{profile.headOffice}</div>
                      <div className="border-b border-black w-full"></div>
                      <div className="text-[10px] uppercase pt-1">On-Site Supervisor</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="html2pdf__page-break" />
          </div>
        );
      })}
    </>
  );
}
function WeeklyJournalTemplate({ profile, weeklyReports }: { profile: any, weeklyReports: any[] }) {
  if (!weeklyReports || weeklyReports.length === 0) return <div className="text-muted-foreground p-8 text-center bg-white border border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto print:hidden">No weekly reports available. Please generate them in the Weekly Reports tab.</div>;

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
            className="bg-white px-10 pt-4 pb-10 text-black flex flex-col html2pdf__page-break" 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: 'always',
              breakAfter: 'page',
              width: '1248px',
              minHeight: '816px',
              height: 'auto',
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

          {/* Student Info Section - table-based with efficient spacing */}
          <div className="mb-4 text-xs uppercase font-bold shrink-0">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="h-8">
                  <td className="whitespace-nowrap w-[1%] pr-2 align-bottom pb-1">NAME:</td>
                  <td className="border-b border-black align-bottom">
                    <div className="text-center font-normal px-2 leading-none mb-2">{profile.name}</div>
                  </td>
                  <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">COURSE & YEAR:</td>
                  <td className="border-b border-black w-48 align-bottom">
                    <div className="text-center font-normal px-2 leading-none mb-2">{profile.courseAndYear}</div>
                  </td>
                  <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">MAJOR:</td>
                  <td className="border-b border-black w-48 align-bottom">
                    <div className="text-center font-normal px-2 leading-none mb-2">{profile.major}</div>
                  </td>
                </tr>
                <tr className="h-8">
                  <td className="whitespace-nowrap w-[1%] pr-2 pt-2 align-bottom pb-1">OFFICE/DEPARTMENT:</td>
                  <td colSpan={5} className="border-b border-black pt-2 align-bottom">
                    <div className="text-left font-normal px-2 leading-none mb-2">{profile.hostEstablishment}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col flex-1 my-1 border border-black min-h-[280px]">
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
                  <td className="border-r border-black p-2 align-top whitespace-pre-wrap leading-[32px]" style={linedPaperStyle}>
                    {report.accomplishment}
                  </td>
                  <td className="border-r border-black p-2 align-top whitespace-pre-wrap leading-[32px]" style={linedPaperStyle}>
                    {report.problemsEncountered}
                  </td>
                  <td className="border-r border-black p-2 align-top whitespace-pre-wrap leading-[32px]" style={linedPaperStyle}>
                    {report.actionTaken}
                  </td>
                  <td className="p-2 align-top whitespace-pre-wrap leading-[32px]" style={linedPaperStyle}>
                    {report.remarks}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-2 mb-2 text-xs shrink-0">
            <div className="mb-1 uppercase font-bold">COMMENTS AND SUGGESTIONS:</div>
            <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap mb-1 leading-5">
              {' '}
            </div>
            <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap mb-1 leading-5">
              {' '}
            </div>
            <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap leading-5">
              {' '}
            </div>
          </div>

          <table className="w-full mt-auto border-none text-[10px] font-bold shrink-0 pb-4">
            <tbody>
              <tr>
                <td className="w-[45%] border-none align-bottom text-center">
                  <div className="mb-4 text-left uppercase">SUBMITTED:</div>
                  <div className="relative h-16 flex items-end justify-center mb-1">
                    {profile.signatureImageUrl && (
                      <img 
                        src={profile.signatureImageUrl} 
                        className="absolute bottom-0 h-16 w-auto object-contain" 
                        alt="Signature"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="font-normal text-sm leading-none uppercase z-10">{profile.name}</div>
                  </div>
                  <div className="border-b border-black w-full"></div>
                  <div className="font-normal uppercase pt-1 px-1">Intern/Trainee</div>
                </td>
                <td className="w-[10%] border-none"></td>
                <td className="w-[45%] border-none align-bottom text-center">
                  <div className="mb-4 text-left uppercase">ATTESTED:</div>
                  <div className="h-16 flex items-end justify-center mb-1">
                    <div className="font-normal text-sm leading-none uppercase">{profile.headOffice}</div>
                  </div>
                  <div className="border-b border-black w-full"></div>
                  <div className="font-normal uppercase pt-1 px-1">On-Site Supervisor</div>
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
