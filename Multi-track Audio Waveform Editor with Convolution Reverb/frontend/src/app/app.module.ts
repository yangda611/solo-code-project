import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { WaveformEditorComponent } from './waveform-editor/waveform-editor.component';
import { AudioService } from './audio.service';

@NgModule({
  declarations: [
    AppComponent,
    WaveformEditorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [AudioService],
  bootstrap: [AppComponent]
})
export class AppModule { }