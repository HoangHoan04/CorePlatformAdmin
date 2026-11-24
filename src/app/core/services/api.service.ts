import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EndpointService } from './endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly endpoints: EndpointService,
  ) {}

  get AUTH() {
    return this.endpoints.AUTH;
  }
  get DASHBOARD() {
    return this.endpoints.DASHBOARD;
  }
  get SYSTEM() {
    return this.endpoints.SYSTEM;
  }
  get MDM() {
    return this.endpoints.MDM;
  }
  get I18N() {
    return this.endpoints.I18N;
  }

  getBlob(url: string): Observable<HttpResponse<Blob>> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }

  get<T>(url: string, params?: Record<string, any>): Observable<T> {
    if (!params) {
      return this.http.get<T>(url);
    }
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'undefined' &&
        value !== 'null'
      ) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<T>(url, { params: httpParams });
  }

  getText(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body);
  }

  postBlob(url: string, body: any = {}): Observable<HttpResponse<Blob>> {
    return this.http.post(url, body, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  uploadFile<T>(url: string, file: File, fieldName = 'file'): Observable<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.http.post<T>(url, formData);
  }

  uploadFiles<T>(url: string, files: File[], fieldName = 'files'): Observable<T> {
    const formData = new FormData();
    files.forEach((file) => formData.append(fieldName, file));
    return this.http.post<T>(url, formData);
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url);
  }
}
