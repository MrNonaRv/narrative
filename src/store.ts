import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from './types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: {
        name: '',
        courseAndYear: '',
        major: '',
        hostEstablishment: '',
        headOffice: '',
        position: '',
        address: '',
        requiredHours: 486,
        facilitator: '',
      },
      entries: [],
      weeklyReports: [],
      monthlyReports: [],
      setProfile: (profile) =>
        set((state) => ({ profile: { ...state.profile, ...profile } })),
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
    }),
    {
      name: 'ojt-tracker-storage',
    }
  )
);
