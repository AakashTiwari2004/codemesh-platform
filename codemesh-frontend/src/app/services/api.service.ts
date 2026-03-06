import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
}

export interface SubmissionRequest {
  userId: number;
  problemId: number;
  code: string;
  language: string;
}

export interface Submission {
  id: number;
  userId: number;
  problemId: number;
  code: string;
  language: string;
  status: string;
  output: string;
}

export interface RunCodeResponse {
  output: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly gatewayUrl = 'http://localhost:8080';

  constructor(private readonly http: HttpClient) {}

  login(data: LoginRequest): Observable<string> {
    return this.http.post(`${this.gatewayUrl}/auth/login`, data, { responseType: 'text' });
  }

  signup(data: SignupRequest): Observable<string> {
    return this.http.post(`${this.gatewayUrl}/auth/signup`, data, { responseType: 'text' });
  }

  getProblems(token?: string): Observable<Problem[]> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<Problem[]>(`${this.gatewayUrl}/problems`, { headers });
  }

  getProblemById(id: number, token?: string): Observable<Problem> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<Problem>(`${this.gatewayUrl}/problems/${id}`, { headers });
  }

  submitSolution(submission: SubmissionRequest, token?: string): Observable<Submission> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.post<Submission>(`${this.gatewayUrl}/submissions`, submission, { headers });
  }

  getSubmissionById(id: number, token?: string): Observable<Submission> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<Submission>(`${this.gatewayUrl}/submissions/${id}`, { headers });
  }

  runCode(submission: { code: string; language: string }, token?: string): Observable<RunCodeResponse> {
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.post<RunCodeResponse>(`${this.gatewayUrl}/execute`, submission, { headers });
  }
}
