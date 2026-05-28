import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangelogService } from '../../core/services/changelog.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { ChangeLogEntry } from '../../models';
import { LucideAngularModule, Search, RefreshCw, ScrollText, ChevronDown, ChevronUp } from 'lucide-angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-changelog',
  standalone: true,
  imports: [FormsModule, LayoutComponent, LucideAngularModule, DatePipe],
  template: `
    <app-layout>
      <div class="p-6 max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Change Log</h1>
            <p class="text-gray-500 text-sm mt-1">Audit trail of all system changes</p>
          </div>
          <button (click)="loadData()" class="btn-secondary">
            <lucide-icon [img]="RefreshIcon" [size]="16"></lucide-icon>
            Refresh
          </button>
        </div>

        <!-- Filter bar -->
        <div class="card mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="relative sm:col-span-2">
              <lucide-icon [img]="SearchIcon" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by action, entity, user..."
                class="form-input pl-9"
              />
            </div>
            <div>
              <select [(ngModel)]="filterEntityType" class="form-select">
                <option value="">All Entity Types</option>
                <option value="FIRMWARE">FIRMWARE</option>
                <option value="SESSION">SESSION</option>
                <option value="TEST_CASE">TEST_CASE</option>
                <option value="SIGNOFF">SIGNOFF</option>
                <option value="USER">USER</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Results -->
        @if (loading()) {
          <div class="flex items-center justify-center h-48">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (filteredEntries().length === 0) {
          <div class="card text-center py-12 text-gray-400">
            <lucide-icon [img]="ScrollIcon" [size]="40" class="mx-auto mb-2 opacity-30"></lucide-icon>
            <p class="text-sm font-medium">No log entries found</p>
            @if (searchQuery || filterEntityType) {
              <p class="text-xs mt-1">Try adjusting your filters</p>
            }
          </div>
        } @else {
          <div class="space-y-2">
            @for (entry of filteredEntries(); track entry.id) {
              <div class="card hover:shadow-md transition-shadow">
                <div class="flex flex-wrap items-start gap-3">
                  <!-- Action badge -->
                  <span [class]="actionBadgeClass(entry.action)" class="badge shrink-0 mt-0.5">
                    {{ entry.action }}
                  </span>

                  <!-- Main content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {{ entry.entityType }}
                      </span>
                      <span class="text-xs text-gray-400 font-mono">{{ entry.entityId }}</span>
                    </div>
                    @if (entry.details) {
                      <p class="text-sm text-gray-800">{{ entry.details }}</p>
                    }
                    <div class="flex flex-wrap items-center gap-3 mt-1">
                      <span class="text-xs text-gray-500">By <span class="font-medium text-gray-700">{{ entry.changedByName }}</span></span>
                      <span class="text-xs text-gray-400">{{ entry.changedAt | date:'MMM d, y h:mm a' }}</span>
                    </div>
                  </div>

                  <!-- Expand diff -->
                  @if (entry.oldValue || entry.newValue) {
                    <button
                      (click)="toggleExpand(entry.id)"
                      class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                    >
                      Diff
                      @if (expandedEntryId() === entry.id) {
                        <lucide-icon [img]="ChevronUpIcon" [size]="14"></lucide-icon>
                      } @else {
                        <lucide-icon [img]="ChevronDownIcon" [size]="14"></lucide-icon>
                      }
                    </button>
                  }
                </div>

                <!-- Expanded diff -->
                @if (expandedEntryId() === entry.id && (entry.oldValue || entry.newValue)) {
                  <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @if (entry.oldValue) {
                      <div>
                        <p class="text-xs font-semibold text-red-600 mb-1">Before</p>
                        <pre class="text-xs bg-red-50 border border-red-100 rounded-lg p-3 overflow-x-auto text-gray-800">{{ formatJson(entry.oldValue) }}</pre>
                      </div>
                    }
                    @if (entry.newValue) {
                      <div>
                        <p class="text-xs font-semibold text-green-600 mb-1">After</p>
                        <pre class="text-xs bg-green-50 border border-green-100 rounded-lg p-3 overflow-x-auto text-gray-800">{{ formatJson(entry.newValue) }}</pre>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <p class="text-center text-xs text-gray-400 mt-4">
            Showing {{ filteredEntries().length }} of {{ allEntries().length }} entries
          </p>
        }
      </div>
    </app-layout>
  `
})
export class ChangeLogComponent implements OnInit {
  private changelogService = inject(ChangelogService);

  SearchIcon = Search;
  RefreshIcon = RefreshCw;
  ScrollIcon = ScrollText;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  allEntries = signal<ChangeLogEntry[]>([]);
  loading = signal(true);
  searchQuery = '';
  filterEntityType = '';
  expandedEntryId = signal<string | null>(null);

  filteredEntries = computed(() => {
    const q = this.searchQuery.toLowerCase();
    const et = this.filterEntityType;
    return this.allEntries().filter(entry => {
      const matchType = !et || entry.entityType === et;
      const matchSearch = !q || (
        entry.action.toLowerCase().includes(q) ||
        entry.entityType.toLowerCase().includes(q) ||
        entry.entityId.toLowerCase().includes(q) ||
        entry.changedByName.toLowerCase().includes(q) ||
        (entry.details ?? '').toLowerCase().includes(q)
      );
      return matchType && matchSearch;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.changelogService.getAll({ limit: 200, offset: 0 }).subscribe({
      next: entries => {
        this.allEntries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  toggleExpand(id: string): void {
    this.expandedEntryId.set(this.expandedEntryId() === id ? null : id);
  }

  formatJson(obj: Record<string, unknown>): string {
    return JSON.stringify(obj, null, 2);
  }

  actionBadgeClass(action: string): string {
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('ADD')) return 'badge bg-green-100 text-green-800';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY')) return 'badge bg-blue-100 text-blue-800';
    if (a.includes('DELETE') || a.includes('REMOVE')) return 'badge bg-red-100 text-red-800';
    if (a.includes('APPROVE') || a.includes('PASS')) return 'badge bg-green-100 text-green-800';
    if (a.includes('REJECT') || a.includes('FAIL')) return 'badge bg-red-100 text-red-800';
    if (a.includes('SUBMIT')) return 'badge bg-yellow-100 text-yellow-800';
    if (a.includes('SIGN')) return 'badge bg-purple-100 text-purple-800';
    return 'badge bg-gray-100 text-gray-700';
  }
}
