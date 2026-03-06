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
  error = '';
  loading = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  login(): void {
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
      }
    });
  }
}
