import { Component, OnInit } from '@angular/core';
import { ApiService, Problem } from '../../services/api.service';

@Component({
  selector: 'app-problem-list',
  template: `
    <div class="container">
      <div class="card">
        <h2>Problems</h2>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p *ngIf="!error && !problems.length">No problems found.</p>
      </div>

      <div class="card" *ngFor="let problem of problems">
        <h3>{{ problem.title }}</h3>
        <p>{{ problem.description }}</p>
        <a [routerLink]="['/problems', problem.id]">Open Problem</a>
      </div>
    </div>
  `
})
export class ProblemListComponent implements OnInit {
  problems: Problem[] = [];
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token') ?? undefined;
    this.api.getProblems(token).subscribe({
      next: (data) => {
        this.problems = data;
      },
      error: () => {
        this.error = 'Unable to load problems';
      }
    });
  }
}
