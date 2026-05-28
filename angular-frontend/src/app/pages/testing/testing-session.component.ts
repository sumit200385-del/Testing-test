import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestingService } from '../../core/services/testing.service';
import { SignoffService } from '../../core/services/signoff.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TestingSession, TestCase, TestResult, UserRole } from '../../models';
import { LucideAngularModule, ArrowLeft, Check, X, Minus, ChevronDown, ChevronUp, CheckCircle, XCircle, SkipForward, Clock, Send, RefreshCw } from 'lucide-angular';
import { DatePipe } from '@angular/common';

interface TestCaseGroup {
  category: string;
  cases: TestCase[];
  expanded: boolean;
}

const SIGNOFF_ROLES: UserRole[] = ['ADMIN', 'RD_HEAD', 'OPERATIONS'];

@Component({
  selector: 'app-testing-session',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, LayoutComponent, LucideAngularModule, DatePipe],
  template: `
    <app-layout>
      <div class="p-6 max-w-5xl mx-auto">
        <!-- Back -->
        <a routerLink="/firmware" class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-1"></lucide-icon>
          Back to Firmware
        </a>

        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (!session()) {
          <div class="card text-center py-12">
            <p class="text-gray-500">Session not found.</p>
          </div>
        } @else {
          <!-- Header -->
          <div class="mb-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  Stage {{ session()!.stage }} Testing Session
                </h1>
                <p class="text-gray-500 text-sm mt-1">
                  Tester: {{ session()!.testerName }} ·
                  Started: {{ session()!.startedAt | date:'MMM d, y h:mm a' }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <app-status-badge [status]="session()!.status"></app-status-badge>
                @if (session()!.status === 'IN_PROGRESS' && allFilled()) {
                  <button (click)="onComplete()" [disabled]="completing()" class="btn-success">
                    <lucide-icon [img]="CheckCircleIcon" [size]="16"></lucide-icon>
                    {{ completing() ? 'Completing...' : 'Mark Complete' }}
                  </button>
                }
                @if (session()!.status === 'COMPLETED' && canSignOff()) {
                  <button (click)="showSignoffForm.set(!showSignoffForm())" class="btn-primary">
                    <lucide-icon [img]="SendIcon" [size]="16"></lucide-icon>
                    Sign Off
                  </button>
                }
              </div>
            </div>
          </div>

          @if (actionMessage()) {
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-green-700 text-sm">{{ actionMessage() }}</p>
            </div>
          }
          @if (actionError()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-700 text-sm">{{ actionError() }}</p>
            </div>
          }

          <!-- Sign-off form -->
          @if (showSignoffForm()) {
            <div class="card mb-6 border-blue-200">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Sign Off Session</h2>
              <div class="space-y-4">
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" [(ngModel)]="signoffDecision" value="APPROVED" name="decision" class="text-green-600" />
                    <span class="text-sm font-medium text-green-700">Approve</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" [(ngModel)]="signoffDecision" value="REJECTED" name="decision" class="text-red-600" />
                    <span class="text-sm font-medium text-red-700">Reject</span>
                  </label>
                </div>
                <div>
                  <label class="form-label">Comments</label>
                  <textarea
                    [(ngModel)]="signoffComments"
                    rows="3"
                    placeholder="Add your sign-off comments..."
                    class="form-textarea"
                  ></textarea>
                </div>
                <div class="flex gap-3">
                  <button
                    (click)="onSignOff()"
                    [disabled]="signingOff()"
                    [class]="signoffDecision === 'APPROVED' ? 'btn-success' : 'btn-danger'"
                  >
                    {{ signingOff() ? 'Submitting...' : 'Submit Sign-off' }}
                  </button>
                  <button (click)="showSignoffForm.set(false)" class="btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Stats bar -->
          @if (session()!.testCases && session()!.testCases!.length > 0) {
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div class="card text-center py-3">
                <p class="text-xl font-bold text-gray-900">{{ stats().total }}</p>
                <p class="text-xs text-gray-500">Total</p>
              </div>
              <div class="card text-center py-3">
                <p class="text-xl font-bold text-green-600">{{ stats().pass }}</p>
                <p class="text-xs text-gray-500">Pass</p>
              </div>
              <div class="card text-center py-3">
                <p class="text-xl font-bold text-red-600">{{ stats().fail }}</p>
                <p class="text-xs text-gray-500">Fail</p>
              </div>
              <div class="card text-center py-3">
                <p class="text-xl font-bold text-gray-500">{{ stats().skip }}</p>
                <p class="text-xs text-gray-500">Skip</p>
              </div>
              <div class="card text-center py-3">
                <p class="text-xl font-bold text-yellow-600">{{ stats().pending }}</p>
                <p class="text-xs text-gray-500">Pending</p>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="card mb-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">Test Completion</p>
                <p class="text-sm text-gray-500">{{ stats().total - stats().pending }}/{{ stats().total }}</p>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  [style.width.%]="progressPercent()"
                ></div>
              </div>
            </div>

            <!-- Test case groups -->
            <div class="space-y-4">
              @for (group of testGroups(); track group.category) {
                <div class="card">
                  <!-- Group header -->
                  <button
                    (click)="toggleGroup(group)"
                    class="w-full flex items-center justify-between"
                  >
                    <div class="flex items-center gap-3">
                      <h3 class="text-base font-semibold text-gray-900">{{ group.category }}</h3>
                      <div class="flex items-center gap-1">
                        <span class="badge bg-green-100 text-green-700">{{ groupStats(group).pass }}P</span>
                        <span class="badge bg-red-100 text-red-700">{{ groupStats(group).fail }}F</span>
                        <span class="badge bg-gray-100 text-gray-600">{{ groupStats(group).skip }}S</span>
                        <span class="badge bg-yellow-100 text-yellow-700">{{ groupStats(group).pending }} pending</span>
                      </div>
                    </div>
                    @if (group.expanded) {
                      <lucide-icon [img]="ChevronUpIcon" [size]="20" class="text-gray-400"></lucide-icon>
                    } @else {
                      <lucide-icon [img]="ChevronDownIcon" [size]="20" class="text-gray-400"></lucide-icon>
                    }
                  </button>

                  <!-- Group content -->
                  @if (group.expanded) {
                    <div class="mt-4 space-y-2 border-t border-gray-100 pt-4">
                      @for (tc of group.cases; track tc.id) {
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                          <!-- Test case row -->
                          <div class="flex items-center gap-3 p-3">
                            <!-- Result indicator -->
                            <div class="w-2 h-full min-h-[24px] rounded-full flex-shrink-0"
                              [class]="resultColor(tc.result)">
                            </div>

                            <!-- Test info -->
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 truncate">{{ tc.testName }}</p>
                              @if (tc.description) {
                                <p class="text-xs text-gray-500 truncate">{{ tc.description }}</p>
                              }
                              @if (tc.expectedValue) {
                                <p class="text-xs text-gray-400">Expected: <span class="font-mono">{{ tc.expectedValue }}</span></p>
                              }
                            </div>

                            <!-- Result badge -->
                            <app-status-badge [status]="tc.result"></app-status-badge>

                            <!-- Quick action buttons -->
                            @if (session()!.status === 'IN_PROGRESS') {
                              <div class="flex items-center gap-1">
                                <button
                                  (click)="quickUpdate(tc, 'PASS')"
                                  class="w-7 h-7 rounded-full flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                                  title="Pass"
                                >
                                  <lucide-icon [img]="CheckIcon" [size]="14"></lucide-icon>
                                </button>
                                <button
                                  (click)="quickUpdate(tc, 'FAIL')"
                                  class="w-7 h-7 rounded-full flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                                  title="Fail"
                                >
                                  <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
                                </button>
                                <button
                                  (click)="quickUpdate(tc, 'SKIP')"
                                  class="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                  title="Skip"
                                >
                                  <lucide-icon [img]="MinusIcon" [size]="14"></lucide-icon>
                                </button>
                                <button
                                  (click)="toggleDetail(tc)"
                                  class="px-2 h-7 rounded text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors ml-1"
                                >
                                  Detail
                                </button>
                              </div>
                            }
                          </div>

                          <!-- Detail form -->
                          @if (expandedCaseId() === tc.id) {
                            <div class="border-t border-gray-100 p-3 bg-gray-50">
                              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label class="form-label text-xs">Result</label>
                                  <select [(ngModel)]="detailForm.result" [ngModelOptions]="{standalone: true}" class="form-select text-xs py-1">
                                    <option value="PENDING">PENDING</option>
                                    <option value="PASS">PASS</option>
                                    <option value="FAIL">FAIL</option>
                                    <option value="SKIP">SKIP</option>
                                  </select>
                                </div>
                                <div>
                                  <label class="form-label text-xs">Actual Value</label>
                                  <input
                                    type="text"
                                    [(ngModel)]="detailForm.actualValue"
                                    [ngModelOptions]="{standalone: true}"
                                    placeholder="Observed value..."
                                    class="form-input text-xs py-1"
                                  />
                                </div>
                              </div>
                              <div class="mb-3">
                                <label class="form-label text-xs">Remarks</label>
                                <textarea
                                  [(ngModel)]="detailForm.remarks"
                                  [ngModelOptions]="{standalone: true}"
                                  rows="2"
                                  placeholder="Additional remarks..."
                                  class="form-textarea text-xs py-1"
                                ></textarea>
                              </div>
                              <div class="flex gap-2">
                                <button
                                  (click)="saveDetail(tc)"
                                  [disabled]="savingCaseId() === tc.id"
                                  class="btn-primary py-1 px-3 text-xs"
                                >
                                  {{ savingCaseId() === tc.id ? 'Saving...' : 'Save' }}
                                </button>
                                <button
                                  (click)="expandedCaseId.set(null)"
                                  class="btn-secondary py-1 px-3 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="card text-center py-12 text-gray-400">
              <p class="text-sm">No test cases in this session.</p>
            </div>
          }
        }
      </div>
    </app-layout>
  `
})
export class TestingSessionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private testingService = inject(TestingService);
  private signoffService = inject(SignoffService);
  private authService = inject(AuthService);

  ArrowLeftIcon = ArrowLeft;
  CheckIcon = Check;
  XIcon = X;
  MinusIcon = Minus;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  SkipIcon = SkipForward;
  ClockIcon = Clock;
  SendIcon = Send;
  RefreshIcon = RefreshCw;

  session = signal<TestingSession | null>(null);
  loading = signal(true);
  completing = signal(false);
  showSignoffForm = signal(false);
  signingOff = signal(false);
  actionMessage = signal('');
  actionError = signal('');
  expandedCaseId = signal<string | null>(null);
  savingCaseId = signal<string | null>(null);

  signoffDecision: 'APPROVED' | 'REJECTED' = 'APPROVED';
  signoffComments = '';

  detailForm = {
    result: 'PENDING' as TestResult,
    actualValue: '',
    remarks: ''
  };

  testGroups = signal<TestCaseGroup[]>([]);

  stats = computed(() => {
    const cases = this.session()?.testCases ?? [];
    return {
      total: cases.length,
      pass: cases.filter(c => c.result === 'PASS').length,
      fail: cases.filter(c => c.result === 'FAIL').length,
      skip: cases.filter(c => c.result === 'SKIP').length,
      pending: cases.filter(c => c.result === 'PENDING').length,
    };
  });

  allFilled = computed(() => this.stats().pending === 0 && this.stats().total > 0);

  progressPercent = computed(() => {
    const s = this.stats();
    if (s.total === 0) return 0;
    return Math.round(((s.total - s.pending) / s.total) * 100);
  });

  canSignOff = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role ? SIGNOFF_ROLES.includes(role) : false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadSession(id);
  }

  loadSession(id: string): void {
    this.loading.set(true);
    this.testingService.getSession(id).subscribe({
      next: session => {
        this.session.set(session);
        this.buildGroups(session);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  buildGroups(session: TestingSession): void {
    const cases = session.testCases ?? [];
    const groupMap = new Map<string, TestCase[]>();
    for (const tc of cases) {
      const group = groupMap.get(tc.category) ?? [];
      group.push(tc);
      groupMap.set(tc.category, group);
    }
    const groups: TestCaseGroup[] = [];
    groupMap.forEach((tcases, category) => {
      groups.push({ category, cases: tcases, expanded: true });
    });
    this.testGroups.set(groups);
  }

  groupStats(group: TestCaseGroup) {
    return {
      pass: group.cases.filter(c => c.result === 'PASS').length,
      fail: group.cases.filter(c => c.result === 'FAIL').length,
      skip: group.cases.filter(c => c.result === 'SKIP').length,
      pending: group.cases.filter(c => c.result === 'PENDING').length,
    };
  }

  toggleGroup(group: TestCaseGroup): void {
    group.expanded = !group.expanded;
    this.testGroups.update(g => [...g]);
  }

  resultColor(result: TestResult): string {
    switch (result) {
      case 'PASS': return 'bg-green-500';
      case 'FAIL': return 'bg-red-500';
      case 'SKIP': return 'bg-gray-400';
      case 'PENDING': return 'bg-yellow-400';
      default: return 'bg-gray-300';
    }
  }

  quickUpdate(tc: TestCase, result: TestResult): void {
    const sessionId = this.session()!.id;
    this.testingService.updateTestCase(sessionId, tc.id, { result }).subscribe({
      next: updated => {
        this.updateCaseInState(updated);
      }
    });
  }

  toggleDetail(tc: TestCase): void {
    if (this.expandedCaseId() === tc.id) {
      this.expandedCaseId.set(null);
    } else {
      this.detailForm = {
        result: tc.result,
        actualValue: tc.actualValue ?? '',
        remarks: tc.remarks ?? ''
      };
      this.expandedCaseId.set(tc.id);
    }
  }

  saveDetail(tc: TestCase): void {
    const sessionId = this.session()!.id;
    this.savingCaseId.set(tc.id);
    this.testingService.updateTestCase(sessionId, tc.id, {
      result: this.detailForm.result,
      actualValue: this.detailForm.actualValue || null,
      remarks: this.detailForm.remarks || null
    }).subscribe({
      next: updated => {
        this.savingCaseId.set(null);
        this.expandedCaseId.set(null);
        this.updateCaseInState(updated);
      },
      error: () => {
        this.savingCaseId.set(null);
        this.actionError.set('Failed to save test case.');
        setTimeout(() => this.actionError.set(''), 3000);
      }
    });
  }

  updateCaseInState(updated: TestCase): void {
    const session = this.session();
    if (!session) return;
    const cases = session.testCases ?? [];
    const newCases = cases.map(c => c.id === updated.id ? updated : c);
    const newSession = { ...session, testCases: newCases };
    this.session.set(newSession);
    this.buildGroups(newSession);
  }

  onComplete(): void {
    this.completing.set(true);
    this.actionError.set('');
    this.testingService.completeSession(this.session()!.id).subscribe({
      next: () => {
        this.completing.set(false);
        this.actionMessage.set('Session marked as complete.');
        const session = this.session()!;
        this.session.set({ ...session, status: 'COMPLETED' });
        setTimeout(() => this.actionMessage.set(''), 3000);
      },
      error: err => {
        this.completing.set(false);
        this.actionError.set(err.error?.message || 'Failed to complete session.');
      }
    });
  }

  onSignOff(): void {
    this.signingOff.set(true);
    this.actionError.set('');
    const session = this.session()!;
    this.signoffService.sign({
      firmwareId: session.firmwareId,
      sessionId: session.id,
      stage: session.stage,
      decision: this.signoffDecision,
      comments: this.signoffComments || undefined
    }).subscribe({
      next: () => {
        this.signingOff.set(false);
        this.showSignoffForm.set(false);
        this.actionMessage.set(`Session ${this.signoffDecision.toLowerCase()}d successfully.`);
        this.session.set({ ...session, status: 'SIGNED_OFF' });
        setTimeout(() => this.actionMessage.set(''), 3000);
      },
      error: err => {
        this.signingOff.set(false);
        this.actionError.set(err.error?.message || 'Failed to submit sign-off.');
      }
    });
  }
}
