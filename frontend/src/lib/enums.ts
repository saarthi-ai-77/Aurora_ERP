export enum Role {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  LATE = 'LATE',
}

export enum AssignmentCategory {
  UPLOAD_BASED = 'UPLOAD_BASED',
  MARKS_ONLY = 'MARKS_ONLY',
}

export enum SubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  MISSED = 'MISSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GRADED = 'GRADED',
}

export enum NoticeCategory {
  ACADEMIC = 'ACADEMIC',
  EVENTS = 'EVENTS',
  WORKSHOPS = 'WORKSHOPS',
  HACKATHONS = 'HACKATHONS',
  EXAMS = 'EXAMS',
  GENERAL = 'GENERAL',
}

export enum NoticePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum NoticeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}
