import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getProblems(): Observable<Problem[]> {
    return this.http.get<Problem[]>(`${this.gatewayUrl}/problems`);
  }

  getProblemById(id: number): Observable<Problem> {
    return this.http.get<Problem>(`${this.gatewayUrl}/problems/${id}`);
  }

  submitSolution(submission: SubmissionRequest): Observable<Submission> {
    return this.http.post<Submission>(`${this.gatewayUrl}/submissions`, submission);
  }

  getSubmissionById(id: number): Observable<Submission> {
    return this.http.get<Submission>(`${this.gatewayUrl}/submissions/${id}`);
  }

  runCode(submission: { code: string; language: string }): Observable<RunCodeResponse> {
    return this.http.post<RunCodeResponse>(`${this.gatewayUrl}/execute`, submission);
  }
}
