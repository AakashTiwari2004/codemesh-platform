import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserSession } from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <nav class="topnav">
      <a *ngIf="isAuthenticated" routerLink="/problems" routerLinkActive="active">Problems</a>
      <a *ngIf="!isAuthenticated" routerLink="/login" routerLinkActive="active">Login</a>
      <a *ngIf="!isAuthenticated" routerLink="/signup" routerLinkActive="active">Signup</a>
      <span *ngIf="isAuthenticated">Signed in as {{ username }}</span>
      <button *ngIf="isAuthenticated" (click)="logout()">Logout</button>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  isAuthenticated = false;
  username = '';

  constructor(private readonly router: Router, private readonly auth: AuthService) {
    this.auth.session$.subscribe((session: UserSession | null) => {
      this.isAuthenticated = session !== null;
      this.username = session?.username ?? '';
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
