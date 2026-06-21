import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from './services/state.service';
import { NameScreenComponent } from './components/name-screen/name-screen.component';
import { FormScreenComponent } from './components/form-screen/form-screen.component';
import { HistoryScreenComponent } from './components/history-screen/history-screen.component';
import { ProgressScreenComponent } from './components/progress-screen/progress-screen.component';
import { AdminScreenComponent } from './components/admin-screen/admin-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NameScreenComponent,
    FormScreenComponent,
    HistoryScreenComponent,
    ProgressScreenComponent,
    AdminScreenComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  state = inject(StateService);

  ngOnInit() { this.state.init(); }

  navColor(tab: string) { return this.state.screen() === tab ? '#2f6b4f' : '#a89a89'; }
}
