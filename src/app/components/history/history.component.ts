import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuantityService } from '../../services/quantity.service';
import { QuantityMeasurementRecordDto } from '../../models/quantity.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  records: QuantityMeasurementRecordDto[] = [];
  loading = false;
  errorMsg = '';
  totalCount = 0;

  filterMode: 'all' | 'operation' | 'measurement' = 'all';
  operationFilter = '';
  measurementFilter = '';

  operationTypes = ['COMPARE', 'CONVERT', 'ADD', 'SUBTRACT', 'DIVIDE'];
  measurementTypes = ['LENGTH', 'WEIGHT', 'TEMPERATURE', 'VOLUME'];

  constructor(private qtyService: QuantityService) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadCount();
  }

  loadAll(): void {
    this.loading = true;
    this.qtyService.getHistory().subscribe({
      next: r => { this.records = r; this.loading = false; },
      error: () => { this.errorMsg = 'Failed to load history.'; this.loading = false; }
    });
  }

  loadCount(): void {
    this.qtyService.getCount().subscribe({
      next: r => this.totalCount = r.count,
      error: () => {}
    });
  }

  applyFilter(): void {
    this.loading = true;
    this.errorMsg = '';

    const obs$ =
      this.filterMode === 'operation' && this.operationFilter
        ? this.qtyService.getHistoryByOperation(this.operationFilter)
        : this.filterMode === 'measurement' && this.measurementFilter
          ? this.qtyService.getHistoryByMeasurement(this.measurementFilter)
          : this.qtyService.getHistory();

    obs$.subscribe({
      next: r => { this.records = r; this.loading = false; },
      error: () => { this.errorMsg = 'Failed to load history.'; this.loading = false; }
    });
  }

  resetFilter(): void {
    this.filterMode = 'all';
    this.operationFilter = '';
    this.measurementFilter = '';
    this.loadAll();
  }

  operationBadgeClass(op: string): string {
    const map: Record<string, string> = {
      COMPARE: 'badge-purple',
      CONVERT: 'badge-blue',
      ADD: 'badge-green',
      SUBTRACT: 'badge-orange',
      DIVIDE: 'badge-red'
    };
    return map[op?.toUpperCase()] ?? 'badge-gray';
  }
}
