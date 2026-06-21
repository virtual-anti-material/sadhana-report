import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, Entry } from '../models/sadhana.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  async getUsers(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(`${this.base}/users`));
  }

  async upsertUser(user: User): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/users`, user));
  }

  async getEntries(name?: string): Promise<Entry[]> {
    const url = name ? `${this.base}/entries?name=${encodeURIComponent(name)}` : `${this.base}/entries`;
    return firstValueFrom(this.http.get<Entry[]>(url));
  }

  async upsertEntry(entry: Entry): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/entries`, entry));
  }
}
