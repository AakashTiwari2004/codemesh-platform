import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Submission } from '../../services/api.service';

@Component({
  selector: 'app-result',
  template: `
    <div class="container">
      <div class="card" *ngIf="submission; else loadingOrError">
        <h2>Submission Result</h2>
        <p><strong>ID:</strong> {{ submission.id }}</p>
        <p><strong>Status:</strong> {{ submission.status }}</p>
        <p><strong>Language:</strong> {{ submission.language }}</p>

        <h3>Output</h3>
        <pre>{{ submission.output || 'No output' }}</pre>

        <h3>Code</h3>
        <pre>{{ submission.code }}</pre>
      </div>

      <ng-template #loadingOrError>
        <div class="card">
          <p class="error" *ngIf="error">{{ error }}</p>
          <p *ngIf="!error">Loading result...</p>
        </div>
      </ng-template>
    </div>
  `
})
export class ResultComponent {
  submission: Submission | null = null;
  error = '';

  constructor(private readonly route: ActivatedRoute, private readonly api: ApiService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id) || id <= 0) {
      this.error = 'Invalid submission id';
      return;
    }

    this.api.getSubmissionById(id).subscribe({
      next: (result) => {
        this.submission = result;
      },
      error: () => {
        this.error = 'Unable to load submission result';
      }
    });
  }
}
