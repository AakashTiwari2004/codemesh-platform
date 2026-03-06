import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly gatewayUrl = 'http://localhost:8080';

  constructor(private readonly http: HttpClient) {}

  login(data: { username: string; password: string }): Observable<string> {
    return this.http.post(`${this.gatewayUrl}/auth/login`, data, { responseType: 'text' });
  }

  signup(data: { username: string; email: string; password: string }): Observable<unknown> {
    return this.http.post(`${this.gatewayUrl}/auth/signup`, data);
  }

  getProblems(token?: string): Observable<unknown[]> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<unknown[]>(`${this.gatewayUrl}/problems`, { headers });
  }

  getProblemById(id: number, token?: string): Observable<unknown> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<unknown>(`${this.gatewayUrl}/problems/${id}`, { headers });
  }

  submitSolution(submission: unknown, token?: string): Observable<unknown> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.post(`${this.gatewayUrl}/submissions`, submission, { headers });
  }

  runCode(submission: unknown, token?: string): Observable<{ output: string; status: string }> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.post<{ output: string; status: string }>(`${this.gatewayUrl}/execute`, submission, { headers });
  }
}
