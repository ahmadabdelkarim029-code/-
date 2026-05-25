/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Group, Student, Attendance, ViewType } from './types';

// Icons
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarCheck,
  FileText,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Loader2,
} from 'lucide-react';

// Components
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import GroupManager from './components/GroupManager';
import StudentManager from './components/StudentManager';
import AttendanceTracker from './components/AttendanceTracker';
import Reports from './components/Reports';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Database States
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);

  // Navigation & Filtering
  const [view, setView] = useState<ViewType>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Time utilities
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayStr = getTodayString();

  // Dark Mode context support
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Handle Firebase User Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedUser) => {
      setUser(loggedUser);
      setAuthLoading(false);
      
      // Auto-set defaults when logger shifts
      if (!loggedUser) {
        setGroups([]);
        setStudents([]);
        setAttendanceLogs([]);
        setView('dashboard');
        setSelectedGroupId('');
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync real-time Firestore collections only of authenticated Teacher
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const groupsQuery = query(collection(db, 'groups'), where('teacherId', '==', user.uid));
    const studentsQuery = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const attendanceQuery = query(collection(db, 'attendance'), where('teacherId', '==', user.uid));

    // Listen to Groups change
    const unsubGroups = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const list: Group[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Group);
        });
        setGroups(list);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'groups');
        setLoading(false);
      }
    );

    // Listen to Students change
    const unsubStudents = onSnapshot(
      studentsQuery,
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Student);
        });
        setStudents(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'students');
      }
    );

    // Listen to Attendance change
    const unsubAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const list: Attendance[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Attendance);
        });
        setAttendanceLogs(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'attendance');
      }
    );

    return () => {
      unsubGroups();
      unsubStudents();
      unsubAttendance();
    };
  }, [user]);

  // Handle Logout trigger
  const handleLogout = async () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج عن النظام؟')) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout Error:', err);
      }
    }
  };

  // Auth Loading State fallback
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto animate-pulse" />
          <p className="text-xs text-slate-505 dark:text-slate-400 font-bold">جاري التحقق من هوية المربي والاتصال بقاعدة المدوّنات السحابية...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated fallback welcome view
  if (!user) {
    return <AuthScreen isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
  }

  // Side Navigation Menu definitions
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'groups', label: 'المجموعات والصفوف', icon: FolderKanban },
    { id: 'students', label: 'شؤون الطلاب والرسوم', icon: Users },
    { id: 'attendance', label: 'رصد الحضور والغياب', icon: CalendarCheck },
    { id: 'reports', label: 'التقارير والكشوفات', icon: FileText },
  ];

  return (
    <div
      className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col`}
      dir="rtl"
    >
      {/* Dynamic Upper Top Nav bar */}
      <header className="no-print w-full sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex justify-between items-center px-4 sm:px-6 py-4">
        
        {/* Right side Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl md:hidden cursor-pointer"
            title="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-none">مَنصّة سَجِّلْ</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">سجل الحضور والاشتراكات الدراسية</p>
          </div>
        </div>

        {/* Left side Profile info and actions */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden md:inline-block border-l border-slate-200/50 dark:border-slate-800 pl-3">
            المعلم المربي: {user.displayName || user.email}
          </span>

          {/* Theme toggler */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-slate-600 dark:text-slate-300 transition duration-150 cursor-pointer"
            title={isDarkMode ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl transition duration-150 cursor-pointer"
            title="تسجيل الخروج عن المنصة"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main workspace frame */}
      <div className="flex-1 flex flex-row relative h-full">
        {/* Sidebar Left Navigation on Tablet/Desktop */}
        <aside className="no-print hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800/80 p-4 shrink-0 justify-between">
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as ViewType)}
                  className={`w-full p-3.5 px-4 text-right rounded-2xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer transition duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/40 dark:border-slate-800">
            <span className="text-[10px] text-slate-455 font-semibold block leading-tight">تاريخ السحابة اليوم:</span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-500 mt-1 block">
              {todayStr}
            </span>
          </div>
        </aside>

        {/* Mobile slide outline Menu navigation drawer */}
        {mobileMenuOpen && (
          <div className="no-print md:hidden fixed inset-0 z-30 transition-all">
            {/* Backdrop overlay */}
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Nav slide container */}
            <nav className="absolute top-0 right-0 w-64 h-full bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">قائمة المنصة</h3>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = view === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setView(item.id as ViewType);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full p-3.5 px-4 text-right rounded-xl text-xs font-bold flex items-center gap-3 cursor-pointer transition ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl leading-relaxed">
                <p className="text-[10px] text-slate-400 font-bold block">المستخدم:</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-350 truncate mt-0.5">{user.email}</p>
              </div>
            </nav>
          </div>
        )}

        {/* Main interactive panel canvas container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading && (
            <div className="no-print absolute top-4 left-4 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-xs text-xs">
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>جاري تحميل التحديثات...</span>
            </div>
          )}

          {/* Tab switches */}
          {view === 'dashboard' && (
            <Dashboard
              groups={groups}
              students={students}
              attendanceLogs={attendanceLogs}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              setView={setView}
              todayStr={todayStr}
            />
          )}

          {view === 'groups' && (
            <GroupManager groups={groups} students={students} teacherId={user.uid} />
          )}

          {view === 'students' && (
            <StudentManager
              groups={groups}
              students={students}
              teacherId={user.uid}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              todayStr={todayStr}
            />
          )}

          {view === 'attendance' && (
            <AttendanceTracker
              groups={groups}
              students={students}
              attendanceLogs={attendanceLogs}
              teacherId={user.uid}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              todayStr={todayStr}
            />
          )}

          {view === 'reports' && (
            <Reports
              groups={groups}
              students={students}
              attendanceLogs={attendanceLogs}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              todayStr={todayStr}
            />
          )}
        </main>
      </div>

      {/* Embedded Mobile Bottom Sticky Bar Navigation representing Touch Target Guidelines */}
      <nav className="no-print md:hidden block fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10 flex flex-row py-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`flex-1 flex flex-col items-center py-2.5 px-1 justify-center relative cursor-pointer outline-none ${
                isActive ? 'text-emerald-600 dark:text-emerald-500 font-bold' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] leading-tight block">{item.label.split(' ')[0]}</span>
              {isActive && (
                <span className="absolute bottom-0 w-5 h-0.5 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
      {/* spacing to avoid mobile sticky covering content */}
      <div className="md:hidden h-14 no-print shrink-0" />
    </div>
  );
}
