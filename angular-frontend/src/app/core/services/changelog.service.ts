import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangeLogEntry } from '../../models';

export interface ChangeLogParams {
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ChangelogService {
  private http = inject(HttpClient);
  private baseUrl = '/api/changelog';

  getAll(params?: ChangeLogParams): Observable<ChangeLogEntry[]> {
    let httpParams = new HttpParams();
    if (params?.entityType) httpParams = httpParams.set('entityType', params.entityType);
    if (params?.entityId) httpParams = httpParams.set('entityId', params.entityId);
    if (params?.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) httpParams = httpParams.set('offset', params.offset.toString());
    return this.http.get<ChangeLogEntry[]>(this.baseUrl, { params: httpParams });
  }
}
