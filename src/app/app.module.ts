import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PuzzleComponent } from './puzzle/puzzle.component';
import { SimplePuzzleComponent } from './simple-puzzle/simple-puzzle.component';

@NgModule({
  declarations: [
    AppComponent,
    PuzzleComponent,
    SimplePuzzleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
