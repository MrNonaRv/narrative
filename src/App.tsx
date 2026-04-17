import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import DailyEntries from './pages/DailyEntries';
import CalendarView from './pages/CalendarView';
import WeeklyReports from './pages/WeeklyReports';
import MonthlyReports from './pages/MonthlyReports';
import Settings from './pages/Settings';
import Export from './pages/Export';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="progress" element={<Progress />} />
          <Route path="entries" element={<DailyEntries />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="weekly" element={<WeeklyReports />} />
          <Route path="monthly" element={<MonthlyReports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="export" element={<Export />} />
        </Route>
      </Routes>
    </Router>
  );
}
