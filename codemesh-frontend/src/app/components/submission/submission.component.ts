import { Component, OnInit } from '@angular/core';
import { ApiService, Problem } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-submission',
  template: `
    <div class="container">
      <div class="card">
        <h2>Submit Solution</h2>
        <p>Problem ID: {{ problemId }}</p>
        <p *ngIf="problem"><strong>{{ problem.title }}</strong> <span class="pill">{{ problem.difficulty || 'Easy' }}</span></p>
        <p class="hint" *ngIf="problem?.motive">{{ problem?.motive }}</p>
        <p class="hint">Judge currently supports Java. Submit full <code>Main</code> class.</p>

        <label for="language">Language</label>
        <select id="language" [(ngModel)]="language">
          <option value="java">Java</option>
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
export class SubmissionComponent implements OnInit {
  code = '';
  language = 'java';
  error = '';
  loading = false;
  problemId = 0;
  problem: Problem | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.problemId = Number.isNaN(id) ? 0 : id;
  }

  ngOnInit(): void {
    if (this.problemId <= 0) {
      return;
    }

    this.api.getProblemById(this.problemId).subscribe({
      next: (problem) => {
        this.problem = problem;
        if (!this.code && problem.starterCode) {
          this.code = problem.starterCode;
        }
      },
      error: () => {
        this.error = 'Unable to load problem details';
      }
    });
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
