import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-forgot-password-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forgot-password-screen.component.html',
  styleUrls: ['./forgot-password-screen.component.css'],
})
export class ForgotPasswordScreenComponent {
  state = inject(StateService);
  email = signal('');
  sent  = signal(false);

  onEmail(e: Event) { this.email.set((e.target as HTMLInputElement).value); }
  onKey(e: KeyboardEvent) { if (e.key === 'Enter') this.submit(); }

  goToLogin() { this.state.authError.set(''); this.state.screen.set('login'); }

  async submit() {
    const ok = await this.state.resetPassword(this.email());
    if (ok) this.sent.set(true);
  }
}
