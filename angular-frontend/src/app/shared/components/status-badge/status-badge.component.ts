import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirmwareStatus, TestResult } from '../../../models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">{{ displayText }}</span>
  `
})
export class StatusBadgeComponent {
  @Input() status: FirmwareStatus | TestResult | string = '';

  get displayText(): string {
    return this.status.replace(/_/g, ' ');
  }

  get badgeClass(): string {
    const base = 'badge ';
    switch (this.status) {
      case 'DRAFT':
        return base + 'bg-gray-100 text-gray-700';
      case 'STAGE1_PENDING':
      case 'STAGE2_PENDING':
      case 'STAGE3_PENDING':
        return base + 'bg-yellow-100 text-yellow-800';
      case 'STAGE1_PASSED':
      case 'STAGE2_PASSED':
        return base + 'bg-blue-100 text-blue-800';
      case 'STAGE1_FAILED':
      case 'STAGE2_FAILED':
        return base + 'bg-red-100 text-red-800';
      case 'APPROVED':
      case 'PASS':
        return base + 'bg-green-100 text-green-800';
      case 'REJECTED':
      case 'FAIL':
        return base + 'bg-red-100 text-red-800';
      case 'SKIP':
        return base + 'bg-gray-100 text-gray-600';
      case 'PENDING':
        return base + 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return base + 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return base + 'bg-green-100 text-green-800';
      case 'SIGNED_OFF':
        return base + 'bg-purple-100 text-purple-800';
      default:
        return base + 'bg-gray-100 text-gray-600';
    }
  }
}
