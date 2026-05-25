/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  createdAt: any; // Firestore Timestamp
}

export interface Student {
  id: string;
  name: string;
  groupId: string;
  parentPhone: string;
  notes: string;
  teacherId: string;
  payments: {
    [monthKey: string]: 'paid' | 'unpaid'; // e.g., "2026-05": "paid"
  };
  createdAt: any; // Firestore Timestamp
}

export interface AttendanceRecord {
  [studentId: string]: 'present' | 'absent' | 'late';
}

export interface Attendance {
  id: string; // {groupId}_{date}
  groupId: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  records: AttendanceRecord;
  createdAt: any;
  updatedAt: any;
}

export type ViewType = 'dashboard' | 'groups' | 'students' | 'attendance' | 'reports';
