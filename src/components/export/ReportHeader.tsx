import React from 'react';

interface ReportHeaderProps {
  title: string;
  documentCode?: string;
  isoText?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, documentCode = 'EAL-F03', isoText = 'ISO 9001:2015' }) => (
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
        <td className="border border-black p-0 w-[63%] align-top">
          <table className="w-full h-full border-none">
            <tbody>
              <tr className="h-10">
                <td className="border-b border-black p-1 align-top h-[50%]">
                  <div className="text-[10px]">Document Type:</div>
                  <div className="text-center font-bold text-sm">FORM</div>
                  <div className="text-center text-[10px]">{isoText}</div>
                </td>
              </tr>
              <tr className="h-10">
                <td className="p-1 align-top h-[50%]">
                  <div className="text-[10px] float-left">Document Title:</div>
                  <div className="text-center font-bold text-sm mt-1 uppercase">{title}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
        <td className="border border-black p-0 w-[25%] text-[10px]">
          <table className="w-full h-full border-none">
            <tbody>
              <tr className="h-20">
                <td className="p-0">
                   <table className="w-full h-full border-none">
                      <tbody>
                        <tr className="h-[20px]">
                          <td className="border-b border-r border-black p-1 w-1/2">Document Code</td>
                          <td className="border-b border-black p-1 w-1/2 font-bold text-center">{documentCode}</td>
                        </tr>
                        <tr className="h-[20px]">
                          <td className="border-b border-r border-black p-1">Revision No.</td>
                          <td className="border-b border-black p-1 font-bold text-center">00</td>
                        </tr>
                        <tr className="h-[20px]">
                          <td className="border-b border-r border-black p-1">Effective Date</td>
                          <td className="border-b border-black p-1 font-bold text-center">October 07, 2019</td>
                        </tr>
                        <tr className="h-[20px]">
                          <td className="border-r border-black p-1">Page</td>
                          <td className="p-1 font-bold text-center">1 of 1</td>
                        </tr>
                      </tbody>
                   </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);
