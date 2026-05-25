/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Group, Student } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit3, Save, X, FolderKanban, Check } from 'lucide-react';

interface GroupManagerProps {
  groups: Group[];
  students: Student[];
  teacherId: string;
}

export default function GroupManager({ groups, students, teacherId }: GroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a study group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const groupId = 'group_' + Math.random().toString(36).substring(2, 11);
    const newGroupPath = `groups/${groupId}`;

    try {
      await setDoc(doc(db, 'groups', groupId), {
        id: groupId,
        name: newGroupName.trim(),
        teacherId: teacherId,
        createdAt: serverTimestamp(),
      });
      setNewGroupName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, newGroupPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Turn on edit mode for group title
  const startEditing = (g: Group) => {
    setEditingGroupId(g.id);
    setEditingGroupName(g.name);
  };

  // Save changes to group title
  const handleSaveGroupName = async (groupId: string) => {
    if (!editingGroupName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    const updatePath = `groups/${groupId}`;

    try {
      await updateDoc(doc(db, 'groups', groupId), {
        name: editingGroupName.trim(),
      });
      setEditingGroupId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, updatePath);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a study group containing state guards
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const studentCount = students.filter((s) => s.groupId === groupId).length;
    
    let confirmMsg = `هل أنت متأكد من حذف المجموعة "${groupName}"؟`;
    if (studentCount > 0) {
      confirmMsg += `\n\nتنبيه: تحتوي هذه المجموعة على ${studentCount} من الطلاب المضافين. سيتم بقاء الطلاب مسجلين بلا مجموعة.`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const deletePath = `groups/${groupId}`;

    try {
      await deleteDoc(doc(db, 'groups', groupId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, deletePath);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">إدارة وإعداد المجموعات والصفوف</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          قم بإنشاء وتعديل وإدارة المجموعات لتوزيع طلابك وإدارة حضورهم بشكل هرمي دقيق.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-r-4 border-red-500 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create group form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">إضافة مجموعة جديدة</h3>
          </div>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">اسم المجموعة أو الصف الدراسي</label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="مثال: الصف الأول أ - لغة عربية"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newGroupName.trim()}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-98 transition disabled:opacity-50 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء المجموعة الآن</span>
            </button>
          </form>
        </div>

        {/* Existing groups list */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-6">المجموعات الحالية المتاحة</h3>

          {groups.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <FolderKanban className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">لا توجد مجموعات مضافة بعد</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ابدأ بكتابة اسم المجموعة في النموذج الجانبي لإنشائها.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group) => {
                const groupStudentsCount = students.filter((s) => s.groupId === group.id).length;
                const isEditing = editingGroupId === group.id;

                return (
                  <div
                    key={group.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition group duration-250 relative overflow-hidden"
                  >
                    {/* Top Group name or input editing */}
                    <div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-850 dark:text-slate-200 text-sm font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleSaveGroupName(group.id)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shrink-0 cursor-pointer"
                            title="حفظ"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingGroupId(null)}
                            className="p-1.5 bg-slate-200 dark:bg-slate-755 text-slate-600 dark:text-slate-350 rounded-lg hover:bg-slate-300 transition shrink-0 cursor-pointer"
                            title="إلغاء التعديل"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{group.name}</h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                            <button
                              onClick={() => startEditing(group)}
                              className="p-1.5 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="تعديل اسم المجموعة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id, group.name)}
                              className="p-1.5 text-slate-500 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="حذف المجموعة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display total enrolled student count inside the Group card */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        الطلاب المقيدين: <span className="font-bold text-emerald-600 dark:text-emerald-500 font-mono text-sm">{groupStudentsCount}</span> طالب
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-550 block font-mono">
                        معرف الحساب: {group.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
