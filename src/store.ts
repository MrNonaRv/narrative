import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import { AppState } from './types';

const storageWrapper: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    let val = await get(name);
    if (!val) {
      val = localStorage.getItem(name);
      if (val) {
        try {
          await set(name, val);
        } catch (e) {
          console.error("Failed to migrate data from localStorage to IndexedDB:", e);
        }
      }
    }
    return val || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (e: any) {
      console.error("IndexedDB setItem error:", e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const defaultProfile = {
  name: '',
  courseAndYear: '',
  major: '',
  hostEstablishment: '',
  headOffice: '',
  position: '',
  address: '',
  requiredHours: 486,
  facilitator: '',
  introText: '',
  competenciesText: '',
  learningsText: '',
  impactText: '',
  conclusionText: '',
  certificateImageUrl: '',
  signatureImageUrl: '',
  documentationImages: [],
};

const defaultEvaluationData = {
  college: '',
  major: '',
  telNo: '',
  employability: '',
  allowance: '',
  telephoneNo: '',
  employedCompany: '',
  department: '',
  position: '',
  otherDept: '',
  rater: '',
  dateOfEvaluation: '',
  dateOfLastEvaluation: '',
  duties: '',
  strongestArea: '',
  improvedMost: '',
  needImprovement: '',
  challengingSituation: '',
  overcameChallenge: '',
  learnedExperience: '',
  qualifiedLinkage: '',
  recommendation: ''
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentAccountId: uuidv4(),
      savedAccounts: [],
      profile: { ...defaultProfile },
      evaluationData: { ...defaultEvaluationData },
      entries: [],
      weeklyReports: [],
      monthlyReports: [],
      
      setProfile: (profile) =>
        set((state) => {
          const newState = { profile: { ...state.profile, ...profile } };
          return newState;
        }),

      setEvaluationData: (data) =>
        set((state) => ({
          evaluationData: { ...state.evaluationData, ...data },
        })),
      
      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, { ...entry, id: uuidv4() }],
        })),
      updateEntry: (id, updatedEntry) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updatedEntry } : entry
          ),
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),
      addWeeklyReport: (report) =>
        set((state) => ({
          weeklyReports: [...state.weeklyReports, { ...report, id: uuidv4() }],
        })),
      updateWeeklyReport: (id, updatedReport) =>
        set((state) => ({
          weeklyReports: state.weeklyReports.map((report) =>
            report.id === id ? { ...report, ...updatedReport } : report
          ),
        })),
      deleteWeeklyReport: (id) =>
        set((state) => ({
          weeklyReports: state.weeklyReports.filter((report) => report.id !== id),
        })),
      addMonthlyReport: (report) =>
        set((state) => ({
          monthlyReports: [...state.monthlyReports, { ...report, id: uuidv4() }],
        })),
      updateMonthlyReport: (id, updatedReport) =>
        set((state) => ({
          monthlyReports: state.monthlyReports.map((report) =>
            report.id === id ? { ...report, ...updatedReport } : report
          ),
        })),
      deleteMonthlyReport: (id) =>
        set((state) => ({
          monthlyReports: state.monthlyReports.filter((report) => report.id !== id),
        })),
      
      bulkUpdateEntries: (updatedEntries) =>
        set((state) => {
          const entriesMap = new Map(updatedEntries.map(e => [e.id, e]));
          return {
            entries: state.entries.map(e => entriesMap.has(e.id) ? { ...e, ...entriesMap.get(e.id) } : e)
          };
        }),

      bulkUpdateWeeklyReports: (updatedReports) =>
        set((state) => {
          const reportsMap = new Map(updatedReports.map(r => [r.id, r]));
          return {
            weeklyReports: state.weeklyReports.map(r => reportsMap.has(r.id) ? { ...r, ...reportsMap.get(r.id) } : r)
          };
        }),

      bulkUpdateMonthlyReports: (updatedReports) =>
        set((state) => {
          const reportsMap = new Map(updatedReports.map(r => [r.id, r]));
          return {
            monthlyReports: state.monthlyReports.map(r => reportsMap.has(r.id) ? { ...r, ...reportsMap.get(r.id) } : r)
          };
        }),
      
      clearAllData: () =>
        set(() => ({
          profile: { ...defaultProfile },
          evaluationData: { ...defaultEvaluationData },
          entries: [],
          weeklyReports: [],
          monthlyReports: [],
        })),

      saveCurrentAccount: () =>
        set((state) => {
          // Find if the current account is already in savedAccounts, update it or add it
          const existingIndex = state.savedAccounts.findIndex(acc => acc.id === state.currentAccountId);
          const currentAccountSnapshot = {
            id: state.currentAccountId || uuidv4(),
            profile: state.profile,
            evaluationData: state.evaluationData,
            entries: state.entries,
            weeklyReports: state.weeklyReports,
            monthlyReports: state.monthlyReports
          };

          const newSaved = [...state.savedAccounts];
          if (existingIndex >= 0) {
            newSaved[existingIndex] = currentAccountSnapshot;
          } else {
            newSaved.push(currentAccountSnapshot);
          }

          return {
            currentAccountId: currentAccountSnapshot.id,
            savedAccounts: newSaved
          };
        }),

      switchAccount: (accountId) =>
        set((state) => {
          // First explicitly save the current state before switching
          const currentAccountSnapshot = {
            id: state.currentAccountId || uuidv4(),
            profile: state.profile,
            evaluationData: state.evaluationData,
            entries: state.entries,
            weeklyReports: state.weeklyReports,
            monthlyReports: state.monthlyReports
          };

          let newSaved = [...state.savedAccounts];
          const existingIndex = newSaved.findIndex(acc => acc.id === currentAccountSnapshot.id);
          if (existingIndex >= 0) {
            newSaved[existingIndex] = currentAccountSnapshot;
          } else {
            newSaved.push(currentAccountSnapshot);
          }

          const targetAccount = newSaved.find(acc => acc.id === accountId);
          if (!targetAccount) return { savedAccounts: newSaved }; // Shouldn't happen unless bad ID

          return {
            savedAccounts: newSaved,
            currentAccountId: targetAccount.id,
            profile: { ...defaultProfile, ...(targetAccount.profile || {}) },
            evaluationData: { ...defaultEvaluationData, ...(targetAccount.evaluationData || {}) },
            entries: targetAccount.entries || [],
            weeklyReports: targetAccount.weeklyReports || [],
            monthlyReports: targetAccount.monthlyReports || []
          };
        }),

      createNewAccount: (studentName?: string) =>
        set((state) => {
          // First explicitly save the current state
          const currentAccountSnapshot = {
            id: state.currentAccountId || uuidv4(),
            profile: state.profile,
            evaluationData: state.evaluationData,
            entries: state.entries,
            weeklyReports: state.weeklyReports,
            monthlyReports: state.monthlyReports
          };

          let newSaved = [...state.savedAccounts];
          const existingIndex = newSaved.findIndex(acc => acc.id === currentAccountSnapshot.id);
          if (existingIndex >= 0) {
            newSaved[existingIndex] = currentAccountSnapshot;
          } else {
            newSaved.push(currentAccountSnapshot);
          }

          // Generate empty state
          const newAccountId = uuidv4();
          
          // Also immediately add this new account to the saved accounts list so it appears in the UI
          const newProfile = {
            ...defaultProfile,
            name: studentName || '',
          };
          
          newSaved.push({
            id: newAccountId,
            profile: newProfile,
            evaluationData: { ...defaultEvaluationData },
            entries: [],
            weeklyReports: [],
            monthlyReports: []
          });

          return {
            savedAccounts: newSaved,
            currentAccountId: newAccountId,
            profile: newProfile,
            evaluationData: { ...defaultEvaluationData },
            entries: [],
            weeklyReports: [],
            monthlyReports: []
          };
        }),

      deleteAccount: (accountId) =>
        set((state) => ({
          savedAccounts: state.savedAccounts.filter(acc => acc.id !== accountId)
        })),
    }),
    {
      name: 'ojt-tracker-storage',
      storage: createJSONStorage(() => storageWrapper),
    }
  )
);
