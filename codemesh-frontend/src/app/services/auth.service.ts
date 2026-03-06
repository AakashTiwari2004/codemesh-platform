import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService, LoginRequest, SignupRequest } from './api.service';

interface JwtPayload {
  sub?: string;
  exp?: number;
}

export interface UserSession {
  token: string;
  username: string;
  userId: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'codemesh.session';
  private readonly sessionSubject = new BehaviorSubject<UserSession | null>(this.readFromStorage());
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly session$ = this.sessionSubject.asObservable();
  readonly isAuthenticated$ = this.session$.pipe(map((session) => session !== null));

  constructor(private readonly api: ApiService) {
    this.refreshExpiryWatcher(this.sessionSubject.value);
  }

  login(payload: LoginRequest): Observable<UserSession> {
    return this.api.login(payload).pipe(
      map((response) => {
        if (response.includes('Invalid credentials!')) {
          throw new Error('Invalid credentials');
        }
        if (this.isTokenExpired(response)) {
          throw new Error('Token already expired');
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
    this.clearExpiryWatcher();
    localStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
  }

  getToken(): string | null {
    const token = this.sessionSubject.value?.token ?? null;
    if (!token) {
      return null;
    }
    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }

  getCurrentUsername(): string | null {
    return this.sessionSubject.value?.username ?? null;
  }

  getCurrentUserId(): number | null {
    return this.sessionSubject.value?.userId ?? null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  private writeSession(session: UserSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
    this.refreshExpiryWatcher(session);
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
      if (this.isTokenExpired(parsed.token)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return { token: parsed.token, username: parsed.username, userId: parsed.userId };
    } catch {
      return null;
    }
  }

  private extractUsernameFromToken(token: string): string | null {
    const payload = this.decodeTokenPayload(token);
    return payload?.sub ?? null;
  }

  private decodeTokenPayload(token: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(payloadJson) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return true;
    }
    const currentEpochSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= currentEpochSeconds;
  }

  private getExpiryTimestampMs(token: string): number | null {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return null;
    }
    return payload.exp * 1000;
  }

  private refreshExpiryWatcher(session: UserSession | null): void {
    this.clearExpiryWatcher();
    if (!session) {
      return;
    }

    const expiryTimeMs = this.getExpiryTimestampMs(session.token);
    if (!expiryTimeMs) {
      this.logout();
      return;
    }

    const timeoutMs = expiryTimeMs - Date.now();
    if (timeoutMs <= 0) {
      this.logout();
      return;
    }

    this.expiryTimer = setTimeout(() => {
      this.logout();
    }, timeoutMs);
  }

  private clearExpiryWatcher(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
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
