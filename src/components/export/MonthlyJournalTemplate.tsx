import React from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ReportHeader } from './ReportHeader';

interface MonthlyJournalTemplateProps {
  profile: any;
  weeklyReports: any[];
  monthlyReports: any[];
}

const linedPaperStyle = {
  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #000 27px, #000 28px)',
  backgroundSize: '100% 28px',
  lineHeight: '28px',
  paddingTop: '0px',
  paddingBottom: '0px',
};

export function MonthlyJournalTemplate({ profile, weeklyReports, monthlyReports }: MonthlyJournalTemplateProps) {
  if (!weeklyReports || weeklyReports.length === 0) return <div className="text-muted-foreground p-8 text-center bg-white border border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto print:hidden">No reports available. Please generate them in the Weekly Reports tab.</div>;

  // Group weekly reports by month based on weekStartDate
  const reportsByMonth = new Map<string, any[]>();
  weeklyReports.forEach(report => {
    if (!report?.weekStartDate) return;
    try {
      const date = parseISO(report.weekStartDate);
      if (isNaN(date.getTime())) return; // skip invalid dates
      const key = format(date, 'yyyy-MM');
      if (!reportsByMonth.has(key)) {
        reportsByMonth.set(key, []);
      }
      reportsByMonth.get(key)!.push(report);
    } catch (e) {
      console.error("Error parsing report date:", report.weekStartDate, e);
    }
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
      {sortedMonths.map((monthKey, monthIndex) => {
        const monthReportsRaw = reportsByMonth.get(monthKey) || [];
        const monthReports = [...monthReportsRaw].sort((a, b) => {
          const timeA = new Date(a.weekStartDate).getTime();
          const timeB = new Date(b.weekStartDate).getTime();
          return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
        });
        
        let monthStart;
        let monthEnd;
        try {
          monthStart = startOfMonth(parseISO(`${monthKey}-01`));
          monthEnd = endOfMonth(monthStart);
          if (isNaN(monthStart.getTime()) || isNaN(monthEnd.getTime())) {
            return null;
          }
        } catch (e) {
          return null; // Skip invalid month keys
        }
        
        const monthReport = (monthlyReports || []).find(r => r && r.month === monthKey);

        return (
          <div 
            key={monthKey} 
            className={`bg-white px-[0.5in] pt-[0.4in] pb-[0.7in] text-black shadow-none flex flex-col ${monthIndex < sortedMonths.length - 1 ? 'html2pdf__page-break' : ''}`} 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: monthIndex < sortedMonths.length - 1 ? 'always' : 'auto',
              breakAfter: monthIndex < sortedMonths.length - 1 ? 'page' : 'auto',
              width: '1248px',
              minHeight: '816px',
              height: 'auto',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <ReportHeader title="STUDENT'S MONTHLY JOURNAL REPORT" documentCode="KAL-F01" />

            {/* Student Info Section */}
            <div className="mb-4 text-[11px] uppercase font-bold shrink-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="h-10">
                    <td className="whitespace-nowrap w-[1%] pr-2 align-bottom pb-1">NAME:</td>
                    <td className="border-b border-black align-bottom pb-1 px-2 text-center font-normal min-w-[250px]">
                      {profile.name}
                    </td>
                    <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">COURSE & YEAR:</td>
                    <td className="border-b border-black w-48 align-bottom pb-1 px-2 text-center font-normal">
                      {profile.courseAndYear}
                    </td>
                    <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">MAJOR:</td>
                    <td className="border-b border-black w-48 align-bottom pb-1 px-2 text-center font-normal">
                      {profile.major}
                    </td>
                  </tr>
                  <tr className="h-10">
                    <td className="whitespace-nowrap w-[1%] pr-2 pt-2 align-bottom pb-1">OFFICE DEPARTMENT:</td>
                    <td colSpan={5} className="border-b border-black align-bottom pb-1 px-2 text-left font-normal">
                      {profile.hostEstablishment}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Main Table with Deep Blue Header */}
            <div className="border border-black flex-col mb-4 shrink-0 overflow-hidden">
              <table className="w-full border-collapse border-none text-[11px] table-fixed">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white h-12">
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
                      <td className="border border-black p-2 text-center align-middle font-bold bg-white leading-relaxed">
                        {format(monthStart, 'MMM. d')} - {format(monthEnd, 'MMM. d, yyyy')}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                        {monthReport.accomplishment || monthReport.narrative}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                        {monthReport.problemsEncountered}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                        {monthReport.actionTaken}
                      </td>
                      <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                        {monthReport.remarks}
                      </td>
                    </tr>
                  ) : monthReports.map((report, idx) => {
                    let wsStr = '';
                    let weStr = '';
                    try {
                      const wsDate = parseISO(report.weekStartDate);
                      const weDate = parseISO(report.weekEndDate);
                      if (!isNaN(wsDate.getTime())) wsStr = format(wsDate, 'MMM. d');
                      if (!isNaN(weDate.getTime())) weStr = format(weDate, idx === monthReports.length - 1 ? 'MMM. d, yyyy' : 'MMM. d');
                    } catch (e) {
                      // fallback to empty or ignore
                    }
                    return (
                      <tr key={report.id} className="border-b border-black h-12">
                        <td className="border border-black p-2 text-center align-middle font-bold bg-white leading-relaxed">
                          <div>{getWeekOrdinal(idx + 1)}</div>
                          <div className="mt-1 font-normal text-[10px]">({wsStr} to {weStr})</div>
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                          {report.accomplishment || report.narrative}
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                          {report.problemsEncountered}
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                          {report.actionTaken}
                        </td>
                        <td className="border border-black p-2 align-top whitespace-pre-wrap leading-[28px] font-normal" style={linedPaperStyle}>
                          {report.remarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Comments with full-width horizontal lines */}
            <div className="mt-2 mb-4 text-[10px] shrink-0">
              <div className="mb-2 uppercase font-bold text-xs">COMMENTS AND SUGGESTIONS:</div>
              <div className="border-b border-black w-full h-8"></div>
              <div className="border-b border-black w-full h-8"></div>
              <div className="border-b border-black w-full h-8"></div>
            </div>

            {/* Signatures Area */}
            <div className="mt-auto pt-4 shrink-0" style={{ breakInside: 'avoid' }}>
              <table className="w-full border-none">
                <tbody>
                  <tr>
                    <td className="w-[45%] text-center align-bottom border-none p-0">
                      <div className="text-[10px] uppercase font-bold mb-4 text-left">SUBMITTED:</div>
                      <div className="relative h-12 flex items-end justify-center mb-0 border-b border-black w-full pb-4">
                        {profile.signatureImageUrl && (
                          <img 
                            src={profile.signatureImageUrl} 
                            className="absolute bottom-1 h-12 w-auto object-contain" 
                            alt="Signature"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="font-normal text-[12pt] leading-none uppercase z-10">{profile.name}</div>
                      </div>
                      <div className="font-bold uppercase pt-2 text-xs">INTERN/TRAINEE</div>
                    </td>
                    <td className="w-[10%] border-none p-0"></td>
                    <td className="w-[45%] text-center align-bottom border-none p-0">
                      <div className="mb-4 uppercase font-bold text-left text-[10px]">ATTESTED:</div>
                      <div className="font-normal text-[12pt] leading-none uppercase border-b border-black w-full pb-4 h-12 flex items-end justify-center">
                        {profile.headOffice}
                      </div>
                      <div className="font-bold uppercase pt-2 text-xs">ON-SITE SUPERVISOR</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
