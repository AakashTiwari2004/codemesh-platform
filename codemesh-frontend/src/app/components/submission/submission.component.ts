import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-submission',
  template: `
    <div class="container">
      <div class="card">
        <h2>Submit Solution</h2>
        <p>Problem ID: {{ problemId }}</p>

        <label for="language">Language</label>
        <select id="language" [(ngModel)]="language">
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>

        <label for="code">Code</label>
        <textarea id="code" [(ngModel)]="code" placeholder="Write your solution here..."></textarea>

        <button class="btn" (click)="submit()" [disabled]="loading || !code || problemId <= 0">
          {{ loading ? 'Submitting...' : 'Submit' }}
        </button>

        <p class="error" *ngIf="error">{{ error }}</p>
      </div>
    </div>
  `
})
export class SubmissionComponent {
  code = '';
  language = 'java';
  error = '';
  loading = false;
  problemId = 0;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.problemId = Number.isNaN(id) ? 0 : id;
  }

  submit(): void {
    if (this.problemId <= 0) {
      this.error = 'Invalid problem id';
      return;
    }

    this.loading = true;
    this.error = '';
    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      this.loading = false;
      this.error = 'Session expired. Please login again.';
      this.router.navigate(['/login']);
      return;
    }

    this.api
      .submitSolution(
        { userId, problemId: this.problemId, code: this.code, language: this.language }
      )
      .subscribe({
        next: (submission) => {
          this.loading = false;
          this.router.navigate(['/result', submission.id]);
        },
        error: () => {
          this.loading = false;
          this.error = 'Submission failed';
        }
      });
  }
}
