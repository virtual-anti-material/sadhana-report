import { Injectable, inject } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private fb = inject(FirebaseService);

  get auth() { return this.fb.auth; }

  onAuthStateChanged(cb: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(this.auth, cb);
  }

  async signup(email: string, displayName: string, password: string): Promise<FirebaseUser> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    return cred.user;
  }

  async login(email: string, password: string): Promise<FirebaseUser> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async resendVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) await sendEmailVerification(user);
  }

  async reloadUser(): Promise<FirebaseUser | null> {
    const user = this.auth.currentUser;
    if (user) await user.reload();
    return this.auth.currentUser;
  }
}
