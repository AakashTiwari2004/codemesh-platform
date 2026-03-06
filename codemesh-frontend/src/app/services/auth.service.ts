import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService, LoginRequest, SignupRequest } from './api.service';

export interface UserSession {
  token: string;
  username: string;
  userId: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'codemesh.session';
  private readonly sessionSubject = new BehaviorSubject<UserSession | null>(this.readFromStorage());

  readonly session$ = this.sessionSubject.asObservable();
  readonly isAuthenticated$ = this.session$.pipe(map((session) => session !== null));

  constructor(private readonly api: ApiService) {}

  login(payload: LoginRequest): Observable<UserSession> {
    return this.api.login(payload).pipe(
      map((response) => {
        if (response.includes('Invalid credentials!')) {
          throw new Error('Invalid credentials');
        }

        const usernameFromToken = this.extractUsernameFromToken(response);
        const username = usernameFromToken || payload.username;
        return {
          token: response,
          username,
          userId: this.createUserIdFromUsername(username)
        };
      }),
      tap((session) => this.writeSession(session))
    );
  }

  signup(payload: SignupRequest): Observable<string> {
    return this.api.signup(payload);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
  }

  getToken(): string | null {
    return this.sessionSubject.value?.token ?? null;
  }

  getCurrentUsername(): string | null {
    return this.sessionSubject.value?.username ?? null;
  }

  getCurrentUserId(): number | null {
    return this.sessionSubject.value?.userId ?? null;
  }

  isAuthenticated(): boolean {
    return this.sessionSubject.value !== null;
  }

  private writeSession(session: UserSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readFromStorage(): UserSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserSession>;
      if (!parsed.token || !parsed.username || !parsed.userId) {
        return null;
      }
      return { token: parsed.token, username: parsed.username, userId: parsed.userId };
    } catch {
      return null;
    }
  }

  private extractUsernameFromToken(token: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson) as { sub?: string };
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  private createUserIdFromUsername(username: string): number {
    let hash = 0;
    for (let i = 0; i < username.length; i += 1) {
      hash = (hash << 5) - hash + username.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) + 1000;
  }
}
