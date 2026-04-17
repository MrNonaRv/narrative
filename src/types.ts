export interface UserProfile {
  name: string;
  courseAndYear: string;
  major: string;
  hostEstablishment: string;
  headOffice: string;
  position: string;
  address: string;
  requiredHours: number;
  facilitator: string;
}

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  status?: 'present' | 'holiday' | 'absent';
  accomplishment: string;
  workingHours: number;
  problemsEncountered: string;
  actionTaken: string;
  remarks: string;
}

export interface WeeklyReport {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  narrative?: string; // Backwards compatibility
  accomplishment?: string;
  problemsEncountered?: string;
  actionTaken?: string;
  remarks?: string;
  commentsAndSuggestions: string;
}

export interface MonthlyReport {
  id: string;
  month: string; // YYYY-MM
  narrative: string;
  commentsAndSuggestions: string;
}

export interface AppState {
  profile: UserProfile;
  entries: DailyEntry[];
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
  setProfile: (profile: Partial<UserProfile>) => void;
  addEntry: (entry: Omit<DailyEntry, 'id'>) => void;
  updateEntry: (id: string, entry: Partial<DailyEntry>) => void;
  deleteEntry: (id: string) => void;
  addWeeklyReport: (report: Omit<WeeklyReport, 'id'>) => void;
  updateWeeklyReport: (id: string, report: Partial<WeeklyReport>) => void;
  deleteWeeklyReport: (id: string) => void;
  addMonthlyReport: (report: Omit<MonthlyReport, 'id'>) => void;
  updateMonthlyReport: (id: string, report: Partial<MonthlyReport>) => void;
  deleteMonthlyReport: (id: string) => void;
}
