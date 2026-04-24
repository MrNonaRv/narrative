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
import { NarrativeReportTemplate } from '@/components/export/NarrativeReportTemplate';
import { WeeklyJournalTemplate } from '@/components/export/WeeklyJournalTemplate';
import { MonthlyJournalTemplate } from '@/components/export/MonthlyJournalTemplate';
import { InternEvaluationTemplate } from '@/components/export/InternEvaluationTemplate';

export default function Export() {
  const { profile, setProfile, entries, weeklyReports, monthlyReports, addWeeklyReport, addMonthlyReport, updateWeeklyReport, updateMonthlyReport, evaluationData, setEvaluationData } = useAppStore();
  const componentRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState<'narrative' | 'weekly' | 'monthly' | 'evaluation'>('narrative');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomValue, setZoomValue] = useState(0.8);
  const [isNarrativeModalOpen, setIsNarrativeModalOpen] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `OJT_Report_${(profile?.name || 'Student').replace(/\s+/g, '_')}`,
  });

  const handleExportPDF = () => {
    const element = componentRef.current;
    if (!element || !profile) return;

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

    let filenameSafeType = '';
    if (reportType === 'narrative') filenameSafeType = 'Narrative';
    if (reportType === 'weekly') filenameSafeType = 'Weekly';
    if (reportType === 'monthly') filenameSafeType = 'Monthly';

    const opt = {
      margin:       0,
      filename:     `OJT_${filenameSafeType}_Report_${(profile?.name || 'Student').replace(/\s+/g, '_')}.pdf`,
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

      // Replace inputs and textareas with standard elements so Word renders them as text, not form controls
      const inputs = clone.querySelectorAll('input');
      inputs.forEach(input => {
        const span = document.createElement('span');
        span.className = input.className;
        span.style.cssText = input.style.cssText;
        span.textContent = input.value || input.placeholder || '';
        input.parentNode?.replaceChild(span, input);
      });

      const textareas = clone.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        const div = document.createElement('div');
        div.className = textarea.className;
        div.style.cssText = textarea.style.cssText;
        div.textContent = textarea.value || textarea.placeholder || '';
        textarea.parentNode?.replaceChild(div, textarea);
      });

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
          if (!el.style.padding) el.style.padding = '3pt';
          if (!el.style.verticalAlign) el.style.verticalAlign = 'top';
        }

        if (el.tagName === 'IMG') {
          if (!el.style.width && !el.style.maxWidth) {
            el.style.maxWidth = '100%';
            el.style.height = 'auto';
          }
          if (!el.style.display) el.style.display = 'block';
          if (!el.style.margin) el.style.margin = '5pt auto';
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
        if (classList.includes('whitespace-nowrap')) el.style.whiteSpace = 'nowrap';
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
        if (classList.includes('border') && !classList.includes('border-none')) el.style.border = '1px solid black';
        if (classList.includes('border-t')) el.style.borderTop = '1px solid black';
        if (classList.includes('border-b')) el.style.borderBottom = '1px solid black';
        if (classList.includes('border-l')) el.style.borderLeft = '1px solid black';
        if (classList.includes('border-r')) el.style.borderRight = '1px solid black';
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
        
        // Ensure explicit width and height exist so MS Word reserves space properly instead of collapsing to 0x0
        const isPhotoGrid = !!img.closest('.photo-grid-table') || !!img.closest('.grid');
        
        // For general safety - safe size for an A4 page with 1-inch margins is 450pt max width
        // For a 3x2 grid, available height is ~690pt. 690 / 3 = ~230pt max height per image safely.
        img.setAttribute('width', isPhotoGrid ? '220' : '450');
        img.setAttribute('height', isPhotoGrid ? '200' : ''); // Forced height attribute for rigorous sizing
        img.style.width = isPhotoGrid ? '220pt' : '450pt';
        img.style.height = isPhotoGrid ? '200pt' : 'auto';
        img.style.display = 'block';
        img.style.maxWidth = '100%';

        // Check if image is hidden in UI
        if (window.getComputedStyle(originalImg).display === 'none') {
           img.style.display = 'none';
           continue; 
        }

        // Keep object-cover visual by setting CSS for Word (where possible)
        if (isPhotoGrid) {
            img.style.objectFit = 'cover';
        }

        // If it's already a data URL, we don't need to fetch it over the network.
        // It's already embedded in the original src. However, we MUST ensure the clone's 
        // src attribute is completely populated with it for the Word Document rendering.
        if (src.startsWith('data:')) {
          img.setAttribute('src', src);
          img.src = src;
          continue;
        }
        
        try {
          // Add timeout to fetch to avoid hanging exports
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const res = await fetch(src, { mode: 'cors', signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!res.ok) throw new Error('Fetch failed');
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          // Update both the src property and attribute on the clone node
          img.src = base64;
          img.setAttribute('src', base64); 
        } catch (err) {
          console.warn('Failed to embed image in Word export (may be blocked by CORS):', src, err);
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

      let filenameSafeType = '';
      if (reportType === 'narrative') filenameSafeType = 'Narrative';
      if (reportType === 'weekly') filenameSafeType = 'Weekly';
      if (reportType === 'monthly') filenameSafeType = 'Monthly';
      if (reportType === 'evaluation') filenameSafeType = 'Evaluation';

      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OJT_${filenameSafeType}_Report_${(profile?.name || 'Student').replace(/\s+/g, '_')}.doc`;
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
        if (!weekEntries || weekEntries.length === 0) continue;
        
        const firstEntryDateStr = weekEntries[0]?.date;
        if (!firstEntryDateStr) continue;

        let firstEntryDate;
        try {
          firstEntryDate = parseISO(firstEntryDateStr);
          if (isNaN(firstEntryDate.getTime())) continue;
        } catch (e) {
          continue;
        }

        const weekStart = startOfWeek(firstEntryDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(firstEntryDate, { weekStartsOn: 1 });
        
        const existingReport = (weeklyReports || []).find((r: any) => {
          if (!r?.weekStartDate) return false;
          try {
            const rStart = parseISO(r.weekStartDate);
            if (isNaN(rStart.getTime())) return false;
            return format(rStart, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd');
          } catch (e) {
            return false;
          }
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
            const { generateContentWithRetry } = await import('@/lib/gemini');
            const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });
            
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
        if (!monthEntries || monthEntries.length === 0) continue;

        const firstEntryDateStr = monthEntries[0]?.date;
        if (!firstEntryDateStr) continue;

        let firstEntryDate;
        try {
          firstEntryDate = parseISO(firstEntryDateStr);
          if (isNaN(firstEntryDate.getTime())) continue;
        } catch (e) {
          continue;
        }

        const monthStart = startOfMonth(firstEntryDate);
        const monthStr = format(monthStart, 'yyyy-MM');
        
        const existingReport = (monthlyReports || []).find((r: any) => r?.month === monthStr);

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
            const { generateContentWithRetry } = await import('@/lib/gemini');
            const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });

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
          const { generateContentWithRetry } = await import('@/lib/gemini');
          const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });

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

      // 4. Generate Intern Evaluation
      console.log("Checking intern evaluation questionnaire...");
      const evalFields = [
        'duties', 'strongestArea', 'improvedMost', 'needImprovement', 
        'challengingSituation', 'overcameChallenge', 'learnedExperience', 
        'qualifiedLinkage', 'recommendation'
      ];
      
      const isEvalEmpty = evalFields.some(field => !evaluationData[field as keyof typeof evaluationData] || (evaluationData[field as keyof typeof evaluationData] as string).trim().length === 0);

      if (isEvalEmpty && entries.length > 0) {
        console.log("Generating evaluation questionnaire...");
        const allEntriesText = JSON.stringify(entries.slice(-50).map(e => ({ date: e.date, task: e.accomplishment, problem: e.problemsEncountered, action: e.actionTaken })));
        const prompt = `Generate realistic short answers for a student intern evaluation questionnaire based on their daily logs. Use simple, brief sentences.
Student Logs: ${allEntriesText}
Profile: ${profile?.courseAndYear || ''} intern at ${profile?.hostEstablishment || ''}.

Return a JSON object with these EXACT keys:
- duties: (Briefly describe regular tasks based on logs)
- strongestArea: (What is the student's strongest performance area?)
- improvedMost: (What did they improve on most?)
- needImprovement: (What area needs the most improvement? Keep it constructive)
- challengingSituation: (Mention a realistic challenge they faced)
- overcameChallenge: (How did they overcome it?)
- learnedExperience: (Overall learning takeaway)
- qualifiedLinkage: (Should the school keep linking with this company? Just answer 'Yes, because...' shortly)

Response should ONLY contain the JSON.`;

        try {
          const { generateContentWithRetry } = await import('@/lib/gemini');
          const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3, { responseMimeType: "application/json" });

          if (response.text) {
            const parsed = cleanJson(response.text);
            setEvaluationData({
              duties: parsed.duties || evaluationData.duties || '',
              strongestArea: parsed.strongestArea || evaluationData.strongestArea || '',
              improvedMost: parsed.improvedMost || evaluationData.improvedMost || '',
              needImprovement: parsed.needImprovement || evaluationData.needImprovement || '',
              challengingSituation: parsed.challengingSituation || evaluationData.challengingSituation || '',
              overcameChallenge: parsed.overcameChallenge || evaluationData.overcameChallenge || '',
              learnedExperience: parsed.learnedExperience || evaluationData.learnedExperience || '',
              qualifiedLinkage: parsed.qualifiedLinkage || evaluationData.qualifiedLinkage || '',
              recommendation: '' // Ensure this stays empty
            });
            generatedCount++;
          }
        } catch (apiErr) {
          console.error("Evaluation generation error:", apiErr);
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
          onChange={(e) => setReportType(e.target.value as 'narrative' | 'weekly' | 'monthly' | 'evaluation')}
        >
          <option value="narrative">Narrative Report (Daily)</option>
          <option value="weekly">Weekly Journal Report</option>
          <option value="monthly">Monthly Journal Report</option>
          <option value="evaluation">Interns Evaluation Form</option>
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
                Photos
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
          <Button 
            onClick={handleExportWord} 
            variant="outline" 
            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 disabled:opacity-50"
            disabled={reportType !== 'evaluation' && entries.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export to Word
          </Button>
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 disabled:opacity-50"
            disabled={reportType !== 'evaluation' && entries.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
          <Button onClick={handlePrint} disabled={reportType !== 'evaluation' && entries.length === 0}>
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
            ) : reportType === 'monthly' ? (
              <MonthlyJournalTemplate profile={profile} weeklyReports={weeklyReports} monthlyReports={monthlyReports} />
            ) : (
              <InternEvaluationTemplate profile={profile} />
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
