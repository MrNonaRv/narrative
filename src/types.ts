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
  introText?: string;
  competenciesText?: string;
  learningsText?: string;
  impactText?: string;
  conclusionText?: string;
  dedicationText?: string;
  certificateImageUrl?: string;
  signatureImageUrl?: string;
  documentationImages?: { id: string; url: string; caption?: string }[];
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
  narrative?: string; // Kept for legacy compatibility
  accomplishment?: string;
  problemsEncountered?: string;
  actionTaken?: string;
  remarks?: string;
  commentsAndSuggestions: string;
}

export interface SavedAccount {
  id: string;
  profile: UserProfile;
  entries: DailyEntry[];
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
}

export interface AppState {
  currentAccountId: string;
  savedAccounts: SavedAccount[];
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
  bulkUpdateEntries: (updatedEntries: DailyEntry[]) => void;
  bulkUpdateWeeklyReports: (updatedReports: WeeklyReport[]) => void;
  bulkUpdateMonthlyReports: (updatedReports: MonthlyReport[]) => void;
  clearAllData: () => void;
  
  // Account Management
  saveCurrentAccount: () => void;
  switchAccount: (accountId: string) => void;
  createNewAccount: (studentName?: string) => void;
  deleteAccount: (accountId: string) => void;
}
