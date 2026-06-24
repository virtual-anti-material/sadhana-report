import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp = initializeApp(environment.firebase);
  readonly auth: Auth       = getAuth(this.app);
  readonly db: Firestore    = getFirestore(this.app);
}
