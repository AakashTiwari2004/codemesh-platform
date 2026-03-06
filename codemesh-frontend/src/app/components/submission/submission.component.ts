import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-submission',
  template: ''
})
export class SubmissionComponent {
  code = '';
  language = 'java';

  constructor(private readonly api: ApiService) {}

  submit(): void {
    const token = localStorage.getItem('token') ?? undefined;
    this.api.submitSolution({ code: this.code, language: this.language }, token).subscribe();
  }
}
