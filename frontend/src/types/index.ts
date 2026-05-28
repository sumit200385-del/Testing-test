export type UserRole = 'admin' | 'rd_engineer' | 'rd_head' | 'operations' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type FirmwareStatus =
  | 'draft'
  | 'stage1_pending' | 'stage1_passed' | 'stage1_failed'
  | 'stage2_pending' | 'stage2_passed' | 'stage2_failed'
  | 'stage3_pending' | 'approved' | 'rejected';

export interface Firmware {
  id: string;
  version: string;
  device_model: string;
  platform: string;
  description: string | null;
  release_notes: string | null;
  status: FirmwareStatus;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  sessions?: TestingSession[];
  signoffs?: Signoff[];
}

export type TestResult = 'pass' | 'fail' | 'skip' | 'pending';

export interface TestCase {
  id: string;
  session_id: string;
  category: string;
  test_name: string;
  description: string | null;
  result: TestResult;
  actual_value: string | null;
  expected_value: string | null;
  remarks: string | null;
  tested_at: string | null;
}

export interface TestingSession {
  id: string;
  firmware_id: string;
  stage: 1 | 2 | 3;
  tester_id: string;
  tester_name: string;
  firmware_version?: string;
  device_model?: string;
  status: 'in_progress' | 'completed' | 'signed_off' | 'rejected';
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  test_cases?: TestCase[];
}

export interface Signoff {
  id: string;
  firmware_id: string;
  stage: 1 | 2 | 3;
  session_id: string;
  signed_by: string;
  signed_by_name: string;
  signed_by_role: UserRole;
  decision: 'approved' | 'rejected';
  comments: string | null;
  signed_at: string;
}

export interface ChangeLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  details: string | null;
}
