/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Group, Student, Attendance } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Save, Loader2 } from 'lucide-react';

interface AttendanceTrackerProps {
  groups: Group[];
  students: Student[];
  attendanceLogs: Attendance[];
  teacherId: string;
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  todayStr: string;
}

export default function AttendanceTracker({
  groups,
  students,
  attendanceLogs,
  teacherId,
  selectedGroupId,
  setSelectedGroupId,
  todayStr,
}: AttendanceTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Filter study groups students
  const filteredStudents = selectedGroupId
    ? students.filter((s) => s.groupId === selectedGroupId)
    : [];

  // Find attendance document for selected group + selected date
  const selectedDocId = `${selectedGroupId}_${selectedDate}`;
  const currentLog = attendanceLogs.find(
    (log) => log.groupId === selectedGroupId && log.date === selectedDate
  );

  // Get current status of student
  const getStudentStatus = (studentId: string): 'present' | 'absent' | 'late' | 'unmarked' => {
    if (!currentLog || !currentLog.records) return 'unmarked';
    return currentLog.records[studentId] || 'unmarked';
  };

  // Switch or mark attendance auto-saves
  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!selectedGroupId) return;

    setSavingStudentId(studentId);
    setJustSaved(false);
    const docPath = `attendance/${selectedDocId}`;

    // Prepare records
    let currentRecords = currentLog ? { ...currentLog.records } : {};
    currentRecords[studentId] = status;

    try {
      if (!currentLog) {
        // Create new attendance document
        await setDoc(doc(db, 'attendance', selectedDocId), {
          id: selectedDocId,
          groupId: selectedGroupId,
          date: selectedDate,
          teacherId,
          records: currentRecords,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing attendance document
        await updateDoc(doc(db, 'attendance', selectedDocId), {
          [`records.${studentId}`]: status,
          updatedAt: serverTimestamp(),
        });
      }

      // Flash success badge
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Set all students to present (حاضر) as a quick shortcut tool
  const markAllAsPresent = async () => {
    if (!selectedGroupId || filteredStudents.length === 0) return;
    if (!window.confirm("هل ترغب في رصد المجموع الكلي للحضور كـ 'حاضر' لجميع الطلاب بلمسة واحدة؟")) return;

    setSavingStudentId('all');
    const docPath = `attendance/${selectedDocId}`;
    
    let allRecords: { [key: string]: 'present' } = {};
    filteredStudents.forEach((student) => {
      allRecords[student.id] = 'present';
    });

    try {
      if (!currentLog) {
        await setDoc(doc(db, 'attendance', selectedDocId), {
          id: selectedDocId,
          groupId: selectedGroupId,
          date: selectedDate,
          teacherId,
          records: allRecords,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'attendance', selectedDocId), {
          records: allRecords,
          updatedAt: serverTimestamp(),
        });
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Calculate live statistical indicators for the day
  let markedCount = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  if (currentLog && currentLog.records) {
    filteredStudents.forEach((student) => {
      const status = currentLog.records[student.id];
      if (status) {
        markedCount++;
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
      }
    });
  }

  const unmarkedCount = filteredStudents.length - markedCount;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">رصد حضور وغياب الطلاب اليومي</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            اختر المجموعة الدراسية وحدد التاريخ المناسب للبدء برصد الحضور. يتم حفظ التغييرات تلقائياً في السجل التاريخي.
          </p>
        </div>

        {/* Live dynamic notifications for saving */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {justSaved && (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3.5 py-1.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>تم الحفظ السحابي تلقائياً في غضون ثوانٍ</span>
            </div>
          )}

          {savingStudentId && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs py-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري المزامنة...</span>
            </div>
          )}
        </div>
      </div>

      {/* Selectors card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-6">
        {/* Choose Group */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">تحديد المجموعة الدراسية المستهدفة:</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="" disabled>-- يرجى اختيار المجموعة للبدء --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Choose Date */}
        <div className="md:w-64">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">تاريخ أخذ الحضور:</label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-250 text-sm font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer text-right"
            />
          </div>
        </div>

        {/* Present all shortcut button */}
        {selectedGroupId && filteredStudents.length > 0 && (
          <div className="flex items-end">
            <button
              onClick={markAllAsPresent}
              disabled={savingStudentId !== null}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-xs whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>رصد حضور الجميع (حاضر)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Student list for marking */}
      {!selectedGroupId ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-xs">
          <Calendar className="w-16 h-16 text-slate-350 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">بانتظار تحديد المجموعة للمتابعة</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            يرجى تحديد الفصل أو المجموعة الدراسية من القائمة العلوية لتظهر لك كشوفات الطلاب وقوائم رصد الحضور والغياب الخاصة بها.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-xs">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">المجموعة خالية من الطلاب</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            لم تقم بإضافة أي طالب مسجل في هذه المجموعة المحددة بعد. يرجى التوجه لـ "إدارة الطلاب المالي" وقيد بعض الطلاب أولاً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* List of study students */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">بطاقات وقوائم رصد الطلاب</h3>
            </div>

            <div className="space-y-4">
              {filteredStudents.map((student) => {
                const status = getStudentStatus(student.id);
                const isSavingThis = savingStudentId === student.id;

                return (
                  <div
                    key={student.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-500/20 transition duration-200"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{student.name}</h4>
                      {student.notes && (
                        <p className="text-[10px] text-slate-400 mt-1 max-w-lg leading-relaxed">{student.notes}</p>
                      )}
                    </div>

                    {/* Button segments representing 'present', 'absent', 'late' */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* PRESENCE (حاضر) */}
                      <button
                        onClick={() => handleMarkAttendance(student.id, 'present')}
                        disabled={isSavingThis}
                        className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          status === 'present'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>حاضر</span>
                      </button>

                      {/* LATE (متأخر) */}
                      <button
                        onClick={() => handleMarkAttendance(student.id, 'late')}
                        disabled={isSavingThis}
                        className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          status === 'late'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        }`}
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>متأخر</span>
                      </button>

                      {/* ABSENCE (غائب) */}
                      <button
                        onClick={() => handleMarkAttendance(student.id, 'absent')}
                        disabled={isSavingThis}
                        className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          status === 'absent'
                            ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/10'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20'
                        }`}
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>غائب</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics summary of the selected date */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm self-start space-y-6">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">ملخص الحضور اليومي</h4>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex justify-between items-center border border-slate-200/50 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">تاريخ اليوم المحدد:</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedDate}</span>
            </div>

            <div className="space-y-3">
              {/* Total students inside class */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">المقيدين بالصف:</span>
                <span className="font-bold font-mono text-slate-805 dark:text-slate-205">{filteredStudents.length} طلاب</span>
              </div>

              {/* Present */}
              <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-500">
                <span className="font-semibold">عدد الحضور:</span>
                <span className="font-bold font-mono">{presentCount} طلاب</span>
              </div>

              {/* Late */}
              <div className="flex justify-between items-center text-xs text-amber-500 dark:text-amber-400">
                <span className="font-semibold">عدد المتأخرين:</span>
                <span className="font-bold font-mono">{lateCount} طلاب</span>
              </div>

              {/* Absent */}
              <div className="flex justify-between items-center text-xs text-red-500">
                <span className="font-semibold">عدد الغياب:</span>
                <span className="font-bold font-mono">{absentCount} طلاب</span>
              </div>

              {/* Unmarked */}
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold">بانتظار الرصد والتعليم:</span>
                <span className="font-bold font-mono">{unmarkedCount} طالب</span>
              </div>
            </div>

            {/* Overall present percentage */}
            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-705 dark:text-slate-305">نسبة حضور الفصل:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 font-mono">
                  {filteredStudents.length > 0 ? (((presentCount + lateCount) / filteredStudents.length) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all rounded-full"
                  style={{
                    width: `${filteredStudents.length > 0 ? ((presentCount + lateCount) / filteredStudents.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
