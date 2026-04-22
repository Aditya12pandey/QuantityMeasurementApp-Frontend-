import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="result-card" [ngClass]="type">
      <div class="result-icon">{{ icon }}</div>
      <div class="result-content">
        <div class="result-label">{{ label }}</div>
        <div class="result-value">{{ value }}</div>
      </div>
    </div>
  `,
  styles: [`
    .result-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      margin-top: 1.5rem;
      animation: slideIn 0.3s ease;

      &.success { background: #f0fdf4; border: 1px solid #86efac; }
      &.info    { background: #eff6ff; border: 1px solid #93c5fd; }
      &.warning { background: #fffbeb; border: 1px solid #fcd34d; }
      &.error   { background: #fef2f2; border: 1px solid #fca5a5; }
    }
    .result-icon { font-size: 2rem; }
    .result-label { font-size: 0.8rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .result-value { font-size: 1.4rem; font-weight: 700; color: #1a1a2e; margin-top: 0.2rem; }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ResultCardComponent {
  @Input() label = 'Result';
  @Input() value = '';
  @Input() icon = '✅';
  @Input() type: 'success' | 'info' | 'warning' | 'error' = 'success';
}
