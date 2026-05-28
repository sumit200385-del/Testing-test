import clsx from 'clsx';
import { FirmwareStatus, TestResult } from '../types';

const FW_STATUS_CONFIG: Record<FirmwareStatus, { label: string; cls: string }> = {
  draft:           { label: 'Draft',                cls: 'bg-gray-100 text-gray-700' },
  stage1_pending:  { label: 'Stage 1 Pending',      cls: 'bg-yellow-100 text-yellow-700' },
  stage1_passed:   { label: 'Stage 1 Passed',       cls: 'bg-blue-100 text-blue-700' },
  stage1_failed:   { label: 'Stage 1 Failed',       cls: 'bg-red-100 text-red-700' },
  stage2_pending:  { label: 'Stage 2 Pending',      cls: 'bg-yellow-100 text-yellow-700' },
  stage2_passed:   { label: 'Stage 2 Passed',       cls: 'bg-blue-100 text-blue-700' },
  stage2_failed:   { label: 'Stage 2 Failed',       cls: 'bg-red-100 text-red-700' },
  stage3_pending:  { label: 'Stage 3 Pending',      cls: 'bg-purple-100 text-purple-700' },
  approved:        { label: 'Approved',             cls: 'bg-green-100 text-green-700' },
  rejected:        { label: 'Rejected',             cls: 'bg-red-100 text-red-700' },
};

const RESULT_CONFIG: Record<TestResult, { label: string; cls: string }> = {
  pass:    { label: 'PASS',    cls: 'bg-green-100 text-green-700' },
  fail:    { label: 'FAIL',    cls: 'bg-red-100 text-red-700' },
  skip:    { label: 'SKIP',    cls: 'bg-yellow-100 text-yellow-700' },
  pending: { label: 'PENDING', cls: 'bg-gray-100 text-gray-600' },
};

export function FirmwareStatusBadge({ status }: { status: FirmwareStatus }) {
  const cfg = FW_STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={clsx('badge', cfg.cls)}>{cfg.label}</span>
  );
}

export function TestResultBadge({ result }: { result: TestResult }) {
  const cfg = RESULT_CONFIG[result];
  return (
    <span className={clsx('badge', cfg.cls)}>{cfg.label}</span>
  );
}
