import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ProblemListComponent } from './components/problem-list/problem-list.component';
import { ProblemDetailComponent } from './components/problem-detail/problem-detail.component';
import { SubmissionComponent } from './components/submission/submission.component';
import { ResultComponent } from './components/result/result.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [GuestGuard] },
  { path: 'problems', component: ProblemListComponent, canActivate: [AuthGuard] },
  { path: 'problems/:id', component: ProblemDetailComponent, canActivate: [AuthGuard] },
  { path: 'submit/:id', component: SubmissionComponent, canActivate: [AuthGuard] },
  { path: 'result/:id', component: ResultComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
