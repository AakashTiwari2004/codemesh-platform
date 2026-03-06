import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  template: `
    <div class="container">
      <div class="card">
        <h2>Signup</h2>
        <label for="username">Username</label>
        <input id="username" type="text" [(ngModel)]="username" placeholder="Choose username" />

        <label for="email">Email</label>
        <input id="email" type="email" [(ngModel)]="email" placeholder="Enter email" />

        <label for="password">Password</label>
        <input id="password" type="password" [(ngModel)]="password" placeholder="Choose password" />

        <button class="btn" (click)="signup()" [disabled]="loading || !username || !password">
          {{ loading ? 'Creating account...' : 'Signup' }}
        </button>

        <p class="success" *ngIf="success">{{ success }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p>Already have an account? <a routerLink="/login">Login</a></p>
      </div>
    </div>
  `
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  success = '';
  error = '';
  loading = false;

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  signup(): void {
    this.loading = true;
    this.success = '';
    this.error = '';
    this.api.signup({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: (message: string) => {
        this.loading = false;
        if (message.includes('already exists')) {
          this.error = message;
          return;
        }
        this.success = message || 'Signup successful!';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: () => {
        this.loading = false;
        this.error = 'Signup failed. Try again.';
      }
    });
  }
}
