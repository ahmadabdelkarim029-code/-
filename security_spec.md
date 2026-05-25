# Security Specification for student-attendance-app

## Phase 0: Data Invariants
1. **Teacher Ownership**: Groups, Students, and Attendance records must always belongs to a specific authenticated teacher (`teacherId == request.auth.uid`). No teacher may read, list, create, update, or delete resources belonging to another teacher.
2. **Entity Consistency**:
   - For `groups`: The `id`, `name`, and `teacherId` fields are required.
   - For `students`: The `groupId` must link to a valid group, and `parentPhone` must be present.
   - For `attendance`: The `records` object maps student IDs to a valid status: `'present'` (حاضر), `'absent'` (غائب), or `'late'` (متأخر).
3. **Immutability**:
   - The `createdAt` and `teacherId` fields must be immutable. They are set upon creation and cannot be changed on update.

---

## The "Dirty Dozen" Malicious Payloads

### 1. [Identity Spoofing] Creating a group under another teacher's ID
An attacker attempts to create a study group but sets `teacherId` to another user's UID to spoof ownership.
```json
{
  "id": "group_123",
  "name": "محاولة الاختراق",
  "teacherId": "victim_teacher_id",
  "createdAt": "2026-05-25T08:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### 2. [Identity Hijacking] Modifying the `teacherId` of an existing group
An attacker tries to change the `teacherId` of a group to transfer ownership to themselves.
```json
{
  "id": "group_existing",
  "name": "مجموعة الرياضيات",
  "teacherId": "attacker_teacher_id",
  "createdAt": "2026-05-25T08:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### 3. [Privilege Escalation] Reading groups belonging to other teachers
An authenticated teacher tries to retrieve another teacher's group list.
*Expected Result: PERMISSION_DENIED*

### 4. [Value Poisoning] Creating a student with a negative or massive string phone number
An attacker attempts to inject a huge string or a malicious buffer as a phone number.
```json
{
  "id": "student_123",
  "name": "طالب وهبي",
  "groupId": "group_123",
  "parentPhone": "A".repeat(1000), 
  "teacherId": "attacker_id",
  "payments": {},
  "createdAt": "2026-05-25T08:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### 5. [State Shortcutting] Setting nested payment values with invalid keys
An attacker attempts to set a payment state for a non-existent or corrupted month key.
```json
{
  "id": "student_123",
  "name": "طالب",
  "groupId": "group_123",
  "parentPhone": "0123456789",
  "teacherId": "attacker_id",
  "payments": {
    "invalid-month-key": "free-access"
  },
  "createdAt": "2026-05-25T08:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### 6. [Resource Poisoning] Setting an attendance record with a huge status string
An attacker sets a status like `"present"` but pads it with 10KB of junk data.
```json
{
  "id": "group_123_2026-05-25",
  "groupId": "group_123",
  "date": "2026-05-25",
  "teacherId": "attacker_id",
  "records": {
    "student_123": "present_plus_junk_data_..."
  },
  "createdAt": "2026-05-25T08:00:00Z",
  "updatedAt": "2026-05-25T08:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### 7. [Ghost Write] Creating a student with unknown/unapproved ghost fields
An attacker attempts to create a student with a custom `isVip` or `isAdmin` flag to bypass backend verification.
```json
{
  "id": "student_123",
  "name": "طالب",
  "groupId": "group_123",
  "parentPhone": "0123456789",
  "teacherId": "attacker_id",
  "payments": {},
  "isVip": true,
  "createdAt": "2026-05-25T08:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED*

### 8. [Temporal Manipulation] Setting client-controlled historic timestamp
An attacker modifies `createdAt` to a timestamp in the past or the future to simulate incorrect history.
```json
{
  "id": "group_123",
  "name": "مجموعة هكر",
  "teacherId": "attacker_id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```
*Expected Result: PERMISSION_DENIED (Must equal request.time)*

### 9. [ID Poisoning] Passing a 10KB junk-character string as the group document ID
An attacker tries to perform operations on a document with an ID consisting of highly recursive characters or massive paths.
```json
// target path: /groups/junkjunkjunk...(10KB)
```
*Expected Result: PERMISSION_DENIED*

### 10. [PII Leak] Querying for student phone numbers or notes globally
An unauthenticated or unauthorized client attempts to list all phone numbers globally.
*Expected Result: PERMISSION_DENIED*

### 11. [Immutability Violation] Modifying the creation date of a student
An attacker tries to update the student but changes the `createdAt` timestamp.
*Expected Result: PERMISSION_DENIED*

### 12. [Relational Orphan] Creating attendance records under non-existent group IDs
An attacker creates attendance list and associates it to a non-existent groupId or a group they don't own.
*Expected Result: PERMISSION_DENIED*
