import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-name-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './name-screen.component.html',
  styleUrls: ['./name-screen.component.css'],
})
export class NameScreenComponent {
  state = inject(StateService);
  nameInput = signal('');
  showSug = signal(false);

  get suggestions() {
    const q = this.state.norm(this.nameInput()).toLowerCase();
    if (q.length < 2) return [];
    return this.state.users()
      .filter(u => this.state.norm(u.name).toLowerCase().includes(q))
      .slice(0, 6)
      .map(u => ({
        name: u.name,
        initial: this.state.initial(u.name),
        onPick: () => { this.nameInput.set(u.name); this.showSug.set(false); },
      }));
  }

  get canShowSug() { return this.showSug() && this.suggestions.length > 0; }

  onInput(e: Event) { this.nameInput.set((e.target as HTMLInputElement).value); this.showSug.set(true); }
  onFocus() { this.showSug.set(true); }
  onBlur() { setTimeout(() => this.showSug.set(false), 150); }
  onKey(e: KeyboardEvent) { if (e.key === 'Enter') this.continue(); }
  continue() { this.state.continueName(this.nameInput()); }
}
