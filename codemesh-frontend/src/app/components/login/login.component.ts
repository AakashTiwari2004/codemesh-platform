import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  humanChecked = false;
  humanAnswer = '';
  challengeText = '';
  private expectedAnswer = 0;
  error = '';
  loading = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {
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

  login(): void {
    if (!this.isHumanVerified()) {
      this.error = 'Please complete human verification';
      return;
    }

    this.error = '';
    this.loading = true;
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/problems']);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = err instanceof Error ? err.message : 'Invalid credentials';
        this.generateChallenge();
      }
    });
  }
}
