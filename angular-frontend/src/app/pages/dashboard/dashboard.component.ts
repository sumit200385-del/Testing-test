import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FirmwareService } from '../../core/services/firmware.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { Firmware } from '../../models';
import { LucideAngularModule, Cpu, CheckCircle, XCircle, Activity, ArrowRight, ChevronRight } from 'lucide-angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LayoutComponent, LucideAngularModule, DatePipe],
  template: `
    <app-layout>
      <div class="p-6 max-w-7xl mx-auto">
        <!-- Page header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-500 text-sm mt-1">Overview of VTD firmware testing pipeline</p>
        </div>

        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else {
          <!-- Stats cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="card">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <lucide-icon [img]="CpuIcon" [size]="20" class="text-blue-600"></lucide-icon>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ stats().total }}</p>
                  <p class="text-xs text-gray-500">Total Firmware</p>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <lucide-icon [img]="ActivityIcon" [size]="20" class="text-yellow-600"></lucide-icon>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ stats().inProgress }}</p>
                  <p class="text-xs text-gray-500">In Progress</p>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <lucide-icon [img]="CheckIcon" [size]="20" class="text-green-600"></lucide-icon>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ stats().approved }}</p>
                  <p class="text-xs text-gray-500">Approved</p>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <lucide-icon [img]="XCircleIcon" [size]="20" class="text-red-600"></lucide-icon>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900">{{ stats().failed }}</p>
                  <p class="text-xs text-gray-500">Failed / Rejected</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sign-off pipeline -->
          <div class="card mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Testing Pipeline</h2>
            <div class="flex flex-col sm:flex-row items-center gap-4">
              <!-- Stage 1 -->
              <div class="flex-1 text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                <p class="font-semibold text-gray-800 text-sm">Sanity Test</p>
                <p class="text-xs text-gray-500 mt-1">Initial validation</p>
                <div class="mt-2">
                  <span class="text-lg font-bold text-blue-600">{{ stats().stage1 }}</span>
                  <span class="text-xs text-gray-500 ml-1">active</span>
                </div>
              </div>

              <lucide-icon [img]="ArrowRightIcon" [size]="20" class="text-gray-400 hidden sm:block"></lucide-icon>

              <!-- Stage 2 -->
              <div class="flex-1 text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div class="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                <p class="font-semibold text-gray-800 text-sm">Field Test</p>
                <p class="text-xs text-gray-500 mt-1">Real-world testing</p>
                <div class="mt-2">
                  <span class="text-lg font-bold text-purple-600">{{ stats().stage2 }}</span>
                  <span class="text-xs text-gray-500 ml-1">active</span>
                </div>
              </div>

              <lucide-icon [img]="ArrowRightIcon" [size]="20" class="text-gray-400 hidden sm:block"></lucide-icon>

              <!-- Stage 3 -->
              <div class="flex-1 text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div class="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                <p class="font-semibold text-gray-800 text-sm">Final Sign-off</p>
                <p class="text-xs text-gray-500 mt-1">Management approval</p>
                <div class="mt-2">
                  <span class="text-lg font-bold text-green-600">{{ stats().stage3 }}</span>
                  <span class="text-xs text-gray-500 ml-1">active</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent firmware table -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Recent Firmware</h2>
              <a routerLink="/firmware" class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all
                <lucide-icon [img]="ChevronRightIcon" [size]="16"></lucide-icon>
              </a>
            </div>

            @if (recentFirmware().length === 0) {
              <div class="text-center py-8 text-gray-400">
                <lucide-icon [img]="CpuIcon" [size]="40" class="mx-auto mb-2 opacity-30"></lucide-icon>
                <p class="text-sm">No firmware versions found</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-100">
                      <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
                      <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Device Model</th>
                      <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform</th>
                      <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created By</th>
                      <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th class="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    @for (fw of recentFirmware(); track fw.id) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="py-3 px-3 font-mono font-medium text-gray-900">{{ fw.version }}</td>
                        <td class="py-3 px-3 text-gray-600">{{ fw.deviceModel }}</td>
                        <td class="py-3 px-3 text-gray-600">{{ fw.platform }}</td>
                        <td class="py-3 px-3">
                          <app-status-badge [status]="fw.status"></app-status-badge>
                        </td>
                        <td class="py-3 px-3 text-gray-600">{{ fw.createdByName }}</td>
                        <td class="py-3 px-3 text-gray-500 text-xs">{{ fw.createdAt | date:'MMM d, y' }}</td>
                        <td class="py-3 px-3">
                          <a [routerLink]="['/firmware', fw.id]" class="text-blue-600 hover:text-blue-700">
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
        }
      </div>
    </app-layout>
  `
})
export class DashboardComponent implements OnInit {
  private firmwareService = inject(FirmwareService);

  CpuIcon = Cpu;
  CheckIcon = CheckCircle;
  XCircleIcon = XCircle;
  ActivityIcon = Activity;
  ArrowRightIcon = ArrowRight;
  ChevronRightIcon = ChevronRight;

  allFirmware = signal<Firmware[]>([]);
  loading = signal(true);

  recentFirmware = computed(() => this.allFirmware().slice(0, 8));

  stats = computed(() => {
    const fw = this.allFirmware();
    const inProgressStatuses = ['STAGE1_PENDING', 'STAGE1_PASSED', 'STAGE2_PENDING', 'STAGE2_PASSED', 'STAGE3_PENDING'];
    return {
      total: fw.length,
      inProgress: fw.filter(f => inProgressStatuses.includes(f.status)).length,
      approved: fw.filter(f => f.status === 'APPROVED').length,
      failed: fw.filter(f => ['STAGE1_FAILED', 'STAGE2_FAILED', 'REJECTED'].includes(f.status)).length,
      stage1: fw.filter(f => f.status === 'STAGE1_PENDING').length,
      stage2: fw.filter(f => f.status === 'STAGE2_PENDING').length,
      stage3: fw.filter(f => f.status === 'STAGE3_PENDING').length,
    };
  });

  ngOnInit(): void {
    this.firmwareService.getAll().subscribe({
      next: data => {
        this.allFirmware.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
