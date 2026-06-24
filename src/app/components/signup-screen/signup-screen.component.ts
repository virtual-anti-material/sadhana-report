import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-signup-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signup-screen.component.html',
  styleUrls: ['./signup-screen.component.css'],
})
export class SignupScreenComponent {
  state       = inject(StateService);
  email       = signal('');
  displayName = signal('');
  password    = signal('');
  confirm     = signal('');
  showPw      = signal(false);
  localError  = signal('');

  onEmail(e: Event)       { this.email.set((e.target as HTMLInputElement).value); }
  onDisplayName(e: Event) { this.displayName.set((e.target as HTMLInputElement).value); }
  onPassword(e: Event)    { this.password.set((e.target as HTMLInputElement).value); }
  onConfirm(e: Event)     { this.confirm.set((e.target as HTMLInputElement).value); }
  togglePw() { this.showPw.update(v => !v); }

  goToLogin() { this.localError.set(''); this.state.authError.set(''); this.state.screen.set('login'); }

  async submit() {
    this.localError.set('');
    if (!this.email() || !this.displayName() || !this.password()) {
      this.localError.set('Please fill in all fields.');
      return;
    }
    if (this.password() !== this.confirm()) {
      this.localError.set('Passwords do not match.');
      return;
    }
    if (this.password().length < 6) {
      this.localError.set('Password must be at least 6 characters.');
      return;
    }
    await this.state.signup(this.email(), this.displayName().trim(), this.password());
  }
}
