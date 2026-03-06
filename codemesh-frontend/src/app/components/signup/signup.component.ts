import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-signup',
  template: `
    <div class="auth-layout container">
      <section class="auth-hero">
        <p class="eyebrow">CodeMesh Judge</p>
        <h1>Create your coding workspace</h1>
        <p>Build your profile, solve problems, and track your submissions from one dashboard.</p>
      </section>

      <section class="card auth-panel">
        <h2>Create account</h2>
        <label for="username">Username</label>
        <input id="username" type="text" [(ngModel)]="username" placeholder="Choose username" />

        <label for="email">Email</label>
        <input id="email" type="email" [(ngModel)]="email" placeholder="Enter email" />

        <label for="password">Password</label>
        <input id="password" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" placeholder="Choose password" />
        <label class="field-inline" for="show-password-signup">
          <input id="show-password-signup" type="checkbox" [(ngModel)]="showPassword" />
          Show password
        </label>

        <div class="verification-box">
          <label class="field-inline" for="human-check-signup">
            <input id="human-check-signup" type="checkbox" [(ngModel)]="humanChecked" />
            I am human
          </label>
          <p class="challenge">Solve: <strong>{{ challengeText }}</strong></p>
          <input type="number" [(ngModel)]="humanAnswer" placeholder="Enter answer" />
          <button type="button" class="btn-secondary" (click)="refreshChallenge()">New Challenge</button>
        </div>

        <button class="btn" (click)="signup()" [disabled]="loading || !username || !password">
          {{ loading ? 'Creating account...' : 'Signup' }}
        </button>

        <p class="hint">
          Your account is stored in Auth Service database: <strong>MySQL -> judge.users</strong>.
          Login supports <strong>username or email</strong>.
        </p>
        <p class="success" *ngIf="success">{{ success }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p class="hint">Already have an account? <a routerLink="/login">Login</a></p>
      </section>
    </div>
  `
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  showPassword = false;
  humanChecked = false;
  humanAnswer = '';
  challengeText = '';
  private expectedAnswer = 0;
  success = '';
  error = '';
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly router: Router
  ) {
    this.generateChallenge();
  }

  private generateChallenge(): void {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    this.expectedAnswer = a + b;
    this.challengeText = `${a} + ${b}`;
    this.humanAnswer = '';
    this.humanChecked = false;
  }

  refreshChallenge(): void {
    this.generateChallenge();
  }

  private isHumanVerified(): boolean {
    return this.humanChecked && Number(this.humanAnswer) === this.expectedAnswer;
  }

  signup(): void {
    if (!this.isHumanVerified()) {
      this.error = 'Please complete human verification';
      return;
    }

    this.loading = true;
    this.success = '';
    this.error = '';
    this.auth.signup({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: (message: string) => {
        this.loading = false;
        if (
          message.includes('already exists') ||
          message.includes('required')
        ) {
          this.error = message;
          return;
        }
        this.success = message || 'Signup successful!';
        setTimeout(
          () => this.router.navigate(['/login'], { queryParams: { signup: 'success', username: this.username } }),
          1200
        );
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const backendText =
          typeof err.error === 'string'
            ? err.error
            : (err.error?.message as string | undefined) ||
              (err.error?.error as string | undefined);

        if (backendText) {
          this.error = backendText;
        } else if (err.status === 0) {
          this.error = `Cannot reach server at ${this.api.getBaseUrl()}. Ensure API gateway is reachable from this browser host.`;
        } else if (err.status >= 500) {
          this.error = 'Server error during signup. Try a different username/email and retry.';
        } else {
          this.error = 'Signup failed. Please check details and try again.';
        }
        this.generateChallenge();
      }
    });
  }
}
