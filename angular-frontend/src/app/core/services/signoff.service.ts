import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Signoff } from '../../models';

export interface SignoffData {
  firmwareId: string;
  sessionId: string;
  stage: number;
  decision: 'APPROVED' | 'REJECTED';
  comments?: string;
}

@Injectable({ providedIn: 'root' })
export class SignoffService {
  private http = inject(HttpClient);
  private baseUrl = '/api/signoffs';

  sign(data: SignoffData): Observable<Signoff> {
    return this.http.post<Signoff>(this.baseUrl, data);
  }

  getForFirmware(firmwareId: string): Observable<Signoff[]> {
    return this.http.get<Signoff[]>(`${this.baseUrl}?firmwareId=${firmwareId}`);
  }
}
