import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  login(): void {
    this.error = '';
    this.loading = true;
    this.api.login({ username: this.username, password: this.password }).subscribe({
      next: (response: string) => {
        this.loading = false;
        if (response.includes('Invalid credentials!')) {
          this.error = 'Invalid credentials';
          return;
        }
        localStorage.setItem('token', response);
        this.router.navigate(['/problems']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Invalid credentials';
      }
    });
  }
}
