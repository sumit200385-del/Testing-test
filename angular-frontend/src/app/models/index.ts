export type UserRole = 'ADMIN' | 'RD_ENGINEER' | 'RD_HEAD' | 'OPERATIONS' | 'SALES';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type FirmwareStatus =
  | 'DRAFT'
  | 'STAGE1_PENDING'
  | 'STAGE1_PASSED'
  | 'STAGE1_FAILED'
  | 'STAGE2_PENDING'
  | 'STAGE2_PASSED'
  | 'STAGE2_FAILED'
  | 'STAGE3_PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface Firmware {
  id: string;
  version: string;
  deviceModel: string;
  platform: string;
  description: string | null;
  releaseNotes: string | null;
  status: FirmwareStatus;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  sessions?: TestingSession[];
  signoffs?: Signoff[];
}

export type TestResult = 'PASS' | 'FAIL' | 'SKIP' | 'PENDING';

export interface TestCase {
  id: string;
  sessionId: string;
  category: string;
  testName: string;
  description: string | null;
  result: TestResult;
  actualValue: string | null;
  expectedValue: string | null;
  remarks: string | null;
  testedAt: string | null;
}

export interface TestingSession {
  id: string;
  firmwareId: string;
  stage: 1 | 2 | 3;
  testerName: string;
  firmwareVersion?: string;
  deviceModel?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED_OFF' | 'REJECTED';
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  testCases?: TestCase[];
}

export interface Signoff {
  id: string;
  firmwareId: string;
  stage: number;
  sessionId: string;
  signedByName: string;
  signedByRole: UserRole;
  decision: 'APPROVED' | 'REJECTED';
  comments: string | null;
  signedAt: string;
}

export interface ChangeLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changedByName: string;
  changedAt: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  details: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}
