import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { PcbCanvasComponent } from './components/pcb-canvas/pcb-canvas.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ProblemListComponent } from './components/problem-list/problem-list.component';
import { PresetSelectorComponent } from './components/preset-selector/preset-selector.component';

import { PcbDataService } from './services/pcb-data.service';
import { AnimationService } from './services/animation.service';
import { PresetService } from './services/preset.service';

@NgModule({
  declarations: [
    AppComponent,
    PcbCanvasComponent,
    ToolbarComponent,
    ProblemListComponent,
    PresetSelectorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    PcbDataService,
    AnimationService,
    PresetService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
