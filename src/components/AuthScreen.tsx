/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, GraduationCap, CheckCircle2, Moon, Sun } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthScreenProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function AuthScreen({ isDarkMode, toggleDarkMode }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign-in error: ", err);
      // Translate complex firebase errors into user-friendly Arabic
      if (err.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة للطلب. يرجى تفعيل النوافذ المنبثقة من إعدادات متصفحك.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors duration-300 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -ml-30 -mb-30" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">سَجِّـــلْ</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">نظام إدارة الطلاب والاشتراكات</p>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition shadow-xs cursor-pointer"
          title={isDarkMode ? 'الوضع المضيء' : 'الوضع المظلم'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 z-10 animate-fade-in">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl/20">
          <div className="text-center mb-8">
            <GraduationCap className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">أهلاً بك في منصة "سجّل"</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              الخيار الأمثل للمعلمين والمربين لإدارة مجموعات الطلاب، ضبط الحضور تلقائياً، ومتابعة اشتراكاتهم المالية بيسر وسهولة.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">مجموعات وفئات متعددة</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">أنشئ فصولاً ومجموعات منفصلة لكل مادة أو مستوى دراسي.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">رصد حضور ذكي وتلقائي</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">سجل حالة الطلاب (حاضر، غائب، متأخر) بلمسة واحدة مع الحفظ التلقائي والتاريخي.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">تتبع المالي والاشتراكات الشهرية</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تابع المدفوعات وتعرّف فوراً على الطلاب المخالفين والملتزمين بالسداد.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">تواصل فوري وتقارير احترافية</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">اتصل بأولياء الأمور مباشرة أو أرسل رسائل واتساب سريعة مع إمكانية تصدير كشوفات PDF و Excel.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-r-4 border-red-500 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-4.5 px-6 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-bold text-base shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-3 active:scale-98 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>تسجيل الدخول باستخدام جوجل (Google)</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-800/50">
        &copy; {new Date().getFullYear()} منصة سَجّل للحضور والاشتراكات. جميع الحقوق محفوظة للمعلمين المربين.
      </footer>
    </div>
  );
}
