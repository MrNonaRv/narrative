import React from 'react';
import { UserProfile } from '@/types';
import { useAppStore } from '@/store';
import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react';

interface Props {
  profile: UserProfile;
}

export function InternEvaluationTemplate({ profile }: Props) {
  const { evaluationData, setEvaluationData, entries } = useAppStore();

  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  const startDate = sortedEntries.length > 0 ? sortedEntries[0].date : null;
  const endDate = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].date : null;
  const acquiredHours = sortedEntries.reduce((acc, curr) => acc + (Number(curr.workingHours) || 0), 0);

  const handleUpdate = (field: string, value: any) => {
    setEvaluationData({ [field]: value });
  };

  const handleCheckbox = (type: string) => {
    setEvaluationData({ employability: type });
  };

  const SeamlessInput = ({ value, onChange, className = '', placeholder = '', bold = false }: any) => (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border-0 outline-none shadow-none bg-transparent py-0 pr-0 w-full focus:ring-0 ${bold ? 'font-bold' : ''} ${className}`}
      style={{ display: 'inline-block', width: '100%', minWidth: '50px', paddingLeft: '6px' }}
    />
  );

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-black p-[10mm] shadow-sm relative shrink-0 font-serif text-[14px]">
      
      {/* Header Table */}
      <table className="w-full mb-2 border-collapse" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', width: '15%', padding: '4px', textAlign: 'center', verticalAlign: 'middle' }} rowSpan={4}>
               <img src={`${window.location.origin}/logo-capsu.jpg`} alt="CAPSU Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', margin: '0 auto' }} />
            </td>
            <td style={{ border: '1px solid black', width: '50%', padding: '2px 4px', verticalAlign: 'top', position: 'relative' }} rowSpan={2}>
              <div style={{ fontSize: '10px' }}>Document Type:</div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', lineHeight: '1', marginTop: '2px' }}>FORM</div>
              <div style={{ textAlign: 'center', fontSize: '10px', lineHeight: '1', marginTop: '2px' }}>ISO 9001:2015</div>
            </td>
            <td style={{ border: '1px solid black', width: '15%', padding: '2px 4px', fontSize: '11px', textAlign: 'right' }}>Document Code</td>
            <td style={{ border: '1px solid black', width: '20%', padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>EAL-F04</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '2px 4px', fontSize: '11px', textAlign: 'right' }}>Revision No.</td>
            <td style={{ border: '1px solid black', padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>00</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '2px 4px', verticalAlign: 'top', position: 'relative' }} rowSpan={2}>
              <div style={{ fontSize: '10px' }}>Document Title:</div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', marginTop: '6px', whiteSpace: 'nowrap' }}>SIAP/SIPP STUDENT INTERNS EVALUATION</div>
            </td>
            <td style={{ border: '1px solid black', padding: '2px 4px', fontSize: '10.5px', textAlign: 'right', whiteSpace: 'nowrap' }}>Effective Date</td>
            <td style={{ border: '1px solid black', padding: '2px 4px', fontSize: '10.5px', fontWeight: 'bold', textAlign: 'center' }}>October 07, 2019</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '2px 4px', fontSize: '11px', textAlign: 'right' }}>Page</td>
            <td style={{ border: '1px solid black', padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>1 of 1</td>
          </tr>
        </tbody>
      </table>

      {/* Main Form Table */}
      <table className="w-full border-collapse" style={{ borderCollapse: 'collapse', border: '1px solid black', lineHeight: '1.2' }}>
        <tbody>
          {/* Row 1 */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px', width: '48%' }} colSpan={2}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Student's Name:&nbsp;</td><td><SeamlessInput value={profile.name} onChange={(v: string) => {}} /></td></tr></tbody></table>
            </td>
            <td style={{ border: '1px solid black', padding: '4px', width: '20%' }}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>College:&nbsp;</td><td><SeamlessInput className="text-[13px]" value={evaluationData.college || 'CAPSU-MSC'} bold onChange={(v: string) => handleUpdate('college', v)} /></td></tr></tbody></table>
            </td>
            <td style={{ border: '1px solid black', padding: '4px', width: '32%' }}>
               <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Major:&nbsp;</td><td><SeamlessInput value={evaluationData.major || profile.major} onChange={(v: string) => handleUpdate('major', v)} /></td></tr></tbody></table>
            </td>
          </tr>

          {/* Row 2 */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px' }} colSpan={4}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Training Company:&nbsp;</td><td><SeamlessInput value={profile.hostEstablishment} onChange={() => {}} /></td></tr></tbody></table>
            </td>
          </tr>

          {/* Row 3 */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px', width: '70%' }} colSpan={3}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Company Address:&nbsp;</td><td><SeamlessInput value={profile.address} onChange={() => {}} /></td></tr></tbody></table>
            </td>
            <td style={{ border: '1px solid black', padding: '4px', width: '30%' }}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Tel No.:&nbsp;</td><td><SeamlessInput value={evaluationData.telNo} onChange={(v: string) => handleUpdate('telNo', v)} /></td></tr></tbody></table>
            </td>
          </tr>

          {/* Row 4 */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px' }} colSpan={4}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Contact Person:&nbsp;</td><td><SeamlessInput value={evaluationData.contactPerson !== undefined ? evaluationData.contactPerson : profile.facilitator} onChange={(v: string) => handleUpdate('contactPerson', v)} /></td></tr></tbody></table>
            </td>
          </tr>

          {/* Row 5 */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px' }} colSpan={4}>
              <table style={{width: '100%'}}><tbody><tr>
                <td style={{width: '1%', whiteSpace: 'nowrap'}}>Inclusive Date of Training: from </td>
                <td style={{width: '1%', whiteSpace: 'nowrap', padding: '0 4px', minWidth: '80px', borderBottom: '1px solid black', textAlign: 'center'}}>
                  {startDate ? format(parseISO(startDate), 'MMMM') : ''}
                </td>
                <td style={{width: '1%', whiteSpace: 'nowrap'}}> to </td>
                <td style={{width: '1%', whiteSpace: 'nowrap', padding: '0 4px', minWidth: '80px', borderBottom: '1px solid black', textAlign: 'center'}}>
                  {endDate ? format(parseISO(endDate), 'MMMM') : ''}
                </td>
                <td>, {endDate ? format(parseISO(endDate), 'yyyy') : ''}</td>
              </tr></tbody></table>
            </td>
          </tr>

          {/* Row 6 */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px', width: '50%' }} colSpan={2}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Date of Evaluation:&nbsp;</td><td><SeamlessInput value={evaluationData.dateOfEvaluation} onChange={(v: string) => handleUpdate('dateOfEvaluation', v)} type="text" /></td></tr></tbody></table>
            </td>
            <td style={{ border: '1px solid black', padding: '4px', width: '50%' }} colSpan={2}>
              <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Date of Last Evaluation:&nbsp;</td><td><SeamlessInput value={evaluationData.dateOfLastEvaluation} onChange={(v: string) => handleUpdate('dateOfLastEvaluation', v)} type="text" /></td></tr></tbody></table>
            </td>
          </tr>

          {/* Row 7: Employability */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px', width: '65%', verticalAlign: 'top' }} colSpan={3}>
              <div>Employability:</div>
              <table style={{ width: '80%', marginLeft: '10%', marginTop: '4px', border: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px', border: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }} onClick={() => handleCheckbox('Extended Intern/Trainee')}>
                          {evaluationData.employability === 'Extended Intern/Trainee' ? '✔' : ''}
                        </div>
                        Extended Intern/Trainee
                      </label>
                    </td>
                    <td style={{ padding: '2px', border: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }} onClick={() => handleCheckbox('Probationary')}>
                          {evaluationData.employability === 'Probationary' ? '✔' : ''}
                        </div>
                        Probationary
                      </label>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px', border: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }} onClick={() => handleCheckbox('Contractual')}>
                          {evaluationData.employability === 'Contractual' ? '✔' : ''}
                        </div>
                        Contractual
                      </label>
                    </td>
                    <td style={{ padding: '2px', border: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }} onClick={() => handleCheckbox('Casual')}>
                          {evaluationData.employability === 'Casual' ? '✔' : ''}
                        </div>
                        Casual
                      </label>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px', border: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }} onClick={() => handleCheckbox('Regular')}>
                          {evaluationData.employability === 'Regular' ? '✔' : ''}
                        </div>
                        Regular
                      </label>
                    </td>
                    <td style={{ padding: '2px', border: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '16px', height: '16px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }} onClick={() => handleCheckbox('Applicant')}>
                          {evaluationData.employability === 'Applicant' ? '✔' : ''}
                        </div>
                        Applicant
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '16px' }}>
                <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>If employed, specify the name of the company:&nbsp;</td><td><SeamlessInput value={evaluationData.employedCompany} onChange={(v: string) => handleUpdate('employedCompany', v)} /></td></tr></tbody></table>
              </div>
            </td>
            <td style={{ border: '1px solid black', padding: '4px', width: '35%', verticalAlign: 'top' }}>
              <div>Allowance/Salary:</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '16px', marginBottom: '16px' }}>
                <span style={{ marginRight: '8px' }}>PhP</span>
                <div style={{ borderBottom: '1px solid gray', width: '100px', textAlign: 'center' }}>
                  <SeamlessInput className="text-center w-full" value={evaluationData.allowance || 'N/A'} onChange={(v: string) => handleUpdate('allowance', v)} />
                </div>
              </div>
              <div>
                <table style={{width: '100%'}}><tbody><tr><td style={{width: '1%', whiteSpace: 'nowrap'}}>Telephone No.:&nbsp;</td><td><SeamlessInput value={evaluationData.telephoneNo} onChange={(v: string) => handleUpdate('telephoneNo', v)} /></td></tr></tbody></table>
              </div>
            </td>
          </tr>

          {/* Row 8: QUESTIONNAIRE */}
          <tr>
            <td style={{ border: '1px solid black', backgroundColor: '#1e3a8a', color: 'white', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', padding: '2px' }} colSpan={4}>
              QUESTIONNAIRE
            </td>
          </tr>

          {/* Row 9 & 10: ASSIGNMENT */}
          <tr>
            <td style={{ border: '1px solid black', padding: '4px', width: '45%', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }} colSpan={2}>
              ASSIGNMENT
            </td>
            <td style={{ border: '0', padding: '0', width: '55%', verticalAlign: 'top' }} colSpan={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ borderBottom: '1px solid black', borderLeft: '1px solid black', borderRight: '1px solid black', padding: '4px', width: '50%', verticalAlign: 'top' }}>
                      <div style={{ textTransform: 'uppercase', fontSize: '12px', lineHeight: '1' }}>DEPARTMENT:</div>
                      <SeamlessInput value={evaluationData.department} onChange={(v: string) => handleUpdate('department', v)} className="mt-1" />
                    </td>
                    <td style={{ borderBottom: '1px solid black', padding: '4px', width: '50%', verticalAlign: 'top' }}>
                      <div style={{ textTransform: 'uppercase', fontSize: '12px', lineHeight: '1' }}>OTHER DEPT. ASSIGNED:</div>
                      <SeamlessInput value={evaluationData.otherDept} onChange={(v: string) => handleUpdate('otherDept', v)} className="mt-1" />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ borderLeft: '1px solid black', borderRight: '1px solid black', padding: '4px', width: '50%', verticalAlign: 'top' }}>
                      <div style={{ textTransform: 'uppercase', fontSize: '12px', lineHeight: '1' }}>POSITION:</div>
                      <SeamlessInput value={evaluationData.position || profile.position} onChange={(v: string) => handleUpdate('position', v)} className="mt-1" />
                    </td>
                    <td style={{ padding: '4px', width: '50%', verticalAlign: 'top' }}>
                      <div style={{ textTransform: 'uppercase', fontSize: '12px', lineHeight: '1' }}>RATER/SUPERVISOR:</div>
                      <SeamlessInput value={evaluationData.rater !== undefined ? evaluationData.rater : (evaluationData.contactPerson !== undefined ? evaluationData.contactPerson : profile.facilitator)} onChange={(v: string) => handleUpdate('rater', v)} className="mt-1" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Questions */}
          {[
            { label: 'Describe your duties briefly:', field: 'duties', minH: '50px', italic: true },
            { label: 'What do you consider your strongest area of\nperformance? Explain.', field: 'strongestArea', minH: '55px' },
            { label: 'In what areas do you feel you have improved the\nmost? Explain.', field: 'improvedMost', minH: '55px' },
            { label: 'In what areas do you feel you need the most\nimprovement? Explain.', field: 'needImprovement', minH: '55px' },
            { label: 'What situation challenged you the most? Explain.', field: 'challengingSituation', minH: '55px' },
            { label: 'How did you overcome the challenge?', field: 'overcameChallenge', minH: '55px' },
            { label: 'What did you learn from your experiences?\nExplain.', field: 'learnedExperience', minH: '55px' },
            { label: 'Do you think your training station is qualified to\nbe one of your university linkages? Explain.', field: 'qualifiedLinkage', minH: '55px' },
            { label: "SIP's suggestion/ recommendation:", field: 'recommendation', minH: '50px' }
          ].map((item, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid black', padding: '4px', width: '45%', verticalAlign: 'top' }} colSpan={2}>
                <div style={{ whiteSpace: 'pre-line', fontStyle: item.italic ? 'italic' : 'normal', minHeight: item.minH }}>{item.label}</div>
              </td>
              <td style={{ border: '1px solid black', padding: '4px', width: '55%', verticalAlign: 'top' }} colSpan={2}>
                <textarea 
                  value={(evaluationData as any)[item.field] || ''}
                  onChange={e => handleUpdate(item.field, e.target.value)}
                  style={{ width: '100%', minHeight: item.minH, border: 'none', outline: 'none', resize: 'none', background: 'transparent', margin: 0, padding: 0, fontFamily: 'serif' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '24px 0 16px 0', fontSize: '14px' }}>
        PLEASE DO NOT FILL OUT THIS PORTION
      </div>

      <div style={{ padding: '0 10mm', fontSize: '14px' }}>
        <table style={{ width: '100%', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '1%', whiteSpace: 'nowrap' }}>Acquired Total Training Hours:</td>
              <td style={{ borderBottom: '1.5px solid black', width: '100px', padding: '0 8px', textAlign: 'center' }}>{acquiredHours || ''}</td>
              <td style={{ width: '1%', whiteSpace: 'nowrap', paddingLeft: '16px' }}>Date of Completion:</td>
              <td style={{ borderBottom: '1.5px solid black', width: 'auto', textAlign: 'center', padding: '0 8px' }}>
                 {endDate ? format(parseISO(endDate), 'MMMM dd, yyyy') : ''}
              </td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: '100%', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '1%', whiteSpace: 'nowrap' }}>Acquired Total Performance Rating:</td>
              <td style={{ borderBottom: '1.5px solid black', width: 'auto' }}></td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '1%', whiteSpace: 'nowrap' }}>Remarks:</td>
              <td style={{ borderBottom: '1.5px solid black', width: 'auto' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}


