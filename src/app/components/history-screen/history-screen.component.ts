import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-history-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-screen.component.html',
  styleUrls: ['./history-screen.component.css'],
})
export class HistoryScreenComponent {
  state = inject(StateService);
  get prog() { return this.state.prog(); }
}
