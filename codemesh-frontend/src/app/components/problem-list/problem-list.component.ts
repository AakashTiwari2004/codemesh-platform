import { Component, OnInit } from '@angular/core';
import { ApiService, Problem } from '../../services/api.service';

@Component({
  selector: 'app-problem-list',
  template: `
    <div class="container">
      <div class="card">
        <h2>Problem Set</h2>
        <p class="hint">Pick a challenge and submit your solution.</p>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p *ngIf="!error && !problems.length">No problems found.</p>
      </div>

      <div class="card" *ngFor="let problem of problems">
        <h3>{{ problem.title }}</h3>
        <p>{{ problem.description }}</p>
        <a class="btn-secondary" [routerLink]="['/problems', problem.id]">Open Problem</a>
      </div>
    </div>
  `
})
export class ProblemListComponent implements OnInit {
  problems: Problem[] = [];
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.getProblems().subscribe({
      next: (data) => {
        this.problems = data;
      },
      error: () => {
        this.error = 'Unable to load problems';
      }
    });
  }
}
