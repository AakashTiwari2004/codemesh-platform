import { Component } from '@angular/core';
import { ApiService, Problem } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-problem-detail',
  template: `
    <div class="container">
      <div class="card" *ngIf="problem; else loadingOrError">
        <h2>{{ problem.title }}</h2>
        <p>{{ problem.description }}</p>
        <button class="btn" (click)="goToSubmit()">Solve This Problem</button>
      </div>
      <ng-template #loadingOrError>
        <div class="card">
          <p class="error" *ngIf="error">{{ error }}</p>
          <p *ngIf="!error">Loading problem...</p>
        </div>
      </ng-template>
    </div>
  `
})
export class ProblemDetailComponent {
  problem: Problem | null = null;
  error = '';
  problemId = 0;

  constructor(private readonly api: ApiService, private readonly route: ActivatedRoute, private readonly router: Router) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.problemId = Number.isNaN(id) ? 0 : id;
    if (this.problemId > 0) {
      this.loadProblem(this.problemId);
    } else {
      this.error = 'Invalid problem id';
    }
  }

  loadProblem(id: number): void {
    this.api.getProblemById(id).subscribe({
      next: (data) => {
        this.problem = data;
      },
      error: () => {
        this.error = 'Unable to load problem';
      }
    });
  }

  goToSubmit(): void {
    if (this.problemId > 0) {
      this.router.navigate(['/submit', this.problemId]);
    }
  }
}
