import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-form-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-screen.component.html',
  styleUrls: ['./form-screen.component.css'],
})
export class FormScreenComponent {
  state = inject(StateService);
  get meta() { return this.state.formMeta(); }
  get groups() { return this.state.formGroups(); }

  onPrev() { this.state.gotoDate(this.state.addDays(this.state.selectedDate(), -1)); }
  onNext() { if (!this.meta.isToday) this.state.gotoDate(this.state.addDays(this.state.selectedDate(), 1)); }
  onDateChange(e: Event) { const v = (e.target as HTMLInputElement).value; if (v) this.state.gotoDate(v); }
}
