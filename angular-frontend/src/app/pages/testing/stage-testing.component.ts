import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirmwareService } from '../../core/services/firmware.service';
import { TestingService } from '../../core/services/testing.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { Firmware, TestingSession, UserRole, FirmwareStatus } from '../../models';
import { LucideAngularModule, FlaskConical, Car, Award, Play, ChevronRight, RefreshCw } from 'lucide-angular';
import { DatePipe } from '@angular/common';

const TESTER_ROLES: UserRole[] = ['ADMIN', 'RD_ENGINEER', 'RD_HEAD', 'OPERATIONS'];

const STAGE_STATUS_MAP: Record<number, FirmwareStatus> = {
  1: 'STAGE1_PENDING',
  2: 'STAGE2_PENDING',
  3: 'STAGE3_PENDING',
};

@Component({
  selector: 'app-stage-testing',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, LayoutComponent, LucideAngularModule, DatePipe],
  template: `
    <app-layout>
      <div class="p-6 max-w-6xl mx-auto">
        <!-- Page header -->
        <div class="mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [class]="stageColor()">
              <lucide-icon [img]="stageIcon()" [size]="20" class="text-white"></lucide-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Stage {{ stage() }} – {{ stageName() }}</h1>
              <p class="text-gray-500 text-sm mt-0.5">{{ stageDescription() }}</p>
            </div>
          </div>
        </div>

        <!-- Start session form -->
        @if (showStartForm()) {
          <div class="card mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Start Testing Session</h2>
            @if (startError()) {
              <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-700 text-sm">{{ startError() }}</p>
              </div>
            }
            <div class="space-y-4">
              <div>
                <label class="form-label">Select Firmware *</label>
                <select [(ngModel)]="selectedFirmwareId" class="form-select">
                  <option value="">-- Choose firmware --</option>
                  @for (fw of eligibleFirmware(); track fw.id) {
                    <option [value]="fw.id">{{ fw.version }} – {{ fw.deviceModel }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="form-label">Session Notes</label>
                <textarea
                  [(ngModel)]="sessionNotes"
                  rows="2"
                  placeholder="Optional notes for this testing session..."
                  class="form-textarea"
                ></textarea>
              </div>
              <div class="flex gap-3">
                <button (click)="onStartSession()" [disabled]="starting()" class="btn-success">
                  <lucide-icon [img]="PlayIcon" [size]="16"></lucide-icon>
                  {{ starting() ? 'Starting...' : 'Start Session' }}
                </button>
                <button (click)="showStartForm.set(false)" class="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Firmware awaiting this stage -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-900">Firmware Awaiting Stage {{ stage() }}</h2>
              <button (click)="loadData()" class="text-gray-400 hover:text-gray-600">
                <lucide-icon [img]="RefreshIcon" [size]="16"></lucide-icon>
              </button>
            </div>

            @if (loadingFirmware()) {
              <div class="flex justify-center py-8">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (eligibleFirmware().length === 0) {
              <div class="text-center py-8 text-gray-400">
                <p class="text-sm">No firmware awaiting Stage {{ stage() }} testing</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (fw of eligibleFirmware(); track fw.id) {
                  <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 font-mono">{{ fw.version }}</p>
                      <p class="text-xs text-gray-500">{{ fw.deviceModel }} · {{ fw.platform }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <app-status-badge [status]="fw.status"></app-status-badge>
                      @if (canTest()) {
                        <button
                          (click)="startTestingFor(fw.id)"
                          class="text-xs btn-primary py-1 px-2"
                        >
                          Test
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Active sessions for this stage -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-900">Active Sessions – Stage {{ stage() }}</h2>
            </div>

            @if (loadingSessions()) {
              <div class="flex justify-center py-8">
                <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (activeSessions().length === 0) {
              <div class="text-center py-8 text-gray-400">
                <p class="text-sm">No active testing sessions for Stage {{ stage() }}</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (session of activeSessions(); track session.id) {
                  <a
                    [routerLink]="['/testing', session.id]"
                    class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <p class="text-sm font-semibold text-gray-900">
                        {{ session.firmwareVersion || 'Session' }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ session.testerName }} · {{ session.startedAt | date:'MMM d, y h:mm a' }}
                      </p>
                      @if (session.notes) {
                        <p class="text-xs text-gray-400 mt-0.5 truncate max-w-48">{{ session.notes }}</p>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      <app-status-badge [status]="session.status"></app-status-badge>
                      <lucide-icon [img]="ChevronRightIcon" [size]="16" class="text-gray-400"></lucide-icon>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </app-layout>
  `
})
export class StageTestingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firmwareService = inject(FirmwareService);
  private testingService = inject(TestingService);
  private authService = inject(AuthService);

  FlaskIcon = FlaskConical;
  CarIcon = Car;
  AwardIcon = Award;
  PlayIcon = Play;
  ChevronRightIcon = ChevronRight;
  RefreshIcon = RefreshCw;

  stage = signal(1);
  allFirmware = signal<Firmware[]>([]);
  sessions = signal<TestingSession[]>([]);
  loadingFirmware = signal(true);
  loadingSessions = signal(true);
  showStartForm = signal(false);
  starting = signal(false);
  startError = signal('');
  selectedFirmwareId = '';
  sessionNotes = '';

  eligibleFirmware = computed(() => {
    const s = this.stage();
    const expectedStatus = STAGE_STATUS_MAP[s];
    return this.allFirmware().filter(fw => fw.status === expectedStatus);
  });

  activeSessions = computed(() => this.sessions());

  canTest = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role ? TESTER_ROLES.includes(role) : false;
  });

  stageIcon() {
    switch (this.stage()) {
      case 1: return FlaskConical;
      case 2: return Car;
      case 3: return Award;
      default: return FlaskConical;
    }
  }

  stageColor(): string {
    switch (this.stage()) {
      case 1: return 'bg-blue-600';
      case 2: return 'bg-purple-600';
      case 3: return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  }

  stageName(): string {
    switch (this.stage()) {
      case 1: return 'Sanity Test';
      case 2: return 'Field Test';
      case 3: return 'Final Sign-off';
      default: return 'Test';
    }
  }

  stageDescription(): string {
    switch (this.stage()) {
      case 1: return 'Initial sanity checks and basic validation of firmware functionality';
      case 2: return 'Real-world field testing under operational conditions';
      case 3: return 'Final management review and approval sign-off';
      default: return '';
    }
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.stage.set(data['stage'] || 1);
      this.loadData();
    });
  }

  loadData(): void {
    this.loadingFirmware.set(true);
    this.loadingSessions.set(true);

    this.firmwareService.getAll().subscribe({
      next: fw => {
        this.allFirmware.set(fw);
        this.loadingFirmware.set(false);
      },
      error: () => this.loadingFirmware.set(false)
    });

    this.testingService.getSessionsByStage(this.stage()).subscribe({
      next: sessions => {
        this.sessions.set(sessions);
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false)
    });
  }

  startTestingFor(firmwareId: string): void {
    this.selectedFirmwareId = firmwareId;
    this.showStartForm.set(true);
  }

  onStartSession(): void {
    if (!this.selectedFirmwareId) {
      this.startError.set('Please select a firmware version.');
      return;
    }
    this.starting.set(true);
    this.startError.set('');
    this.testingService.startSession(this.selectedFirmwareId, this.stage(), this.sessionNotes || undefined).subscribe({
      next: session => {
        this.sessions.update(list => [session, ...list]);
        this.starting.set(false);
        this.showStartForm.set(false);
        this.selectedFirmwareId = '';
        this.sessionNotes = '';
      },
      error: err => {
        this.starting.set(false);
        this.startError.set(err.error?.message || 'Failed to start session.');
      }
    });
  }
}
