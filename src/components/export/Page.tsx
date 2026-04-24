import React from 'react';

const pageWrapperStyle = {
  fontFamily: '"Times New Roman", Times, serif', 
  fontSize: '12pt',
  pageBreakAfter: 'always' as const,
  breakAfter: 'page' as const,
  width: '210mm',
  height: 'auto',
  minHeight: '297mm',
  boxSizing: 'border-box' as const,
  position: 'relative' as const
};

export const Page: React.FC<{ children: React.ReactNode, noBreak?: boolean }> = ({ children, noBreak }) => (
  <div 
    className={`bg-white shadow-lg print:shadow-none px-[1in] pt-[1in] pb-[1in] text-black print:px-[1in] print:pt-[1in] print:pb-[1in] print:m-0 break-inside-avoid ${!noBreak ? 'print:break-after-page html2pdf__page-break' : ''} flex flex-col`} 
    style={{
      ...pageWrapperStyle, 
      pageBreakAfter: noBreak ? 'auto' : 'always',
      breakAfter: noBreak ? 'auto' : 'page'
    }}
  >
    {children}
  </div>
);
