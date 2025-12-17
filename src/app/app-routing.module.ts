import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuzzleComponent } from './puzzle/puzzle.component';
import { SimplePuzzleComponent } from './simple-puzzle/simple-puzzle.component';

const routes: Routes = [
  { path: '', component: PuzzleComponent },
  { path: 'simple', component: SimplePuzzleComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
