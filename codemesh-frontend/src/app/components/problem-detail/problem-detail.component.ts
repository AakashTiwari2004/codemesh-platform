import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-problem-detail',
  template: ''
})
export class ProblemDetailComponent {
  problem: unknown;

  constructor(private readonly api: ApiService) {}

  loadProblem(id: number): void {
    const token = localStorage.getItem('token') ?? undefined;
    this.api.getProblemById(id, token).subscribe((data) => {
      this.problem = data;
    });
  }
}
