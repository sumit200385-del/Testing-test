import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirmwareService } from '../../core/services/firmware.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { Firmware, UserRole } from '../../models';
import { LucideAngularModule, Plus, Search, ChevronRight, X, Cpu } from 'lucide-angular';
import { DatePipe } from '@angular/common';

const CREATOR_ROLES: UserRole[] = ['ADMIN', 'RD_ENGINEER', 'RD_HEAD'];

@Component({
  selector: 'app-firmware-list',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, LayoutComponent, LucideAngularModule, DatePipe],
  template: `
    <app-layout>
      <div class="p-6 max-w-7xl mx-auto">
        <!-- Page header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Firmware Versions</h1>
            <p class="text-gray-500 text-sm mt-1">Manage and track all firmware versions</p>
          </div>
          @if (canCreate()) {
            <button
              (click)="showCreateForm.set(!showCreateForm())"
              class="btn-primary"
            >
              <lucide-icon [img]="PlusIcon" [size]="16"></lucide-icon>
              New Firmware
            </button>
          }
        </div>

        <!-- Create form (collapsible) -->
        @if (showCreateForm() && canCreate()) {
          <div class="card mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Create New Firmware</h2>
              <button (click)="showCreateForm.set(false)" class="text-gray-400 hover:text-gray-600">
                <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
              </button>
            </div>

            @if (createError()) {
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-700 text-sm">{{ createError() }}</p>
              </div>
            }

            <form (ngSubmit)="onCreate()" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Version *</label>
                  <input
                    type="text"
                    [(ngModel)]="newFirmware.version"
                    name="version"
                    required
                    placeholder="e.g. v2.4.1"
                    class="form-input"
                  />
                </div>
                <div>
                  <label class="form-label">Device Model *</label>
                  <input
                    type="text"
                    [(ngModel)]="newFirmware.deviceModel"
                    name="deviceModel"
                    required
                    placeholder="e.g. VTD-100X"
                    class="form-input"
                  />
                </div>
                <div>
                  <label class="form-label">Platform *</label>
                  <input
                    type="text"
                    [(ngModel)]="newFirmware.platform"
                    name="platform"
                    required
                    placeholder="e.g. ARM Cortex-M4"
                    class="form-input"
                  />
                </div>
              </div>

              <div>
                <label class="form-label">Description</label>
                <textarea
                  [(ngModel)]="newFirmware.description"
                  name="description"
                  rows="2"
                  placeholder="Brief description of this firmware version..."
                  class="form-textarea"
                ></textarea>
              </div>

              <div>
                <label class="form-label">Release Notes</label>
                <textarea
                  [(ngModel)]="newFirmware.releaseNotes"
                  name="releaseNotes"
                  rows="3"
                  placeholder="Changelog and release notes..."
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="flex items-center gap-3 pt-2">
                <button type="submit" [disabled]="creating()" class="btn-primary">
                  @if (creating()) { Creating... } @else { Create Firmware }
                </button>
                <button type="button" (click)="showCreateForm.set(false)" class="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Search + filter -->
        <div class="card mb-4">
          <div class="relative">
            <lucide-icon [img]="SearchIcon" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by version, device model, or platform..."
              class="form-input pl-9"
            />
          </div>
        </div>

        <!-- Firmware table -->
        <div class="card">
          @if (loading()) {
            <div class="flex items-center justify-center h-48">
              <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (filteredFirmware().length === 0) {
            <div class="text-center py-12 text-gray-400">
              <lucide-icon [img]="CpuIcon" [size]="40" class="mx-auto mb-2 opacity-30"></lucide-icon>
              <p class="text-sm font-medium">No firmware found</p>
              @if (searchQuery) {
                <p class="text-xs mt-1">Try adjusting your search query</p>
              }
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-100">
                    <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Device Model</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created By</th>
                    <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created At</th>
                    <th class="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (fw of filteredFirmware(); track fw.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-3 font-mono font-semibold text-gray-900">{{ fw.version }}</td>
                      <td class="py-3 px-3 text-gray-700">{{ fw.deviceModel }}</td>
                      <td class="py-3 px-3 text-gray-600">{{ fw.platform }}</td>
                      <td class="py-3 px-3">
                        <app-status-badge [status]="fw.status"></app-status-badge>
                      </td>
                      <td class="py-3 px-3 text-gray-600">{{ fw.createdByName }}</td>
                      <td class="py-3 px-3 text-gray-500 text-xs">{{ fw.createdAt | date:'MMM d, y' }}</td>
                      <td class="py-3 px-3">
                        <a
                          [routerLink]="['/firmware', fw.id]"
                          class="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                          <lucide-icon [img]="ChevronRightIcon" [size]="16"></lucide-icon>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </app-layout>
  `
})
export class FirmwareListComponent implements OnInit {
  private firmwareService = inject(FirmwareService);
  private authService = inject(AuthService);

  PlusIcon = Plus;
  SearchIcon = Search;
  ChevronRightIcon = ChevronRight;
  XIcon = X;
  CpuIcon = Cpu;

  allFirmware = signal<Firmware[]>([]);
  loading = signal(true);
  showCreateForm = signal(false);
  creating = signal(false);
  createError = signal('');
  searchQuery = '';

  newFirmware = {
    version: '',
    deviceModel: '',
    platform: '',
    description: '',
    releaseNotes: ''
  };

  canCreate = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role ? CREATOR_ROLES.includes(role) : false;
  });

  filteredFirmware = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.allFirmware();
    return this.allFirmware().filter(fw =>
      fw.version.toLowerCase().includes(q) ||
      fw.deviceModel.toLowerCase().includes(q) ||
      fw.platform.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadFirmware();
  }

  loadFirmware(): void {
    this.loading.set(true);
    this.firmwareService.getAll().subscribe({
      next: data => {
        this.allFirmware.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onCreate(): void {
    if (!this.newFirmware.version || !this.newFirmware.deviceModel || !this.newFirmware.platform) {
      this.createError.set('Version, Device Model and Platform are required.');
      return;
    }
    this.creating.set(true);
    this.createError.set('');
    this.firmwareService.create(this.newFirmware).subscribe({
      next: fw => {
        this.allFirmware.update(list => [fw, ...list]);
        this.showCreateForm.set(false);
        this.creating.set(false);
        this.newFirmware = { version: '', deviceModel: '', platform: '', description: '', releaseNotes: '' };
      },
      error: err => {
        this.creating.set(false);
        this.createError.set(err.error?.message || 'Failed to create firmware.');
      }
    });
  }
}
