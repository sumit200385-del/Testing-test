import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Firmware } from '../../models';

@Injectable({ providedIn: 'root' })
export class FirmwareService {
  private http = inject(HttpClient);
  private baseUrl = '/api/firmware';

  getAll(): Observable<Firmware[]> {
    return this.http.get<Firmware[]>(this.baseUrl);
  }

  getById(id: string): Observable<Firmware> {
    return this.http.get<Firmware>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Firmware>): Observable<Firmware> {
    return this.http.post<Firmware>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Firmware>): Observable<Firmware> {
    return this.http.put<Firmware>(`${this.baseUrl}/${id}`, data);
  }

  submit(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/submit`, {});
  }
}
