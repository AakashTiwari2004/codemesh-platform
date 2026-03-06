import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-signup',
  template: ''
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';

  constructor(private readonly api: ApiService) {}

  signup(): void {
    this.api.signup({ username: this.username, email: this.email, password: this.password }).subscribe();
  }
}
