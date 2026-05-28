import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirmwareService } from '../../core/services/firmware.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { Firmware, Signoff, TestingSession, UserRole } from '../../models';
import { LucideAngularModule, ArrowLeft, Edit, Send, Check, X, Clock, ChevronRight } from 'lucide-angular';
import { DatePipe } from '@angular/common';

const EDITOR_ROLES: UserRole[] = ['ADMIN', 'RD_ENGINEER', 'RD_HEAD'];

@Component({
  selector: 'app-firmware-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, LayoutComponent, LucideAngularModule, DatePipe],
  template: `
    <app-layout>
      <div class="p-6 max-w-5xl mx-auto">
        <!-- Back button -->
        <a routerLink="/firmware" class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-1"></lucide-icon>
          Back to Firmware List
        </a>

        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (!firmware()) {
          <div class="card text-center py-12">
            <p class="text-gray-500">Firmware not found.</p>
          </div>
        } @else {
          <!-- Header -->
          <div class="flex flex-wrap items-start gap-4 mb-6">
            <div class="flex-1">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-2xl font-bold text-gray-900 font-mono">{{ firmware()!.version }}</h1>
                <app-status-badge [status]="firmware()!.status"></app-status-badge>
              </div>
              <p class="text-gray-500 text-sm mt-1">{{ firmware()!.deviceModel }} · {{ firmware()!.platform }}</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              @if (firmware()!.status === 'DRAFT' && canEdit()) {
                <button (click)="editMode.set(!editMode())" class="btn-secondary">
                  <lucide-icon [img]="EditIcon" [size]="16"></lucide-icon>
                  {{ editMode() ? 'Cancel Edit' : 'Edit' }}
                </button>
                <button (click)="onSubmit()" [disabled]="submitting()" class="btn-primary">
                  <lucide-icon [img]="SendIcon" [size]="16"></lucide-icon>
                  {{ submitting() ? 'Submitting...' : 'Submit for Testing' }}
                </button>
              }
            </div>
          </div>

          @if (successMessage()) {
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-green-700 text-sm">{{ successMessage() }}</p>
            </div>
          }

          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-700 text-sm">{{ errorMessage() }}</p>
            </div>
          }

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Edit form or info card -->
              @if (editMode() && canEdit()) {
                <div class="card">
                  <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Firmware</h2>
                  <form (ngSubmit)="onSave()" class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="form-label">Version</label>
                        <input type="text" [(ngModel)]="editData.version" name="version" class="form-input" />
                      </div>
                      <div>
                        <label class="form-label">Device Model</label>
                        <input type="text" [(ngModel)]="editData.deviceModel" name="deviceModel" class="form-input" />
                      </div>
                      <div>
                        <label class="form-label">Platform</label>
                        <input type="text" [(ngModel)]="editData.platform" name="platform" class="form-input" />
                      </div>
                    </div>
                    <div>
                      <label class="form-label">Description</label>
                      <textarea [(ngModel)]="editData.description" name="description" rows="3" class="form-textarea"></textarea>
                    </div>
                    <div>
                      <label class="form-label">Release Notes</label>
                      <textarea [(ngModel)]="editData.releaseNotes" name="releaseNotes" rows="4" class="form-textarea"></textarea>
                    </div>
                    <div class="flex gap-3">
                      <button type="submit" [disabled]="saving()" class="btn-primary">
                        <lucide-icon [img]="CheckIcon" [size]="16"></lucide-icon>
                        {{ saving() ? 'Saving...' : 'Save Changes' }}
                      </button>
                      <button type="button" (click)="editMode.set(false)" class="btn-secondary">Cancel</button>
                    </div>
                  </form>
                </div>
              } @else {
                <div class="card">
                  <h2 class="text-lg font-semibold text-gray-900 mb-4">Firmware Details</h2>
                  <dl class="space-y-3">
                    <div class="flex gap-3">
                      <dt class="w-32 text-sm text-gray-500 shrink-0">Version</dt>
                      <dd class="text-sm text-gray-900 font-mono font-medium">{{ firmware()!.version }}</dd>
                    </div>
                    <div class="flex gap-3">
                      <dt class="w-32 text-sm text-gray-500 shrink-0">Device Model</dt>
                      <dd class="text-sm text-gray-900">{{ firmware()!.deviceModel }}</dd>
                    </div>
                    <div class="flex gap-3">
                      <dt class="w-32 text-sm text-gray-500 shrink-0">Platform</dt>
                      <dd class="text-sm text-gray-900">{{ firmware()!.platform }}</dd>
                    </div>
                    <div class="flex gap-3">
                      <dt class="w-32 text-sm text-gray-500 shrink-0">Created By</dt>
                      <dd class="text-sm text-gray-900">{{ firmware()!.createdByName }}</dd>
                    </div>
                    <div class="flex gap-3">
                      <dt class="w-32 text-sm text-gray-500 shrink-0">Created At</dt>
                      <dd class="text-sm text-gray-900">{{ firmware()!.createdAt | date:'MMM d, y h:mm a' }}</dd>
                    </div>
                    <div class="flex gap-3">
                      <dt class="w-32 text-sm text-gray-500 shrink-0">Updated At</dt>
                      <dd class="text-sm text-gray-900">{{ firmware()!.updatedAt | date:'MMM d, y h:mm a' }}</dd>
                    </div>
                    @if (firmware()!.description) {
                      <div>
                        <dt class="text-sm text-gray-500 mb-1">Description</dt>
                        <dd class="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{{ firmware()!.description }}</dd>
                      </div>
                    }
                    @if (firmware()!.releaseNotes) {
                      <div>
                        <dt class="text-sm text-gray-500 mb-1">Release Notes</dt>
                        <dd class="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{{ firmware()!.releaseNotes }}</dd>
                      </div>
                    }
                  </dl>
                </div>
              }

              <!-- Testing Sessions -->
              @if (firmware()!.sessions && firmware()!.sessions!.length > 0) {
                <div class="card">
                  <h2 class="text-lg font-semibold text-gray-900 mb-4">Testing Sessions</h2>
                  <div class="space-y-3">
                    @for (session of firmware()!.sessions!; track session.id) {
                      <a
                        [routerLink]="['/testing', session.id]"
                        class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                            {{ session.stage }}
                          </div>
                          <div>
                            <p class="text-sm font-medium text-gray-900">Stage {{ session.stage }} – {{ stageName(session.stage) }}</p>
                            <p class="text-xs text-gray-500">{{ session.testerName }} · {{ session.startedAt | date:'MMM d, y' }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <app-status-badge [status]="session.status"></app-status-badge>
                          <lucide-icon [img]="ChevronRightIcon" [size]="16" class="text-gray-400"></lucide-icon>
                        </div>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Sign-off timeline -->
            <div class="space-y-4">
              <div class="card">
                <h2 class="text-base font-semibold text-gray-900 mb-4">Sign-off History</h2>
                @if (!firmware()!.signoffs || firmware()!.signoffs!.length === 0) {
                  <div class="text-center py-4 text-gray-400">
                    <lucide-icon [img]="ClockIcon" [size]="24" class="mx-auto mb-1 opacity-30"></lucide-icon>
                    <p class="text-xs">No sign-offs yet</p>
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (signoff of firmware()!.signoffs!; track signoff.id) {
                      <div class="relative pl-6">
                        <div class="absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center"
                          [class]="signoff.decision === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'">
                          @if (signoff.decision === 'APPROVED') {
                            <lucide-icon [img]="CheckIcon" [size]="10" class="text-green-600"></lucide-icon>
                          } @else {
                            <lucide-icon [img]="XIcon" [size]="10" class="text-red-600"></lucide-icon>
                          }
                        </div>
                        @if (!$last) {
                          <div class="absolute left-1.5 top-5 w-px h-full bg-gray-200"></div>
                        }
                        <div>
                          <p class="text-xs font-semibold text-gray-800">Stage {{ signoff.stage }} – {{ signoff.decision }}</p>
                          <p class="text-xs text-gray-500">{{ signoff.signedByName }} ({{ signoff.signedByRole }})</p>
                          <p class="text-xs text-gray-400">{{ signoff.signedAt | date:'MMM d, y' }}</p>
                          @if (signoff.comments) {
                            <p class="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-2">{{ signoff.comments }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </app-layout>
  `
})
export class FirmwareDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firmwareService = inject(FirmwareService);
  private authService = inject(AuthService);

  ArrowLeftIcon = ArrowLeft;
  EditIcon = Edit;
  SendIcon = Send;
  CheckIcon = Check;
  XIcon = X;
  ClockIcon = Clock;
  ChevronRightIcon = ChevronRight;

  firmware = signal<Firmware | null>(null);
  loading = signal(true);
  editMode = signal(false);
  saving = signal(false);
  submitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  editData = {
    version: '',
    deviceModel: '',
    platform: '',
    description: '',
    releaseNotes: ''
  };

  canEdit = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role ? EDITOR_ROLES.includes(role) : false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.firmwareService.getById(id).subscribe({
      next: fw => {
        this.firmware.set(fw);
        this.editData = {
          version: fw.version,
          deviceModel: fw.deviceModel,
          platform: fw.platform,
          description: fw.description ?? '',
          releaseNotes: fw.releaseNotes ?? ''
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  stageName(stage: number): string {
    switch (stage) {
      case 1: return 'Sanity Test';
      case 2: return 'Field Test';
      case 3: return 'Final Sign-off';
      default: return 'Test';
    }
  }

  onSave(): void {
    const id = this.firmware()!.id;
    this.saving.set(true);
    this.errorMessage.set('');
    this.firmwareService.update(id, this.editData).subscribe({
      next: fw => {
        this.firmware.set(fw);
        this.editMode.set(false);
        this.saving.set(false);
        this.successMessage.set('Firmware updated successfully.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update firmware.');
      }
    });
  }

  onSubmit(): void {
    const id = this.firmware()!.id;
    this.submitting.set(true);
    this.errorMessage.set('');
    this.firmwareService.submit(id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set('Firmware submitted for testing.');
        // Reload
        this.firmwareService.getById(id).subscribe(fw => this.firmware.set(fw));
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit firmware.');
      }
    });
  }
}
