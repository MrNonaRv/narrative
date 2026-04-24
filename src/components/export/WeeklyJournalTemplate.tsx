import React from 'react';
import { format, parseISO } from 'date-fns';
import { ReportHeader } from './ReportHeader';

interface WeeklyJournalTemplateProps {
  profile: any;
  weeklyReports: any[];
}

const linedPaperStyle = {
  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #000 27px, #000 28px)',
  backgroundSize: '100% 28px',
  lineHeight: '28px',
  paddingTop: '0px',
  paddingBottom: '0px',
};

export function WeeklyJournalTemplate({ profile, weeklyReports }: WeeklyJournalTemplateProps) {
  if (!weeklyReports || weeklyReports.length === 0) return <div className="text-muted-foreground p-8 text-center bg-white border border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto print:hidden">No weekly reports available. Please generate them in the Weekly Reports tab.</div>;

  // Filter out invalid reports and sort chronologically ascending
  const sortedReports = [...(weeklyReports || [])]
    .filter(r => r && r.weekStartDate)
    .sort((a, b) => {
      const timeA = new Date(a.weekStartDate).getTime();
      const timeB = new Date(b.weekStartDate).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });
  
  const getWeekOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + " Week";
  };

  return (
    <>
      {sortedReports.map((report, chunkIndex) => {
        const startStr = format(parseISO(report.weekStartDate), 'MMM d, yyyy');
        const endStr = format(parseISO(report.weekEndDate), 'MMM d, yyyy');
        const globalIndex = chunkIndex + 1;
        
        return (
          <div 
            key={`weekly-page-${chunkIndex}`} 
            className={`bg-white px-[0.5in] pt-[0.4in] pb-[0.7in] text-black flex flex-col ${chunkIndex < sortedReports.length - 1 ? 'html2pdf__page-break' : ''}`} 
            style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              pageBreakAfter: chunkIndex < sortedReports.length - 1 ? 'always' : 'auto',
              breakAfter: chunkIndex < sortedReports.length - 1 ? 'page' : 'auto',
              width: '1248px',
              minHeight: '816px',
              height: 'auto',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <ReportHeader title="STUDENT'S WEEKLY JOURNAL REPORT" documentCode="EAL-F01" />

            {/* Student Info Section */}
            <div className="mb-4 text-xs uppercase font-bold shrink-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="h-10">
                    <td className="whitespace-nowrap w-[1%] pr-2 align-bottom pb-1">NAME:</td>
                    <td className="border-b border-black align-bottom pb-3 px-2 text-center font-normal">
                      {profile.name}
                    </td>
                    <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">COURSE & YEAR:</td>
                    <td className="border-b border-black w-48 align-bottom pb-3 px-2 text-center font-normal">
                      {profile.courseAndYear}
                    </td>
                    <td className="whitespace-nowrap w-[1%] px-4 text-right align-bottom pb-1">MAJOR:</td>
                    <td className="border-b border-black w-48 align-bottom pb-3 px-2 text-center font-normal">
                      {profile.major}
                    </td>
                  </tr>
                  <tr className="h-10">
                    <td className="whitespace-nowrap w-[1%] pr-2 pt-2 align-bottom pb-1">OFFICE/DEPARTMENT:</td>
                    <td colSpan={5} className="border-b border-black align-bottom pb-3 px-2 text-left font-normal">
                      {profile.hostEstablishment}
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

            {/* Comments with horizontal lines */}
            <div className="mt-2 mb-2 text-xs shrink-0">
              <div className="mb-1 uppercase font-bold">COMMENTS AND SUGGESTIONS:</div>
              <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap mb-1 leading-5">{' '}</div>
              <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap mb-1 leading-5">{' '}</div>
              <div className="border-b border-black min-h-[1.2rem] whitespace-pre-wrap leading-5">{' '}</div>
            </div>

            {/* Signature Area */}
            <table className="w-full mt-auto border-none shrink-0 pb-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <tbody>
                <tr>
                  <td className="w-[45%] border-none align-bottom text-center p-0">
                    <div className="mb-1 text-left uppercase font-bold text-[10px]">SUBMITTED:</div>
                    <div className="relative h-16 flex items-end justify-center mb-0 border-b border-black w-full pb-6">
                      {profile.signatureImageUrl && (
                        <img 
                          src={profile.signatureImageUrl} 
                          className="absolute bottom-0 h-16 w-auto object-contain" 
                          alt="Signature"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="font-normal text-[12pt] leading-none uppercase z-10">{profile.name}</div>
                    </div>
                    <div className="font-bold uppercase pt-1 px-1 text-xs">INTERN/TRAINEE</div>
                  </td>
                  <td className="w-[10%] border-none p-0"></td>
                  <td className="w-[45%] border-none align-bottom text-center p-0">
                    <div className="mb-1 text-left uppercase font-bold text-[10px]">ATTESTED:</div>
                    <div className="h-16 flex items-end justify-center mb-0 border-b border-black w-full pb-6">
                      <div className="font-normal text-[12pt] leading-none uppercase">{profile.headOffice}</div>
                    </div>
                    <div className="font-bold uppercase pt-1 px-1 text-xs">ON-SITE SUPERVISOR</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )})}
    </>
  );
}
