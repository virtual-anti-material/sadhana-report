import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-progress-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-screen.component.html',
  styleUrls: ['./progress-screen.component.css'],
})
export class ProgressScreenComponent {
  state = inject(StateService);
  get charts() { return this.state.charts(); }
}
