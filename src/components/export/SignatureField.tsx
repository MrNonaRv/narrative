import React from 'react';

interface SignatureProps {
  label: string;
  name: string;
  title: string;
  signatureImageUrl?: string;
  dateField?: boolean;
}

export const SignatureField: React.FC<SignatureProps> = ({ label, name, title, signatureImageUrl, dateField = true }) => (
  <div className="flex flex-col items-center">
    <div className="text-[10px] font-bold mb-4 text-left uppercase underline w-full">{label}</div>
    <div className="relative h-16 flex items-end justify-center mb-0 border-b border-black w-full pb-6">
      {signatureImageUrl && (
        <img 
          src={signatureImageUrl} 
          className="absolute bottom-0 h-16 w-auto object-contain" 
          alt="Signature"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="font-bold text-[13pt] leading-none uppercase z-10">{name}</div>
    </div>
    <div className="text-[10px] uppercase pt-2">{title}</div>
    {dateField && <div className="text-[10px] pt-1">Date: ________________</div>}
  </div>
);
