import { Injectable, inject } from '@angular/core';
import {
  collection, doc, getDocs, setDoc, query, where,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { User, Entry } from '../models/sadhana.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private fb = inject(FirebaseService);
  private get db() { return this.fb.db; }

  async getUsers(): Promise<User[]> {
    const snap = await getDocs(collection(this.db, 'users'));
    return snap.docs.map(d => d.data() as User);
  }

  async upsertUser(user: User): Promise<void> {
    await setDoc(doc(this.db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: user.name,
      type: user.type,
    });
  }

  async getEntries(uid?: string): Promise<Entry[]> {
    const col = collection(this.db, 'entries');
    const q = uid ? query(col, where('userId', '==', uid)) : col;
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Entry);
  }

  async upsertEntry(entry: Entry): Promise<void> {
    const id = `${entry.userId}_${entry.date}`;
    await setDoc(doc(this.db, 'entries', id), entry);
  }
}
