import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { QuantityInputComponent } from '../quantity-input/quantity-input.component';
import { ResultCardComponent } from '../result-card/result-card.component';
import { QuantityService } from '../../services/quantity.service';
import {
  MeasurementType,
  QuantityDTO,
  UNIT_MAP
} from '../../models/quantity.model';

type Tab = 'compare' | 'convert' | 'add' | 'subtract' | 'divide';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, QuantityInputComponent, ResultCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeTab: Tab = 'compare';
  loading = false;
  errorMsg = '';

  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'compare',  label: 'Compare',  icon: '⚖️' },
    { id: 'convert',  label: 'Convert',  icon: '🔄' },
    { id: 'add',      label: 'Add',      icon: '➕' },
    { id: 'subtract', label: 'Subtract', icon: '➖' },
    { id: 'divide',   label: 'Divide',   icon: '➗' },
  ];

  // Shared state per operation
  first: QuantityDTO  = { value: 0, unitName: 'FEET',    measurementType: 'LENGTH' };
  second: QuantityDTO = { value: 0, unitName: 'INCHES',  measurementType: 'LENGTH' };
  target: QuantityDTO = { value: 0, unitName: 'YARDS',   measurementType: 'LENGTH' };

  // Convert: separate target unit selector
  convertTargetUnit = 'INCHES';
  convertTargetType: MeasurementType = 'LENGTH';

  result: string | null = null;
  resultIcon = '✅';
  resultType: 'success' | 'info' | 'warning' | 'error' = 'success';
  resultLabel = 'Result';

  measurementTypes: MeasurementType[] = ['LENGTH', 'WEIGHT', 'TEMPERATURE', 'VOLUME'];
  get convertUnits(): string[] { return UNIT_MAP[this.convertTargetType]; }

  constructor(private qtyService: QuantityService) {}

  ngOnInit(): void {}

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.result = null;
    this.errorMsg = '';
  }

  onFirstChange(q: QuantityDTO) { this.first = q; }
  onSecondChange(q: QuantityDTO) { this.second = q; }
  onTargetChange(q: QuantityDTO) { this.target = q; }
  onConvertFirstChange(q: QuantityDTO) {
    this.first = q;
    // keep target type in sync
    this.convertTargetType = q.measurementType as MeasurementType;
    this.convertTargetUnit = UNIT_MAP[this.convertTargetType][0];
  }

  execute(): void {
    this.loading = true;
    this.errorMsg = '';
    this.result = null;

    const obs$ = this.buildRequest();
    if (!obs$) { this.loading = false; return; }

    (obs$ as any).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.applyResult(res);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err.error?.message || err.error?.error || 'Operation failed.';
      }
    });
  }

  private buildRequest() {
    switch (this.activeTab) {
      case 'compare':
        return this.qtyService.compare({ first: this.first, second: this.second });
      case 'convert':
        return this.qtyService.convert({
          quantity: this.first,
          targetUnit: { value: 0, unitName: this.convertTargetUnit, measurementType: this.convertTargetType }
        });
      case 'add':
        return this.qtyService.add({ first: this.first, second: this.second, targetUnit: this.target });
      case 'subtract':
        return this.qtyService.subtract({ first: this.first, second: this.second, targetUnit: this.target });
      case 'divide':
        return this.qtyService.divide({ first: this.first, second: this.second });
      default:
        return null;
    }
  }

  private applyResult(res: any): void {
    switch (this.activeTab) {
      case 'compare':
        this.resultLabel = 'Comparison Result';
        this.result = res.equal ? 'Equal ✅' : 'Not Equal ❌';
        this.resultIcon = res.equal ? '✅' : '❌';
        this.resultType = res.equal ? 'success' : 'warning';
        break;
      case 'convert':
        this.resultLabel = 'Converted Value';
        this.result = `${res.value} ${res.unitName}`;
        this.resultIcon = '🔄';
        this.resultType = 'info';
        break;
      case 'add':
        this.resultLabel = 'Sum';
        this.result = `${res.value} ${res.unitName}`;
        this.resultIcon = '➕';
        this.resultType = 'success';
        break;
      case 'subtract':
        this.resultLabel = 'Difference';
        this.result = `${res.value} ${res.unitName}`;
        this.resultIcon = '➖';
        this.resultType = 'info';
        break;
      case 'divide':
        this.resultLabel = 'Division Result';
        this.result = `${res.value}`;
        this.resultIcon = '➗';
        this.resultType = 'info';
        break;
    }
  }
}
