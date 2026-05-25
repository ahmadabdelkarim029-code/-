/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Group, Student, Attendance } from '../types';
import { Users, UserCheck, UserX, UserMinus, DollarSign, ArrowRight, TrendingUp } from 'lucide-react';

interface DashboardProps {
  groups: Group[];
  students: Student[];
  attendanceLogs: Attendance[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  setView: (view: 'dashboard' | 'groups' | 'students' | 'attendance' | 'reports') => void;
  todayStr: string;
}

export default function Dashboard({
  groups,
  students,
  attendanceLogs,
  selectedGroupId,
  setSelectedGroupId,
  setView,
  todayStr,
}: DashboardProps) {
  // Filter students by selected group if any
  const filteredStudents = selectedGroupId
    ? students.filter((s) => s.groupId === selectedGroupId)
    : students;

  // Filter groups
  const activeGroup = groups.find((g) => g.id === selectedGroupId);

  // Today's attendance record
  // Today's attendance is the document where date = YYYY-MM-DD
  const todayAttendanceLogs = selectedGroupId
    ? attendanceLogs.filter((al) => al.date === todayStr && al.groupId === selectedGroupId)
    : attendanceLogs.filter((al) => al.date === todayStr);

  const totalStudentsCount = filteredStudents.length;

  // Calculate attendance counters for today
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  if (selectedGroupId) {
    // If a group is selected, check the records for this group's log
    const log = todayAttendanceLogs.find((l) => l.groupId === selectedGroupId);
    if (log) {
      Object.values(log.records).forEach((status) => {
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
      });
    } else {
      // No attendance recorded yet
      absentCount = 0; // Or treat all as unrecorded or absent? Let's leave at 0 and show unrecorded state
    }
  } else {
    // Aggregated attendance across all groups
    todayAttendanceLogs.forEach((log) => {
      Object.values(log.records).forEach((status) => {
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
      });
    });
  }

  // Payments calculations (For the current month: YYYY-MM)
  const currentMonthKey = todayStr.substring(0, 7); // e.g. "2026-05"
  let paidCount = 0;
  let unpaidCount = 0;

  filteredStudents.forEach((student) => {
    const status = student.payments?.[currentMonthKey] || 'unpaid';
    if (status === 'paid') {
      paidCount++;
    } else {
      unpaidCount++;
    }
  });

  const paymentRatio = totalStudentsCount > 0 ? (paidCount / totalStudentsCount) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">لوحة التحكم والإحصائيات</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة شاملة لحالة الحضور والمتحصلات الشهرية لشهر <span className="font-semibold text-emerald-600 dark:text-emerald-500">{currentMonthKey}</span>
          </p>
        </div>

        {/* Group Filter Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 shrink-0">المجموعة المعروضة:</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full sm:w-56 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition shadow-xs"
          >
            <option value="">جميع المجموعات</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي الطلاب المسجلين</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono">{totalStudentsCount}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">الطلاب المضافين تحت إشرافك</span>
          </div>
        </div>

        {/* Today's Presence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">حاضر (اليوم)</p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mt-2 font-mono">{presentCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>تاريخ اليوم: </span>
            <span className="font-mono text-emerald-600 font-semibold">{todayStr}</span>
          </div>
        </div>

        {/* Today's Absence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">غائب (اليوم)</p>
              <h3 className="text-3xl font-bold text-red-500 dark:text-red-400 mt-2 font-mono">{absentCount}</h3>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl">
              <UserX className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>يتطلب المتابعة مع أولياء الأمور</span>
          </div>
        </div>

        {/* Today's Late */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">متأخر (اليوم)</p>
              <h3 className="text-3xl font-bold text-amber-500 dark:text-amber-400 mt-2 font-mono">{lateCount}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-xl">
              <UserMinus className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>تم رصدهم مع بداية الفصل</span>
          </div>
        </div>
      </div>

      {/* Subscription Ledger Progress and Quick Access Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Subscription Statistics panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">إحصائيات متحصلات الشهر الحالية</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">حالة دفع الاشتراكات والرسوم الدراسية لشهر {currentMonthKey}</p>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Visual Circular/Bar Progress Indicators */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">نسبة الطلاب المسددين للاشتراك</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500 font-mono">{paymentRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${paymentRatio}%` }}
                  />
                </div>
              </div>

              {/* Stats Split Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-450 block">تم الدفع (حسب الاشتراك)</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 font-mono">{paidCount}</span>
                    <span className="text-xs text-slate-400">طالب</span>
                  </div>
                </div>

                <div className="p-4 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/10">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-450 block">لم يدفع بعد</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-bold text-red-500 dark:text-red-400 font-mono">{unpaidCount}</span>
                    <span className="text-xs text-slate-400">طالب</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setView('students')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>إدارة وتعديل كشوفات الطلاب والمدفوعات</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Quick Actions Shortcuts Side card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">إجراءات سريعة ومختصرات</h4>

            <div className="space-y-3">
              <button
                onClick={() => setView('attendance')}
                className="w-full p-4.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-right rounded-2xl border border-slate-200/50 dark:border-slate-750 flex items-center justify-between transition group cursor-pointer"
              >
                <div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">أخذ الحضور الحالي</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">رصد حضور وغياب الفصل اليومي</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-[-4px] transition-transform rotate-180" />
              </button>

              <button
                onClick={() => setView('groups')}
                className="w-full p-4.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-right rounded-2xl border border-slate-200/50 dark:border-slate-750 flex items-center justify-between transition group cursor-pointer"
              >
                <div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">إدارة ودراسة المجموعات</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">إنشاء وتعديل شعب الفصول التعليمية</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-[-4px] transition-transform rotate-180" />
              </button>

              <button
                onClick={() => setView('reports')}
                className="w-full p-4.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-right rounded-2xl border border-slate-200/50 dark:border-slate-750 flex items-center justify-between transition group cursor-pointer"
              >
                <div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">تصدير التقارير الورقية</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">استخراج وتصدير PDF و Excel</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-[-4px] transition-transform rotate-180" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/10 flex items-start gap-3 mt-6">
            <TrendingUp className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-amber-600 dark:text-amber-500 block">توجيه تربوي: </span>
              احرص على رصد وتأكيد حضور الطلاب بشكل دوري لضمان انتظام الجلسات والتحصيل العلمي للمجموعات.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
