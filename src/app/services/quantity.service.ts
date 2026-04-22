import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AddSubtractRequest,
  CompareResult,
  ConvertRequest,
  DivideResult,
  MeasurementCountDto,
  QuantityDTO,
  QuantityMeasurementRecordDto,
  TwoQuantityRequest
} from '../models/quantity.model';

@Injectable({ providedIn: 'root' })
export class QuantityService {
  private base = `${environment.apiUrl}/quantities`;

  constructor(private http: HttpClient) {}

  compare(req: TwoQuantityRequest): Observable<CompareResult> {
    return this.http.post<CompareResult>(`${this.base}/compare`, req);
  }

  convert(req: ConvertRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.base}/convert`, req);
  }

  add(req: AddSubtractRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.base}/add`, req);
  }

  subtract(req: AddSubtractRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.base}/subtract`, req);
  }

  divide(req: TwoQuantityRequest): Observable<DivideResult> {
    return this.http.post<DivideResult>(`${this.base}/divide`, req);
  }

  getHistory(): Observable<QuantityMeasurementRecordDto[]> {
    return this.http.get<QuantityMeasurementRecordDto[]>(`${this.base}/history`);
  }

  getHistoryByOperation(operationType: string): Observable<QuantityMeasurementRecordDto[]> {
    return this.http.get<QuantityMeasurementRecordDto[]>(`${this.base}/history/operation/${operationType}`);
  }

  getHistoryByMeasurement(measurementType: string): Observable<QuantityMeasurementRecordDto[]> {
    return this.http.get<QuantityMeasurementRecordDto[]>(`${this.base}/history/measurement/${measurementType}`);
  }

  getCount(): Observable<MeasurementCountDto> {
    return this.http.get<MeasurementCountDto>(`${this.base}/count`);
  }
}
