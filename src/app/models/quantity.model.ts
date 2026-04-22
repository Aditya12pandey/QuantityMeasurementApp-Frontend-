export interface QuantityDTO {
  value: number;
  unitName: string;
  measurementType: string;
}

export interface TwoQuantityRequest {
  first: QuantityDTO;
  second: QuantityDTO;
}

export interface ConvertRequest {
  quantity: QuantityDTO;
  targetUnit: QuantityDTO;
}

export interface AddSubtractRequest {
  first: QuantityDTO;
  second: QuantityDTO;
  targetUnit: QuantityDTO;
}

export interface CompareResult {
  equal: boolean;
}

export interface DivideResult {
  value: number;
}

export interface MeasurementCountDto {
  count: number;
}

export interface QuantityMeasurementRecordDto {
  id: number;
  operationType: string;
  measurementType: string;
  inputValues: string;
  resultValue: string;
  createdAt: string;
}

export type MeasurementType = 'LENGTH' | 'WEIGHT' | 'TEMPERATURE' | 'VOLUME';
export type Operation = 'COMPARE' | 'CONVERT' | 'ADD' | 'SUBTRACT' | 'DIVIDE';

export const UNIT_MAP: Record<MeasurementType, string[]> = {
  LENGTH: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  WEIGHT: ['KILOGRAM', 'GRAM', 'POUND'],
  TEMPERATURE: ['CELSIUS', 'FAHRENHEIT'],
  VOLUME: ['LITRE', 'MILLILITRE', 'GALLON'],
};
