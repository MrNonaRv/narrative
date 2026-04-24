import React from 'react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { Page } from './Page';

interface NarrativeReportTemplateProps {
  profile: any;
  groupedEntries: any[];
  weeklyReports?: any[];
}

export function NarrativeReportTemplate({ profile, groupedEntries, weeklyReports }: NarrativeReportTemplateProps) {
  if (!groupedEntries || groupedEntries.length === 0) {
    return <div className="text-muted-foreground p-8 text-center bg-white border border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto print:hidden">No daily entries available. Please add them in the Daily Entries tab.</div>;
  }

  return (
    <>
      {/* 1. Title Page */}
      <Page>
        <div className="flex flex-col h-full text-center mt-12 mb-24" style={{ textAlign: 'center' }}>
          <p className="font-bold mb-12">A Narrative Report in</p>
          
          <p className="m-0">Computer Science Internship</p>
          <p className="m-0">Undertaken at {profile.hostEstablishment || 'Local Government Unit of Mambusao'}</p>
          <p className="m-0">Located at {profile.address || 'Poblacion Proper, Mambusao, Capiz'}</p>
          
          <p className="m-0 mt-12">In Partial Fulfillment of the requirements for the course</p>
          <p className="m-0">Bachelor of Science in {profile.courseAndYear?.includes('BSCS') ? 'Computer Science' : (profile.courseAndYear || 'Computer Science')}</p>
          
          <div className="mt-24">
            <p className="m-0">Submitted to:</p>
            <p className="font-bold uppercase mt-6 mb-0">{profile.facilitator || 'PROF. ART JAYSON L. OSUYOS'}</p>
            <p className="m-0">BSCS SIPP Coordinator/Facilitator</p>
          </div>

          <div className="mt-16">
            <p className="m-0">Submitted by:</p>
            <p className="font-bold uppercase mt-6 mb-0">{profile.name || 'LEOMAR S. OLINO'}</p>
            <p className="m-0">Student Intern</p>
          </div>

          <p className="mt-24">{new Date().getFullYear()}</p>
        </div>
      </Page>

      {/* 2. Dedication & Acknowledgement */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 text-[12pt]">DEDICATION & ACKNOWLEDGEMENT</div>
        <div className="mt-16 text-justify whitespace-pre-wrap" style={{ textIndent: '0.5in', lineHeight: '1.5' }}>
          {profile.dedicationText || `I dedicate this work first and foremost to the Almighty God for the strength, wisdom, and protection He provided throughout my training journey.\n\nTo my beloved parents, for their endless love, support, and encouragement. Their sacrifices have been the foundation of my education and have motivated me to do my best in every challenge I face.\n\nTo my professors and facilitators at CAPIZ STATE UNIVERSITY - MAMBUSAO SATELLITE CAMPUS, especially to ${profile.facilitator || 'PROF. ART JAYSON L. OSUYOS'}, for the guidance and knowledge they have shared.\n\nTo the staff and personnel of the ${profile.hostEstablishment || 'Municipal Disaster Risk Reduction and Management Office (MDRRMO)'}, for the opportunity to have my On-the-Job Training in their office. I am deeply grateful for the trust and for allowing me to experience first-hand the duties and responsibilities in your workplace.\n\nFinally, to my friends and fellow trainees, for the camaraderie and for sharing the challenges and successes during our training. This experience has been more meaningful because of your support.`}
        </div>
      </Page>

      {/* 3. Table of Contents */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 mb-12 text-[12pt]">TABLE OF CONTENTS</div>
        <table className="mx-auto w-[70%] border-none text-left border-collapse mt-4" style={{ padding: '0 10%', lineHeight: '2' }}>
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
              <span className="font-normal block mt-2 ml-4" style={{ marginLeft: '15pt', display: 'block', lineHeight: '1.5' }}>&bull; Certificate of Completion</span>
              <span className="font-normal block mt-2 ml-4" style={{ marginLeft: '15pt', display: 'block', lineHeight: '1.5' }}>&bull; OJT Photo Documentation</span>
            </td></tr>
          </tbody>
        </table>
      </Page>

      {/* 4. Introduction */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 mb-8 text-[12pt]">INTRODUCTION</div>
        <div className="text-justify whitespace-pre-wrap" style={{ textIndent: '0.5in', lineHeight: '1.5' }}>
          {profile.introText || `On-the-Job Training (OJT) played a vital role in my learning journey as it provided real workplace experience. It helped me apply the knowledge and skills I gained from school in an actual working environment. Through this training, I was able to better understand how tasks are performed in a real emergency response setting and how important it is to follow proper procedures in every situation.\n\nDuring my training, I was able to observe how a real emergency response office operates. I learned how different tasks are carried out in the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)'}, especially in responding to emergencies and assisting the community. This experience also helped me understand the importance of discipline, teamwork, responsibility, and proper communication in the workplace.\n\nOverall, this experience helped me become more aware of how disaster response services operate in the community. It gave me valuable learning that improved my skills, increased my confidence, and prepared me for future challenges in a professional environment.`}
        </div>
      </Page>

      {/* 5. Competencies */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 mb-8 text-[12pt]">COMPETENCIES</div>
        <div className="text-justify whitespace-pre-wrap" style={{ textIndent: '0.5in', lineHeight: '1.5' }}>
          {profile.competenciesText || `I completed my ${profile.requiredHours || '200'} hours of On-the-Job Training at the ${profile.hostEstablishment || 'Local Government Unit (LGU) of Mambusao'}, specifically at the Municipal Disaster Risk Reduction and Management Office (MDRRMO). During my ${profile.requiredHours || '200'} hours of training, I was given the opportunity to experience different activities and tasks related to emergency response and disaster management. This exposure allowed me to observe how the office operates in handling emergencies and providing assistance to the community.\n\nThroughout my training, I developed basic competencies in emergency response, patient care, and disaster preparedness. I also learned how to assist in different emergency situations, follow proper procedures in the workplace, and work with discipline and teamwork. In addition, my ${profile.requiredHours || '200'} hours helped me gain more confidence in performing tasks and improved my understanding of the importance of quick and proper response during emergencies. Overall, the experience was very helpful in enhancing my skills and preparing me for future work.`}
        </div>
      </Page>

      {/* 6. Learning */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 mb-8 text-[12pt]">LEARNINGS</div>
        <div className="text-justify whitespace-pre-wrap" style={{ textIndent: '0.5in', lineHeight: '1.5' }}>
          {profile.learningsText || `My ${profile.requiredHours || '200'} HOURS ON-THE-JOB TRAINING at the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT (LGU) MAMBUSAO – MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)'} gave me real experience in a workplace setting. It allowed me to see how the office works in helping people during emergencies and disasters. I was able to observe how the office responds to different situations in the community and how important their role is in ensuring public safety.\n\nDuring my ${profile.requiredHours || '200'} HOURS, I learned and experienced different tasks that helped me improve my skills and knowledge. I was exposed to emergency response activities, patient care, and disaster preparedness. I also learned the importance of following proper procedures, working as a team, and staying disciplined in the workplace. Overall, this training helped me gain confidence and better understanding of how emergency services work in real life situations.`}
        </div>
      </Page>

      {/* 7. Impact */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 mb-8 text-[12pt]">IMPACT</div>
        <div className="text-justify whitespace-pre-wrap" style={{ textIndent: '0.5in', lineHeight: '1.5' }}>
          {profile.impactText || `My ${profile.requiredHours || '200'} HOURS OF TRAINING at the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO) MAMBUSAO'} had a great impact on my personal and professional development. It helped me become more confident in performing tasks and more responsible in handling assigned duties. Through this experience, I also learned the importance of discipline in the workplace and how it contributes to the proper flow of work, especially in emergency situations.\n\nI also learned the importance of teamwork and cooperation when responding to emergencies. I realized that every role in disaster response is important, and each member of the team contributes to saving lives and ensuring safety. This training helped me understand how effective communication and coordination are essential during emergency operations.\n\nOverall, the ${profile.requiredHours || '200'} HOURS OF TRAINING motivated me to improve myself and develop my skills further. It strengthened my interest in emergency and rescue services and made me more aware of the importance of being prepared in handling disaster and emergency situations. It also helped me understand the value of proper response and assistance in ensuring the safety of the community.`}
        </div>
      </Page>

      {/* 8. Conclusion */}
      <Page>
        <div className="text-center font-bold uppercase mt-12 mb-8 text-[12pt]">CONCLUSION</div>
        <div className="text-justify whitespace-pre-wrap" style={{ textIndent: '0.5in', lineHeight: '1.5' }}>
          {profile.conclusionText || `My ${profile.requiredHours || '200'} HOURS OF ON-THE-JOB TRAINING at the ${profile.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT (LGU) MAMBUSAO – MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)'} was a very meaningful and valuable experience. It gave me real-life exposure to emergency response work and allowed me to observe how the office handles different emergency situations in the community. This experience helped me understand the importance of readiness, quick action, and proper coordination in times of emergencies.\n\nDuring my training, I was able to develop important skills such as first aid, CPR, patient handling, and the proper use of rescue equipment. I also learned how to apply proper procedures in responding to emergencies, which is very important in ensuring safety and saving lives. In addition, I gained knowledge on how teamwork and communication play a big role in effective emergency response.\n\nOverall, this ${profile.requiredHours || '200'} HOURS OF TRAINING prepared me to become more competent, responsible, and confident in handling tasks related to emergency situations. It helped me improve my skills, develop discipline, and become more aware of the importance of helping others during times of need.`}
        </div>
      </Page>

      {/* 9. Internship Experience (Weekly Reports) */}
      <div id="internship-experience-section">
        {groupedEntries.map(([weekKey, weekEntries], index) => {
          if (!weekEntries || weekEntries.length === 0) return null;
          
          let firstEntryDate;
          let lastEntryDate;
          
          try {
            firstEntryDate = parseISO(weekEntries[0].date);
            lastEntryDate = parseISO(weekEntries[weekEntries.length - 1].date);
            
            if (isNaN(firstEntryDate.getTime()) || isNaN(lastEntryDate.getTime())) {
              return null;
            }
          } catch (e) {
            return null;
          }

          const totalHours = weekEntries.reduce((sum: number, e: any) => sum + (e.workingHours || 0), 0);
          
          let displayDateCovered = '';
          try {
            if (firstEntryDate.getMonth() === lastEntryDate.getMonth()) {
              displayDateCovered = `${format(firstEntryDate, 'MMMM dd')}-${format(lastEntryDate, 'dd, yyyy')}`;
            } else {
              displayDateCovered = `${format(firstEntryDate, 'MMMM dd')} - ${format(lastEntryDate, 'MMMM dd, yyyy')}`;
            }
          } catch (e) {
            displayDateCovered = "Invalid Date";
          }

          const weekStart = startOfWeek(firstEntryDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(firstEntryDate, { weekStartsOn: 1 });
          
          const report = weeklyReports?.find((r: any) => {
            const rStart = parseISO(r.weekStartDate);
            return rStart >= weekStart && rStart <= weekEnd;
          });
          
          return (
            <Page key={weekKey}>
              <div className="text-center font-bold uppercase mt-2 mb-8 text-[13pt]">
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
                        {format(parseISO(entry.date), 'MMMM dd, yyyy').replace(/ /g, '\u00A0')}
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
                    <td colSpan={3} className="border border-black p-2 text-right font-bold w-full" style={{ textAlign: 'right', paddingRight: '1rem' }}>
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

        {/* 10. Documentation */}
        <div id="documentation-section">
          <Page>
            <div className="text-center font-bold uppercase mt-2 mb-8 text-lg underline">X. DOCUMENTATION</div>
            <div className="text-center font-bold uppercase mt-8 mb-8 text-lg italic">Certificate of Completion</div>
            {profile?.certificateImageUrl ? (
               <div className="flex justify-center mt-8">
                 <img 
                   src={profile.certificateImageUrl} 
                   alt="Certificate of Completion" 
                   className="max-w-full max-h-[700px] object-contain border border-gray-300 shadow-sm"
                 />
               </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-gray-300 rounded-lg mx-8 mt-16 text-muted-foreground bg-gray-50">
                <span>[Attach Scanned Certificate or Paste Image Here in Word]</span>
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
                  {pageIdx === 0 && <div className="text-center font-bold uppercase mt-8 mb-4 text-[12pt]">OJT PHOTO DOCUMENTATION</div>}
                  
                  <table className="photo-grid-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '10px', marginTop: pageIdx === 0 ? '8px' : '48px' }}>
                    <tbody>
                      {(() => {
                        const rows = [];
                        for (let i = 0; i < chunk.length; i += 2) {
                          rows.push(chunk.slice(i, i + 2));
                        }
                        return rows.map((row, rowIdx) => (
                          <tr key={`row-${rowIdx}`}>
                            {row.map((img: any) => (
                              <td key={img.id} style={{ width: '50%', height: '220px', textAlign: 'center', verticalAlign: 'middle', padding: '10px', backgroundColor: '#ffffff' }}>
                                <img 
                                  src={img.url} 
                                  alt={img.caption || 'Documentation Photo'} 
                                  style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', margin: '0 auto' }}
                                  referrerPolicy="no-referrer"
                                />
                              </td>
                            ))}
                            {row.length === 1 && <td style={{ width: '50%', padding: '10px' }}></td>}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </Page>
              ));
            })()
          ) : (
            <Page>
              <div className="text-center font-bold uppercase mt-8 mb-4 text-[12pt]">OJT PHOTO DOCUMENTATION</div>
              <table className="photo-grid-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '10px', marginTop: '8px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', height: '220px', border: '2px dashed #d1d5db', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280', backgroundColor: '#f9fafb' }}>[Photo 1] Paste here</td>
                    <td style={{ width: '50%', height: '220px', border: '2px dashed #d1d5db', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280', backgroundColor: '#f9fafb' }}>[Photo 2] Paste here</td>
                  </tr>
                  <tr>
                    <td style={{ width: '50%', height: '220px', border: '2px dashed #d1d5db', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280', backgroundColor: '#f9fafb' }}>[Photo 3] Paste here</td>
                    <td style={{ width: '50%', height: '220px', border: '2px dashed #d1d5db', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280', backgroundColor: '#f9fafb' }}>[Photo 4] Paste here</td>
                  </tr>
                  <tr>
                    <td style={{ width: '50%', height: '220px', border: '2px dashed #d1d5db', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280', backgroundColor: '#f9fafb' }}>[Photo 5] Paste here</td>
                    <td style={{ width: '50%', height: '220px', border: '2px dashed #d1d5db', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280', backgroundColor: '#f9fafb' }}>[Photo 6] Paste here</td>
                  </tr>
                </tbody>
              </table>
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
      <Page noBreak>
        <div className="mt-auto pb-12">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-[45%] text-center align-bottom">
                  <div className="text-[10px] font-bold mb-4 text-left uppercase underline">SUBMITTED BY:</div>
                  <div className="relative h-16 flex items-end justify-center mb-0 border-b border-black w-full pb-6">
                    {profile?.signatureImageUrl && (
                      <img 
                        src={profile.signatureImageUrl} 
                        className="absolute bottom-0 h-16 w-auto object-contain" 
                        alt="Signature"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="font-bold text-[13pt] leading-none uppercase z-10">{profile?.name || ''}</div>
                  </div>
                  <div className="text-[10px] uppercase pt-2">Intern / Trainee</div>
                  <div className="text-[10px] pt-1">Date: ________________</div>
                </td>
                <td className="w-[10%]"></td>
                <td className="w-[45%] text-center align-bottom">
                  <div className="text-[10px] font-bold mb-16 uppercase text-left underline">NOTED BY:</div>
                  <div className="font-bold text-[13pt] leading-none uppercase border-b border-black w-full pb-6 mx-auto">{profile?.headOffice || ''}</div>
                  <div className="text-[10px] uppercase pt-2">On-Site Supervisor</div>
                  <div className="text-[10px] pt-1">Date: ________________</div>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="h-32"></td>
              </tr>
              <tr>
                <td className="w-[45%] text-center align-bottom mx-auto" colSpan={3}>
                  <div className="text-[10px] font-bold mb-16 uppercase text-center underline">APPROVED BY:</div>
                  <div className="font-bold text-[13pt] leading-none uppercase border-b border-black pb-6 w-64 mx-auto">{profile?.facilitator || 'PROF. ART JAYSON L. OSUYOS'}</div>
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
