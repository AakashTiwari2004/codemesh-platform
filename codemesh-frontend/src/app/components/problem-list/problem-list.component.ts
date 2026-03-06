import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-problem-list',
  template: ''
})
export class ProblemListComponent implements OnInit {
  problems: unknown[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token') ?? undefined;
    this.api.getProblems(token).subscribe((data) => {
      this.problems = data;
    });
  }
}
