import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeasurementType, QuantityDTO, UNIT_MAP } from '../../models/quantity.model';

@Component({
  selector: 'app-quantity-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quantity-input.component.html',
  styleUrls: ['./quantity-input.component.scss']
})
export class QuantityInputComponent implements OnChanges {
  @Input() label = 'Quantity';
  @Input() forcedType: MeasurementType | null = null;   // lock type from parent
  @Input() availableUnits: string[] | null = null;      // override units list
  @Input() initialData: QuantityDTO | null = null;
  @Output() quantityChange = new EventEmitter<QuantityDTO>();

  measurementTypes: MeasurementType[] = ['LENGTH', 'WEIGHT', 'TEMPERATURE', 'VOLUME'];
  units: string[] = [];

  value = 0;
  selectedType: MeasurementType = 'LENGTH';
  selectedUnit = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData) {
      this.value = this.initialData.value;
      this.selectedType = this.initialData.measurementType as MeasurementType;
      this.selectedUnit = this.initialData.unitName;
    }
    if (changes['forcedType'] && this.forcedType) {
      this.selectedType = this.forcedType;
    }
    this.refreshUnits();
  }

  onTypeChange(): void {
    this.refreshUnits();
    this.emit();
  }

  private refreshUnits(): void {
    this.units = this.availableUnits ?? UNIT_MAP[this.selectedType];
    this.selectedUnit = this.units[0] ?? '';
    this.emit();
  }

  emit(): void {
    this.quantityChange.emit({
      value: this.value,
      unitName: this.selectedUnit,
      measurementType: this.selectedType
    });
  }
}
