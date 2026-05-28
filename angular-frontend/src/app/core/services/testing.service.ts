import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestingSession, TestCase } from '../../models';

@Injectable({ providedIn: 'root' })
export class TestingService {
  private http = inject(HttpClient);
  private baseUrl = '/api/testing';

  getSessionsForFirmware(firmwareId: string): Observable<TestingSession[]> {
    return this.http.get<TestingSession[]>(`${this.baseUrl}/sessions?firmwareId=${firmwareId}`);
  }

  startSession(firmwareId: string, stage: number, notes?: string): Observable<TestingSession> {
    return this.http.post<TestingSession>(`${this.baseUrl}/sessions`, { firmwareId, stage, notes });
  }

  getSession(id: string): Observable<TestingSession> {
    return this.http.get<TestingSession>(`${this.baseUrl}/sessions/${id}`);
  }

  updateTestCase(sessionId: string, caseId: string, data: Partial<TestCase>): Observable<TestCase> {
    return this.http.put<TestCase>(`${this.baseUrl}/sessions/${sessionId}/cases/${caseId}`, data);
  }

  completeSession(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/sessions/${id}/complete`, {});
  }

  getSessionsByStage(stage: number): Observable<TestingSession[]> {
    return this.http.get<TestingSession[]>(`${this.baseUrl}/sessions?stage=${stage}`);
  }
}
