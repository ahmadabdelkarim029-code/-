/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Group, Student } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit3, Save, X, Phone, UserPlus, FileText, Check, DollarSign, Send, MessageCircle } from 'lucide-react';

interface StudentManagerProps {
  groups: Group[];
  students: Student[];
  teacherId: string;
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  todayStr: string;
}

export default function StudentManager({
  groups,
  students,
  teacherId,
  selectedGroupId,
  setSelectedGroupId,
  todayStr,
}: StudentManagerProps) {
  const currentMonthKey = todayStr.substring(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Forms State
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(selectedGroupId || '');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter students based on chosen group
  const filteredStudents = selectedGroupId
    ? students.filter((s) => s.groupId === selectedGroupId)
    : students;

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupId || !parentPhone.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة واختيار المجموعة الخاصة بالطالب.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const studentId = 'student_' + Math.random().toString(36).substring(2, 11);
    const newStudentPath = `students/${studentId}`;

    try {
      await setDoc(doc(db, 'students', studentId), {
        id: studentId,
        name: name.trim(),
        groupId,
        parentPhone: parentPhone.trim(),
        notes: notes.trim(),
        teacherId,
        payments: {
          [selectedMonth]: 'unpaid', // Default unpaid when registering
        },
        createdAt: serverTimestamp(),
      });

      // Reset form controls
      setName('');
      setParentPhone('');
      setNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, newStudentPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditing = (student: Student) => {
    setEditingStudentId(student.id);
    setEditName(student.name);
    setEditGroupId(student.groupId);
    setEditParentPhone(student.parentPhone);
    setEditNotes(student.notes);
  };

  const handleSaveStudent = async (studentId: string) => {
    if (!editName.trim() || !editGroupId || !editParentPhone.trim()) return;

    setIsSubmitting(true);
    setError(null);
    const updatePath = `students/${studentId}`;

    try {
      await updateDoc(doc(db, 'students', studentId), {
        name: editName.trim(),
        groupId: editGroupId,
        parentPhone: editParentPhone.trim(),
        notes: editNotes.trim(),
      });
      setEditingStudentId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, updatePath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف كشف الطالب "${studentName}" تماماً من السجلات؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const deletePath = `students/${studentId}`;

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, deletePath);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle payments state direct mutation
  const handleTogglePayment = async (student: Student, month: string) => {
    const currentStatus = student.payments?.[month] || 'unpaid';
    const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const updatePath = `students/${student.id}`;

    try {
      await updateDoc(doc(db, 'students', student.id), {
        [`payments.${month}`]: nextStatus,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, updatePath);
    }
  };

  // Clean and prepare standard Arabic WhatsApp messages
  const getWhatsAppLink = (phone: string, studentName: string) => {
    // Strip standard spaces or custom signs on numbers
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const message = `السلام عليكم ورحمة الله وبركاته، مدرسة الطالب(ة) ${studentName}: أود إحاطتكم بخصوص وضع الطالب تفصيلياً كالتالي...`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Selection Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">إدرة شؤون ملفات الطلاب والاشتراكات المالية</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تسجيل الطلاب الجدد، تتبع الاشتراكات الشهرية، تعديل السجلات، والتواصل المباشر مع أولياء الأمور بلمسة واحدة.
          </p>
        </div>

        {/* Global Select Options */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Group dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">تصفية حسب المجموعة:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setGroupId(e.target.value || (groups[0]?.id || ''));
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden ring-0 cursor-pointer"
            >
              <option value="">جميع الطلاب</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month selective key */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">الشهر المستهدف للرسوم:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-250 text-xs font-bold font-mono focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-r-4 border-red-500 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid containing roster on right and adding student form on left */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Adder Column tool */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">تسجيل طالب جديد</h3>
          </div>

          {groups.length === 0 ? (
            <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-dashed border-amber-500/25 rounded-2xl text-center">
              <p className="text-xs text-amber-600 dark:text-amber-500 font-bold leading-relaxed">
                يرجى أولاً البدء بإنشاء مجموعة دراسية واحدة أو أكثر من قسم "إدارة المجموعات" لتتمكن من إضافة وقيد الطلاب بداخلها.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddStudent} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">اسم الطالب ثلاثياً *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل للطالب"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              {/* Group Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">المجموعة الدراسية *</label>
                <select
                  required
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition cursor-pointer"
                >
                  <option value="" disabled>-- اختر مجموعة --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">رقم هاتف ولي الأمر (بالكود) *</label>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="مثال: +966500000000"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-805 dark:text-slate-200 placeholder-slate-405 dark:placeholder-slate-500 text-xs font-mono text-left focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                  dir="ltr"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثل: نقاط الضعف، الإنجازات، حالات مرضية..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition disabled:opacity-50 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة الطالب وحفظه</span>
              </button>
            </form>
          )}
        </div>

        {/* List Column tool */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">سجلات وجداول الطلاب المضافة</h3>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold font-mono px-3 py-1 rounded-full">
              عدد الطلاب المعروضين: {filteredStudents.length}
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Plus className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">لا يوجد طلاب متوافقين مع معايير البحث الحالية</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ابدأ بملء النموذج لتسجيل الطالب أو اختر مجموعة دراسية أخرى.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold">
                    <th className="py-4 px-3">اسم الطالب</th>
                    <th className="py-4 px-3">المجموعة</th>
                    <th className="py-4 px-3">رقم ولي الأمر</th>
                    <th className="py-4 px-3">ملاحظات</th>
                    <th className="py-4 px-2 text-center text-slate-850 dark:text-slate-250">تتبع اشتراك شهر {selectedMonth}</th>
                    <th className="py-4 px-3 text-center">إجراءات وتعديلات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((student) => {
                    const isEditing = editingStudentId === student.id;
                    const groupObj = groups.find((g) => g.id === student.groupId);
                    const isPaid = student.payments?.[selectedMonth] === 'paid';

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Student Name */}
                        <td className="py-4 px-3 font-semibold text-slate-900 dark:text-slate-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md font-semibold text-slate-800 dark:text-slate-200 text-xs w-full focus:outline-hidden"
                            />
                          ) : (
                            student.name
                          )}
                        </td>

                        {/* Group assignment */}
                        <td className="py-4 px-3 text-slate-655 dark:text-slate-400">
                          {isEditing ? (
                            <select
                              value={editGroupId}
                              onChange={(e) => setEditGroupId(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-200 text-xs w-full focus:outline-hidden"
                            >
                              {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            groupObj?.name || 'مجموعة محذوفة'
                          )}
                        </td>

                        {/* Phone contacts & click commands */}
                        <td className="py-4 px-3 font-mono" dir="ltr">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editParentPhone}
                              onChange={(e) => setEditParentPhone(e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md font-mono text-slate-800 dark:text-slate-200 text-xs w-full text-left focus:outline-hidden"
                            />
                          ) : (
                            <div className="flex items-center gap-2 justify-end" dir="rtl">
                              <span className="font-mono text-slate-700 dark:text-slate-350">{student.parentPhone}</span>
                              <div className="flex gap-1.5 justify-center">
                                {/* Direct calling tool */}
                                <a
                                  href={`tel:${student.parentPhone}`}
                                  className="p-1 px-1.5 text-xs text-blue-600 bg-blue-500/15 hover:bg-blue-500/25 rounded-lg font-bold flex items-center justify-center cursor-pointer transition"
                                  title="الاتصال الهاتفي المباشر لولي الأمر"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                {/* WhatsApp contact tools */}
                                <a
                                  href={getWhatsAppLink(student.parentPhone, student.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 px-1.5 text-xs text-emerald-600 bg-emerald-500/15 hover:bg-emerald-500/25 rounded-lg font-bold flex items-center justify-center cursor-pointer transition"
                                  title="إرسال رسالة واتساب لولي الأمر"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Notes segment */}
                        <td className="py-4 px-3 text-slate-500 dark:text-slate-450 max-w-xs truncate">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-slate-450 inline" />
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-200 text-xs w-full focus:outline-hidden"
                              />
                            </div>
                          ) : (
                            student.notes || 'لا يوجد ملاحظات'
                          )}
                        </td>

                        {/* Payments Ledger indicator toggler */}
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => handleTogglePayment(student, selectedMonth)}
                            className={`p-1.5 px-3.5 rounded-full font-bold text-[10px] leading-tight flex items-center gap-1.5/2 mx-auto transition duration-200 shadow-xs cursor-pointer ${
                              isPaid
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/15 hover:bg-red-500/25 text-red-650 dark:text-red-400 border border-red-500/20'
                            }`}
                          >
                            <DollarSign className="w-3.5 h-3.5 shrink-0" />
                            <span>{isPaid ? 'حساب مدفوع (تمت المعاملة)' : 'حساب معلق (لم يدفع بعد)'}</span>
                          </button>
                        </td>

                        {/* Action controllers */}
                        <td className="py-4 px-3 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveStudent(student.id)}
                                className="p-1 px-2.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>حفظ</span>
                              </button>
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="p-1 px-2.5 text-xs text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-755 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>إلغاء</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleStartEditing(student)}
                                className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                                title="تعديل بيانات الطالب"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id, student.name)}
                                className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-200/50 dark:hover:bg-red-950/20 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                                title="حذف قيد الطالب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
