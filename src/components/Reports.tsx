/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Group, Student, Attendance } from '../types';
import { FileSpreadsheet, FileText, Printer, Users, Calendar, DollarSign, ArrowLeft } from 'lucide-react';

interface ReportsProps {
  groups: Group[];
  students: Student[];
  attendanceLogs: Attendance[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  todayStr: string;
}

export default function Reports({
  groups,
  students,
  attendanceLogs,
  selectedGroupId,
  setSelectedGroupId,
  todayStr,
}: ReportsProps) {
  const currentMonthKey = todayStr.substring(0, 7);
  const [reportType, setReportType] = useState<'attendance' | 'payments'>('attendance');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const filteredStudents = selectedGroupId
    ? students.filter((s) => s.groupId === selectedGroupId)
    : students;

  // Gather appropriate attendance record
  const currentGroupAttendanceLog = attendanceLogs.find(
    (log) => log.groupId === selectedGroupId && log.date === selectedDate
  );

  // EXCEL EXPORTS (CSV UTF-8 with BOM for Excel Arabic Support)
  const exportToExcel = () => {
    let csvContent = '\uFEFF'; // Excel UTF-8 BOM to prevent Arabic distortion

    if (reportType === 'attendance') {
      // Header Info
      csvContent += `"تقرير حضور وغياب الطلاب"\n`;
      csvContent += `"المجموعة:","${activeGroup?.name || 'جميع المجموعات'}"\n`;
      csvContent += `"تاريخ الرصد:","${selectedDate}"\n\n`;

      // Columns
      csvContent += `"اسم الطالب","حالة الحضور","رقم هاتف ولي الأمر","ملاحظات"\n`;

      // Rows
      filteredStudents.forEach((student) => {
        let statusText = 'لم يرصد';
        if (currentGroupAttendanceLog) {
          const status = currentGroupAttendanceLog.records[student.id];
          if (status === 'present') statusText = 'حاضر';
          else if (status === 'absent') statusText = 'غائب';
          else if (status === 'late') statusText = 'متأخر';
        }
        csvContent += `"${student.name}","${statusText}","${student.parentPhone}","${student.notes || ''}"\n`;
      });
    } else {
      // Payments Report
      csvContent += `"تقرير الاشتراكات والرسوم الدراسية"\n`;
      csvContent += `"المجموعة:","${activeGroup?.name || 'جميع المجموعات'}"\n`;
      csvContent += `"الشهر المالي:","${selectedMonth}"\n\n`;

      // Columns
      csvContent += `"اسم الطالب","حالة الدفع لشهر ${selectedMonth}","رقم هاتف ولي الأمر","ملاحظات"\n`;

      // Rows
      filteredStudents.forEach((student) => {
        const isPaid = student.payments?.[selectedMonth] === 'paid';
        const statusText = isPaid ? 'تم الدفع' : 'لم يدفع بعد';
        csvContent += `"${student.name}","${statusText}","${student.parentPhone}","${student.notes || ''}"\n`;
      });
    }

    // Trigger file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${reportType === 'attendance' ? 'تقرير_الحضور' : 'تقرير_الاشتراكات'}_${selectedGroupId || 'الكل'}_${
        reportType === 'attendance' ? selectedDate : selectedMonth
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Turn on Print setup
  const handlePrint = () => {
    window.print();
  };

  // Compute metrics for preview header
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let paidCount = 0;

  filteredStudents.forEach((student) => {
    // Attendance
    if (currentGroupAttendanceLog) {
      const status = currentGroupAttendanceLog.records[student.id];
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'late') lateCount++;
    }
    // Payments
    if (student.payments?.[selectedMonth] === 'paid') {
      paidCount++;
    }
  });

  const unpaidCount = filteredStudents.length - paidCount;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Page description */}
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">تصدير واستخراج التقارير وسجلات الطلاب</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            قم بالفلترة التفصيلية لإنشاء كشوفات الحضور وتقارير المصروفات ثم قم بتصديرها بصيغة كشوفات Excel أو اطبعها مباشرة كتقرير PDF.
          </p>
        </div>
      </div>

      {/* Controllers box */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-stretch lg:items-end">
        
        {/* Report type choose */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">نوع التقرير المطلوبة مراجعته:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setReportType('attendance')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                reportType === 'attendance'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>تقرير الحضور والغياب اليومي</span>
            </button>

            <button
              onClick={() => setReportType('payments')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                reportType === 'payments'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>كشف الاشتراكات والمدفوعات</span>
            </button>
          </div>
        </div>

        {/* Group Selection */}
        <div className="w-full lg:w-60">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">تصفية حسب المجموعة الدراسية:</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">جميع المجموعات</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date / Month selectors */}
        {reportType === 'attendance' ? (
          <div className="w-full lg:w-48">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">اختر تاريخ الحضور المطلوب:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-250 text-sm font-bold font-mono focus:outline-hidden text-right cursor-pointer"
            />
          </div>
        ) : (
          <div className="w-full lg:w-48">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">اختر شهر الاشتراكات المطلوبة:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-250 text-sm font-bold font-mono focus:outline-hidden text-right cursor-pointer"
            />
          </div>
        )}

        {/* Print & excel triggers */}
        <div className="flex gap-3 w-full lg:w-auto">
          <button
            onClick={exportToExcel}
            className="flex-1 lg:flex-none px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 lg:flex-none px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-500/10"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة PDF</span>
          </button>
        </div>
      </div>

      {/* Elegant high fidelity report view layout mimics A4 page report */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm print-card max-w-4xl mx-auto animate-fade-in relative">
        
        {/* Printable Only Header */}
        <div className="hidden print-only border-b border-slate-300 pb-5 mb-6 text-center" dir="rtl">
          <h1 className="text-2xl font-bold text-slate-900">منصة سَجّلْ - لإدارة شؤون الحضور والاشتراكات</h1>
          <p className="text-xs text-slate-500 mt-1">كشف المعلم المربي الرسمي للطلاب وفحص السجلات والمدفوعات</p>
        </div>

        {/* Report visual paper details header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450 px-3 py-1 rounded-full font-bold">
              {reportType === 'attendance' ? 'وثيقة كشف حضور وغياب رسمي' : 'وثيقة تتبع الرسوم والاشتراكات الشهرية'}
            </span>
            <h3 className="text-xl font-bold text-slate-950 dark:text-white mt-3">
              {reportType === 'attendance' ? `تقرير الحضور اليومي لشعب المجموعات` : `كشوفات الرسوم والاشتراكات المدفوعة`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-mono">
              تاريخ إصدار التقرير: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 text-right shrink-0">
            <div className="text-xs">
              <span className="text-slate-400 dark:text-slate-550 block">المجموعة الدراسية:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{activeGroup?.name || 'جميع المجموعات'}</span>
            </div>
            <div className="text-xs mt-3">
              <span className="text-slate-400 dark:text-slate-550 block">الفترة المستهدفة بالفحص:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                {reportType === 'attendance' ? selectedDate : selectedMonth}
              </span>
            </div>
          </div>
        </div>

        {/* Mini stats counters in report sheet */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">عدد الطلاب المشمولين</span>
            <span className="text-lg font-extrabold text-slate-850 dark:text-white mt-1 block font-mono">{filteredStudents.length}</span>
          </div>

          {reportType === 'attendance' ? (
            <>
              <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-450 block">إجمالي الحضور اليوم رصداً</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-500 mt-1 block font-mono">{presentCount}</span>
              </div>
              <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-xl text-center">
                <span className="text-[10px] font-bold text-amber-650 dark:text-amber-450 block">إجمالي المتأخرين اليوم</span>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1 block font-mono">{lateCount}</span>
              </div>
              <div className="p-3.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-xl text-center">
                <span className="text-[10px] font-bold text-red-650 dark:text-red-450 block">إجمالي الغياب اليوم رصداً</span>
                <span className="text-lg font-extrabold text-red-500 mt-1 block font-mono">{absentCount}</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-450 block">الاشتراكات المسددة بالكامل</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-500 mt-1 block font-mono">{paidCount}</span>
              </div>
              <div className="p-3.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-xl text-center col-span-2">
                <span className="text-[10px] font-bold text-red-650 dark:text-red-450 block">المتأخرين والمسائلين عن السداد</span>
                <span className="text-lg font-extrabold text-red-500 mt-1 block font-mono">{unpaidCount}</span>
              </div>
            </>
          )}
        </div>

        {/* Dynamic content table of paper reports */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-8">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 font-bold">
                <th className="p-3">اسم الطالب</th>
                <th className="p-3">المجموعة</th>
                <th className="p-3">رقم هاتف ولي الأمر</th>
                <th className="p-3 text-center">
                  {reportType === 'attendance' ? `حالة حضور يوم ${selectedDate}` : `حالة اشتراك شهر ${selectedMonth}`}
                </th>
                <th className="p-3">ملاحظات المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    لا توجد كشوفات للطلاب معروضة بالمعايير الحالية
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentGroup = groups.find((g) => g.id === student.groupId);
                  
                  // Status components
                  let statusLabel = (
                    <span className="p-1 px-2.5 bg-slate-150 dark:bg-slate-850 text-slate-500 text-[10px] font-bold rounded-full">
                      غير مرصود بعد
                    </span>
                  );

                  if (reportType === 'attendance') {
                    if (currentGroupAttendanceLog) {
                      const st = currentGroupAttendanceLog.records[student.id];
                      if (st === 'present') {
                        statusLabel = (
                          <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/10">
                            حاضر
                          </span>
                        );
                      } else if (st === 'absent') {
                        statusLabel = (
                          <span className="p-1 px-2.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-500/10">
                            غائب
                          </span>
                        );
                      } else if (st === 'late') {
                        statusLabel = (
                          <span className="p-1 px-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/10">
                            متأخر
                          </span>
                        );
                      }
                    }
                  } else {
                    const isPaid = student.payments?.[selectedMonth] === 'paid';
                    statusLabel = isPaid ? (
                      <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/10">
                        تم دفع الاشتراك
                      </span>
                    ) : (
                      <span className="p-1 px-2.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full border border-red-500/10">
                        لم يدفع
                      </span>
                    );
                  }

                  return (
                    <tr key={student.id} className="text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{student.name}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-455">{studentGroup?.name || '---'}</td>
                      <td className="p-3 font-mono" dir="ltr">{student.parentPhone}</td>
                      <td className="p-3 text-center">{statusLabel}</td>
                      <td className="p-3 text-slate-400 dark:text-slate-500 max-w-xs truncate">{student.notes || '---'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paper Footer with signature slots for official printed sheets */}
        <div className="mt-12 flex justify-between items-end border-t border-dashed border-slate-200 p-4 pt-8 text-xs text-slate-500">
          <div className="flex flex-col items-start">
            <span className="font-bold text-slate-800 dark:text-slate-300">ختم وتوقيع المعلم المسؤول:</span>
            <div className="w-48 h-12 border-b border-dashed border-slate-300 mt-4" />
          </div>

          <div className="text-left font-mono text-[10px]">
            <span>إدارة شؤون الحضور بالتزامن مع قواعد المعطيات الرسمية</span>
          </div>
        </div>
      </div>
    </div>
  );
}
