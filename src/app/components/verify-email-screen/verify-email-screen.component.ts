import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-verify-email-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email-screen.component.html',
  styleUrls: ['./verify-email-screen.component.css'],
})
export class VerifyEmailScreenComponent {
  state       = inject(StateService);
  sent        = signal(false);
  checking    = signal(false);

  async resend() {
    await this.state.resendVerification();
    this.sent.set(true);
  }

  async checkVerified() {
    this.checking.set(true);
    await this.state.checkEmailVerified();
    this.checking.set(false);
  }
}
