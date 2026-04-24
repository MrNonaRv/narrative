import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Sparkles, X, Loader2, Save } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface NarrativeReviseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NarrativeReviseModal({ isOpen, onClose }: NarrativeReviseModalProps) {
  const { profile, setProfile } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'dedication' | 'intro' | 'competencies' | 'learnings' | 'impact' | 'conclusion'>('dedication');
  const [isRevising, setIsRevising] = useState(false);
  
  const defaultIntro = `On-the-Job Training (OJT) played a vital role in my learning journey as it provided real workplace experience. It helped me apply the knowledge and skills I gained from school in an actual working environment. Through this training, I was able to better understand how tasks are performed in a real emergency response setting and how important it is to follow proper procedures in every situation.\n\nDuring my training, I was able to observe how a real emergency response office operates. I learned how different tasks are carried out in the {HOST}, especially in responding to emergencies and assisting the community. This experience also helped me understand the importance of discipline, teamwork, responsibility, and proper communication in the workplace.\n\nOverall, this experience helped me become more aware of how disaster response services operate in the community. It gave me valuable learning that improved my skills, increased my confidence, and prepared me for future challenges in a professional environment.`.replace('{HOST}', profile?.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)');
  
  const defaultCompetencies = `I completed my {HOURS} hours of On-the-Job Training at the {LGU}, specifically at the Municipal Disaster Risk Reduction and Management Office (MDRRMO). During my {HOURS} hours of training, I was given the opportunity to experience different activities and tasks related to emergency response and disaster management. This exposure allowed me to observe how the office operates in handling emergencies and providing assistance to the community.\n\nThroughout my training, I developed basic competencies in emergency response, patient care, and disaster preparedness. I also learned how to assist in different emergency situations, follow proper procedures in the workplace, and work with discipline and teamwork. In addition, my {HOURS} hours helped me gain more confidence in performing tasks and improved my understanding of the importance of quick and proper response during emergencies. Overall, the experience was very helpful in enhancing my skills and preparing me for future work.`.replace(/{HOURS}/g, String(profile?.requiredHours || '200')).replace('{LGU}', profile?.hostEstablishment || 'Local Government Unit (LGU) of Mambusao');
  
  const defaultLearnings = `My {HOURS} HOURS ON-THE-JOB TRAINING at the {HOST} gave me real experience in a workplace setting. It allowed me to see how the office works in helping people during emergencies and disasters. I was able to observe how the office responds to different situations in the community and how important their role is in ensuring public safety.\n\nDuring my {HOURS} HOURS, I learned and experienced different tasks that helped me improve my skills and knowledge. I was exposed to emergency response activities, patient care, and disaster preparedness. I also learned the importance of following proper procedures, working as a team, and staying disciplined in the workplace. Overall, this training helped me gain confidence and better understanding of how emergency services work in real life situations.`.replace(/{HOURS}/g, String(profile?.requiredHours || '200')).replace('{HOST}', profile?.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT (LGU) MAMBUSAO – MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)');

  const defaultImpact = `My {HOURS} HOURS OF TRAINING at the {HOST} had a great impact on my personal and professional development. It helped me become more confident in performing tasks and more responsible in handling assigned duties. Through this experience, I also learned the importance of discipline in the workplace and how it contributes to the proper flow of work, especially in emergency situations.\n\nI also learned the importance of teamwork and cooperation when responding to emergencies. I realized that every role in disaster response is important, and each member of the team contributes to saving lives and ensuring safety. This training helped me understand how effective communication and coordination are essential during emergency operations.\n\nOverall, the {HOURS} HOURS OF TRAINING motivated me to improve myself and develop my skills further. It strengthened my interest in emergency and rescue services and made more aware of the importance of being prepared in handling disaster and emergency situations. It also helped me understand the value of proper response and assistance in ensuring the safety of the community.`.replace(/{HOURS}/g, String(profile?.requiredHours || '200')).replace('{HOST}', profile?.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO) MAMBUSAO');

  const defaultConclusion = `My {HOURS} HOURS OF ON-THE-JOB TRAINING at the {HOST} was a very meaningful and valuable experience. It gave me real-life exposure to emergency response work and allowed me to observe how the office handles different emergency situations in the community. This experience helped me understand the importance of readiness, quick action, and proper coordination in times of emergencies.\n\nDuring my training, I was able to develop important skills such as first aid, CPR, patient handling, and the proper use of rescue equipment. I also learned how to apply proper procedures in responding to emergencies, which is very important in ensuring safety and saving lives. In addition, I gained knowledge on how teamwork and communication play a big role in effective emergency response.\n\nOverall, this {HOURS} HOURS OF TRAINING prepared me to become more competent, responsible, and confident in handling tasks related to emergency situations. It helped me improve my skills, develop discipline, and become more aware of the importance of helping others during times of need.`.replace(/{HOURS}/g, String(profile?.requiredHours || '200')).replace('{HOST}', profile?.hostEstablishment ? profile.hostEstablishment.toUpperCase() : 'LOCAL GOVERNMENT UNIT (LGU) MAMBUSAO – MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE (MDRRMO)');

  const defaultDedication = `I dedicate this work first and foremost to the Almighty God for the strength, wisdom, and protection He provided throughout my training journey.

To my beloved parents, for their endless love, support, and encouragement. Their sacrifices have been the foundation of my education and have motivated me to do my best in every challenge I face.

To my professors and facilitators at CAPIZ STATE UNIVERSITY - MAMBUSAO SATELLITE CAMPUS, especially to {PROF}, for the guidance and knowledge they have shared.

To the staff and personnel of the {HOST}, for the opportunity to have my On-the-Job Training in their office. I am deeply grateful for the trust and for allowing me to experience first-hand the duties and responsibilities in your workplace.

Finally, to my friends and fellow trainees, for the camaraderie and for sharing the challenges and successes during our training. This experience has been more meaningful because of your support.`.replace('{PROF}', profile?.facilitator || 'PROF. ART JAYSON L. OSUYOS').replace('{HOST}', profile?.hostEstablishment || 'Municipal Disaster Risk Reduction and Management Office (MDRRMO)');

  const [formData, setFormData] = useState({
    dedicationText: profile?.dedicationText || defaultDedication,
    introText: profile?.introText || defaultIntro,
    competenciesText: profile?.competenciesText || defaultCompetencies,
    learningsText: profile?.learningsText || defaultLearnings,
    impactText: profile?.impactText || defaultImpact,
    conclusionText: profile?.conclusionText || defaultConclusion
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        dedicationText: profile?.dedicationText || defaultDedication,
        introText: profile?.introText || defaultIntro,
        competenciesText: profile?.competenciesText || defaultCompetencies,
        learningsText: profile?.learningsText || defaultLearnings,
        impactText: profile?.impactText || defaultImpact,
        conclusionText: profile?.conclusionText || defaultConclusion
      });
    }
  }, [isOpen, profile, defaultDedication, defaultIntro, defaultCompetencies, defaultLearnings, defaultImpact, defaultConclusion]);

  const handleSave = () => {
    setProfile(formData);
    onClose();
  };

  const handleRevise = async (field: keyof typeof formData, sectionName: string) => {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      alert("Please configure the Gemini API Key in the internal settings to use auto-revise.");
      return;
    }

    setIsRevising(true);
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const currentText = formData[field];
      
      const prompt = `You are a helpful assistant. I am giving you a section of my OJT (On-the-Job Training) narrative report.
This is the "${sectionName}" section.

Please rewrite this text to make it unique and clear, while keeping the EXACT SAME meaning, facts, and general structure. 
STYLE: Use VERY SIMPLE AND BASIC ENGLISH WORDS. Do NOT use complicated words, formal corporate jargon, or fancy vocabulary. Make it sound like a normal student wrote it.
Do NOT surround it with quotes, just return the raw rewritten text.

Original text:
${currentText}`;

      const { generateContentWithRetry } = await import('@/lib/gemini');
      const response = await generateContentWithRetry(ai, prompt, 'gemini-3-flash-preview', 3);

      if (response?.text) {
        setFormData(prev => ({
          ...prev,
          [field]: response.text.replace(/```markdown/gi, '').replace(/```/gi, '').trim()
        }));
      } else {
        throw new Error('AI could not generate a response.');
      }
    } catch (err: any) {
      console.error('Revise error:', err);
      alert(err?.message || 'Failed to revise the text. Please try again.');
    } finally {
      setIsRevising(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'dedication', label: 'Dedication', field: 'dedicationText' as const },
    { id: 'intro', label: 'Introduction', field: 'introText' as const },
    { id: 'competencies', label: 'Competencies', field: 'competenciesText' as const },
    { id: 'learnings', label: 'Learnings', field: 'learningsText' as const },
    { id: 'impact', label: 'Impact', field: 'impactText' as const },
    { id: 'conclusion', label: 'Conclusion', field: 'conclusionText' as const },
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30 py-4 shrink-0 rounded-t-xl">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Customize & Revise Narrative Sections
            </CardTitle>
            <CardDescription>
              Write your own custom narrative sections or use AI to automatically revise them so they are unique to you.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <div className="flex border-b border-border overflow-x-auto shrink-0 bg-muted/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-primary text-primary bg-background' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CardContent className="flex-1 overflow-auto p-6 bg-gray-50/50">
          <div className="space-y-4 max-w-3xl mx-auto h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <Label className="text-base font-semibold">{currentTab.label} Text</Label>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                onClick={() => handleRevise(currentTab.field, currentTab.label)}
                disabled={isRevising}
              >
                {isRevising ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Auto-Revise with AI
              </Button>
            </div>
            
            <Textarea 
              className="flex-1 min-h-[300px] text-base leading-relaxed resize-none p-4 shadow-sm"
              value={formData[currentTab.field]}
              onChange={(e) => setFormData(prev => ({ ...prev, [currentTab.field]: e.target.value }))}
            />
          </div>
        </CardContent>
        
        <div className="border-t border-border p-4 bg-muted/30 rounded-b-xl flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Sections
          </Button>
        </div>
      </Card>
    </div>
  );
}
