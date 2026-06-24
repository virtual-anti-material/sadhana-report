import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.css'],
})
export class LoginScreenComponent {
  state = inject(StateService);
  email    = signal('');
  password = signal('');
  showPw   = signal(false);

  onEmail(e: Event)    { this.email.set((e.target as HTMLInputElement).value); }
  onPassword(e: Event) { this.password.set((e.target as HTMLInputElement).value); }
  onKey(e: KeyboardEvent) { if (e.key === 'Enter') this.submit(); }
  togglePw() { this.showPw.update(v => !v); }

  goToSignup() { this.state.authError.set(''); this.state.screen.set('signup'); }

  async submit() {
    await this.state.login(this.email(), this.password());
  }

  async loginWithGoogle() {
    await this.state.loginWithGoogle();
  }
}
