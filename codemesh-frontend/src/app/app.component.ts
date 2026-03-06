import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <nav class="topnav">
      <a routerLink="/problems" routerLinkActive="active">Problems</a>
      <a routerLink="/login" routerLinkActive="active">Login</a>
      <a routerLink="/signup" routerLinkActive="active">Signup</a>
      <button (click)="logout()">Logout</button>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(private readonly router: Router) {}

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
