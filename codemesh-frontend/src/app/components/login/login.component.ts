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

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  login(): void {
    this.error = '';
    this.api.login({ username: this.username, password: this.password }).subscribe({
      next: (token: string) => {
        localStorage.setItem('token', token);
        this.router.navigate(['/problems']);
      },
      error: () => {
        this.error = 'Invalid credentials';
      }
    });
  }
}
