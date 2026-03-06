import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:8080';

  constructor(private readonly http: HttpClient) {}

  login(data: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/auth/login`, data, { responseType: 'text' });
  }
}
