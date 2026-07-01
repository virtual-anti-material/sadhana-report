import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  Screen, User, Entry, EntryForm,
  FIELD_KEYS, REQUIRED_KEYS, FIELD_META, GROUPS,
  CalCell, DetailData, ProgressData, ChartsData, MemberCard, FormGroup, FormField,
} from '../models/sadhana.models';

@Injectable({ providedIn: 'root' })
export class StateService {
  private api  = inject(ApiService);
  private auth = inject(AuthService);

  // ── raw state ────────────────────────────────────────────────────────────
  screen       = signal<Screen>('login');
  currentUser  = signal<User | null>(null);
  users        = signal<User[]>([]);
  entries      = signal<Entry[]>([]);
  selectedDate = signal<string>('');
  form         = signal<EntryForm>(this.blankForm());
  errors       = signal<string[]>([]);
  openTime     = signal<string | null>(null);
  saved        = signal<boolean>(false);
  calMonth     = signal<string>('');
  calSel       = signal<string>('');
  chartMonth   = signal<string>('');
  admTarget    = signal<string | null>(null);
  admMonth     = signal<string>('');
  admSel       = signal<string>('');
  loading      = signal<boolean>(false);
  authError    = signal<string>('');
  pendingEmail = signal<string>('');
  private _savedTimer: ReturnType<typeof setTimeout> | null = null;

  // ── helpers ──────────────────────────────────────────────────────────────
  todayStr() { return this.iso(new Date()); }
  iso(d: Date) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  parse(s: string) { const p = (s || this.todayStr()).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  addDays(s: string, n: number) { const d = this.parse(s); d.setDate(d.getDate() + n); return this.iso(d); }
  firstOfMonth(ds: string) { const d = this.parse(ds); return this.iso(new Date(d.getFullYear(), d.getMonth(), 1)); }
  addMonths(anchor: string, n: number) { const d = this.parse(anchor); return this.iso(new Date(d.getFullYear(), d.getMonth() + n, 1)); }
  num(v: string | undefined) { const n = parseFloat(v ?? ''); return isNaN(n) ? 0 : n; }
  norm(s: string | undefined) { return (s == null ? '' : String(s)).trim().replace(/\s+/g, ' '); }
  sameName(a: string, b: string) { return this.norm(a).toLowerCase() === this.norm(b).toLowerCase(); }
  entryKey(userId: string, date: string) { return userId + '|' + date; }
  hue(s: string) { s = this.norm(s); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  blankForm(): EntryForm { const o: EntryForm = {}; FIELD_KEYS.forEach(k => o[k] = ''); return o; }
  findEntry(name: string, date: string) { return this.entries().find(e => this.sameName(e.name, name) && e.date === date) ?? null; }
  entryToForm(name: string, date: string): EntryForm {
    const o = this.blankForm();
    const e = this.findEntry(name, date);
    if (e) FIELD_KEYS.forEach(k => { o[k] = e[k] ?? ''; });
    return o;
  }
  disp(v: string | undefined, m: { unit?: string; isChips?: boolean }) {
    if (v == null || String(v).trim() === '') return '—';
    if (m.isChips) return v.split('|').filter(Boolean).join(', ') || '—';
    let out = String(v);
    if (m.unit) out += ' ' + m.unit;
    return out;
  }
  practiceOf(e: Entry) { return this.num(e.hearingDuration) + this.num(e.readingDuration) + this.num(e.serviceDuration); }
  avatar(name: string) { const h = this.hue(name); return `background:hsl(${h} 42% 92%);color:hsl(${h} 38% 36%)`; }
  initial(name: string) { return (this.norm(name) || '?').charAt(0).toUpperCase(); }
  relative(ds: string) {
    const today = this.todayStr();
    if (ds === today) return 'Today';
    if (ds === this.addDays(today, -1)) return 'Yesterday';
    if (ds === this.addDays(today, 1)) return 'Tomorrow';
    return '';
  }

  private authErrorMsg(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':    return 'This email is already registered. Try signing in.';
      case 'auth/invalid-email':           return 'Please enter a valid email address.';
      case 'auth/weak-password':           return 'Password must be at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':      return 'Incorrect email or password.';
      case 'auth/too-many-requests':       return 'Too many attempts. Please try again later.';
      case 'auth/user-disabled':           return 'This account has been disabled.';
      default:                             return 'Something went wrong. Please try again.';
    }
  }

  // ── init ─────────────────────────────────────────────────────────────────
  init() {
    this.auth.onAuthStateChanged(async (fbUser) => {
      if (!fbUser) {
        this.currentUser.set(null);
        this.users.set([]);
        this.entries.set([]);
        this.screen.set('login');
        return;
      }
      if (!fbUser.emailVerified) {
        this.pendingEmail.set(fbUser.email ?? '');
        this.screen.set('verify-email');
        return;
      }
      await this._loadSession(fbUser.uid, fbUser.displayName ?? '', fbUser.email ?? '');
    });
  }

  private async _loadSession(uid: string, displayName: string, email: string) {
    this.loading.set(true);
    const today = this.todayStr();
    const month = this.firstOfMonth(today);

    // Start with auth data; Firestore may enrich it (e.g. admin type)
    let u: User = { uid, name: displayName, email, type: 0 };

    try {
      const users = await this.api.getUsers();
      this.users.set(users);
      const found = users.find(x => x.uid === uid);
      if (found) {
        u = found;
      } else {
        try { await this.api.upsertUser(u); } catch { /* offline */ }
        this.users.set([...users, u]);
      }
    } catch (e) {
      console.error('Could not load users from Firestore', e);
      this.users.set([u]);
    }

    this.currentUser.set(u);
    this.selectedDate.set(today);
    this.calMonth.set(month); this.calSel.set(today); this.chartMonth.set(month);
    this.errors.set([]); this.openTime.set(null); this.authError.set('');

    try {
      const entriesToLoad = await this.api.getEntries(u.type === 1 ? undefined : uid);
      this.entries.set(entriesToLoad);
    } catch (e: any) {
      console.error('[Firestore] getEntries failed:', e?.code, e?.message);
      if (e?.code === 'permission-denied') {
        this.authError.set('Could not load your entries — Firestore rules may need updating. Check the console.');
      }
    }

    this.form.set(this.entryToForm(u.name, today));
    this.screen.set('form');   // always navigate — auth is the gate, not Firestore
    this.loading.set(false);
  }

  // ── auth actions ─────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    if (!email || !password) { this.authError.set('Please enter your email and password.'); return; }
    this.authError.set('');
    this.loading.set(true);
    try {
      const fbUser = await this.auth.login(email, password);
      if (!fbUser.emailVerified) {
        this.pendingEmail.set(fbUser.email ?? '');
        this.screen.set('verify-email');
      }
      // onAuthStateChanged handles the verified case
    } catch (e: any) {
      this.authError.set(this.authErrorMsg(e?.code));
    } finally {
      this.loading.set(false);
    }
  }

  async signup(email: string, displayName: string, password: string) {
    this.authError.set('');
    this.loading.set(true);
    try {
      const fbUser = await this.auth.signup(email, displayName, password);
      this.pendingEmail.set(fbUser.email ?? '');
      this.screen.set('verify-email');
    } catch (e: any) {
      this.authError.set(this.authErrorMsg(e?.code));
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithGoogle() {
    this.authError.set('');
    this.loading.set(true);
    try {
      await this.auth.loginWithGoogle();
      // onAuthStateChanged handles _loadSession; Google accounts are always email-verified
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        this.authError.set(this.authErrorMsg(e?.code));
      }
    } finally {
      this.loading.set(false);
    }
  }

  async logout() {
    await this.auth.logout();
    this.admTarget.set(null);
    // onAuthStateChanged resets screen to 'login'
  }

  async resendVerification() {
    this.authError.set('');
    try {
      await this.auth.resendVerification();
    } catch (e: any) {
      this.authError.set(this.authErrorMsg(e?.code));
    }
  }

  async checkEmailVerified() {
    this.authError.set('');
    try {
      const fbUser = await this.auth.reloadUser();
      if (fbUser?.emailVerified) {
        await this._loadSession(fbUser.uid, fbUser.displayName ?? '', fbUser.email ?? '');
      } else {
        this.authError.set('Email not verified yet. Please click the link in your inbox.');
      }
    } catch (e: any) {
      this.authError.set(this.authErrorMsg(e?.code));
    }
  }

  // ── form screen ───────────────────────────────────────────────────────────
  gotoDate(date: string) {
    const u = this.currentUser();
    if (!u) return;
    this.selectedDate.set(date);
    this.form.set(this.entryToForm(u.name, date));
    this.errors.set([]); this.openTime.set(null);
  }

  gotoDateForm(date: string) {
    this.screen.set('form');
    this.gotoDate(date);
  }

  onFieldChange(key: string, value: string) {
    this.form.update(f => ({ ...f, [key]: value }));
    this.errors.update(e => e.filter(k => k !== key));
  }

  setOpenTime(key: string | null) { this.openTime.set(key); }

  async save() {
    const u = this.currentUser();
    const date = this.selectedDate();
    const f = this.form();
    if (!u) return;
    const missing = REQUIRED_KEYS.filter(k => !String(f[k] ?? '').trim());
    if (missing.length) { this.errors.set([...missing]); return; }

    const entry: Entry = { name: u.name, userId: u.uid, date, ...f } as Entry;
    const k = this.entryKey(u.uid, date);
    const filtered = this.entries().filter(e => this.entryKey(e.userId, e.date) !== k);
    filtered.push(entry);
    this.entries.set(filtered);
    this.errors.set([]);
    this.saved.set(true);
    if (this._savedTimer) clearTimeout(this._savedTimer);
    this._savedTimer = setTimeout(() => this.saved.set(false), 1800);

    try {
      await this.api.upsertEntry(entry);
    } catch (e: any) {
      console.error('[Firestore] upsertEntry failed:', e?.code, e?.message, e);
    }
  }

  // ── calendar helpers ──────────────────────────────────────────────────────
  cellStyle(c: { blank: boolean; isSelected?: boolean; has?: boolean; isFuture?: boolean; isToday?: boolean }) {
    if (c.blank) return 'visibility:hidden';
    let bg = 'transparent', col = '#45514a', bd = '2px solid transparent', fw = '500';
    if (c.isSelected) { bg = '#2f6b4f'; col = '#fff'; fw = '700'; }
    else if (c.has) { bg = '#e2efe8'; col = '#23533a'; fw = '700'; }
    else if (c.isFuture) { col = '#c2cec6'; }
    if (c.isToday && !c.isSelected) bd = '2px solid #c2a15a';
    const cursor = c.isFuture ? 'default' : 'pointer';
    return `aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:11px;font-size:15px;font-weight:${fw};background:${bg};color:${col};border:${bd};cursor:${cursor}`;
  }

  calcCells(name: string, anchor: string, sel: string) {
    const today = this.todayStr();
    const a = this.parse(anchor); const y = a.getFullYear(), mo = a.getMonth();
    const firstW = new Date(y, mo, 1).getDay();
    const dim = new Date(y, mo + 1, 0).getDate();
    const cells: CalCell[] = []; let daysLogged = 0, totalRounds = 0;
    for (let i = 0; i < firstW; i++) cells.push({ blank: true });
    for (let dd = 1; dd <= dim; dd++) {
      const ds = this.iso(new Date(y, mo, dd));
      const e = this.findEntry(name, ds);
      const has = !!e; if (has) { daysLogged++; totalRounds += this.num(e!.rounds); }
      cells.push({ blank: false, day: dd, ds, has, isToday: ds === today, isFuture: ds > today, isSelected: ds === sel });
    }
    const a2 = this.parse(anchor);
    const monthLabel = a2.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { cells, daysLogged, totalRounds, avg: daysLogged ? Math.round(totalRounds / daysLogged) : 0, monthLabel };
  }

  detailFor(name: string, ds: string, editable: boolean, onEdit: (() => void) | null): DetailData {
    const e = this.findEntry(name, ds);
    const dt = this.parse(ds);
    const rel = this.relative(ds);
    return {
      exists: !!e,
      notExists: !e,
      weekday: dt.toLocaleDateString('en-US', { weekday: 'long' }),
      dateMain: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      relative: rel, hasRelative: !!rel,
      rows: e ? FIELD_KEYS.map(k => ({ label: FIELD_META[k].label, value: this.disp(e[k], FIELD_META[k]) })) : [],
      canEdit: editable && !!e,
      canAdd: editable && !e,
      emptyText: editable ? 'No entry yet for this day.' : 'No entry recorded for this day.',
      onEdit,
    };
  }

  buildProgress(name: string, anchor: string, sel: string, opts: {
    editable: boolean;
    setMonth: (m: string) => void;
    setSel: (ds: string) => void;
  }): ProgressData {
    const cur = this.firstOfMonth(this.todayStr());
    const cc = this.calcCells(name, anchor, sel);
    const cells: CalCell[] = cc.cells.map(c => ({
      blank: !!c.blank,
      label: c.blank ? '' : c.day,
      style: this.cellStyle(c),
      onClick: c.blank || c.isFuture ? null : () => opts.setSel(c.ds!),
    }));
    const canNext = anchor < cur;
    const detail = this.detailFor(name, sel, opts.editable, opts.editable ? () => this.gotoDateForm(sel) : null);
    return {
      monthLabel: cc.monthLabel,
      weekdays: ['S','M','T','W','T','F','S'],
      cells,
      statCards: [
        { value: cc.daysLogged, label: 'days logged' },
        { value: cc.totalRounds, label: 'rounds' },
        { value: cc.avg, label: 'avg / day' },
      ],
      onPrev: () => opts.setMonth(this.addMonths(anchor, -1)),
      onNext: canNext ? () => opts.setMonth(this.addMonths(anchor, 1)) : null,
      nextStyle: `width:40px;height:40px;border-radius:11px;border:1px solid #d9e3dc;background:#f8fbf8;font-size:20px;color:#28302b;flex:0 0 auto;${canNext ? 'cursor:pointer' : 'opacity:.35;cursor:not-allowed'}`,
      detail,
    };
  }

  buildCharts(name: string, anchor: string, setMonth: (m: string) => void): ChartsData {
    const a = this.parse(anchor); const y = a.getFullYear(), mo = a.getMonth();
    const dim = new Date(y, mo + 1, 0).getDate();
    const today = this.todayStr();
    const metrics = [
      { key: 'rounds',          title: 'Chanting', unit: 'rounds', color: '#2f6b4f' },
      { key: 'hearingDuration', title: 'Hearing',  unit: 'min',    color: '#5b9e7a' },
      { key: 'readingDuration', title: 'Reading',  unit: 'min',    color: '#93a857' },
      { key: 'serviceDuration', title: 'Service',  unit: 'min',    color: '#5d97a6' },
    ];
    const days = Array.from({ length: dim }, (_, i) => {
      const ds = this.iso(new Date(y, mo, i + 1));
      return { ds, dd: i + 1, e: this.findEntry(name, ds), isToday: ds === today };
    });
    const cur = this.firstOfMonth(today); const canNext = anchor < cur;
    const list = metrics.map(m => {
      const vals = days.map(x => ({ v: x.e ? this.num(x.e[m.key]) : 0, dd: x.dd }));
      const max = Math.max(1, ...vals.map(x => x.v));
      const total = vals.reduce((acc, x) => acc + x.v, 0);
      const logged = vals.filter(x => x.v > 0).length;
      const avg = logged ? Math.round(total / logged) : 0;
      const unitStr = m.unit === 'min' ? ' min' : ' ' + m.unit;
      const bars = vals.map(x => ({
        h: Math.round(x.v / max * 100),
        title: 'Day ' + x.dd + ': ' + x.v + unitStr,
        barColor: x.v > 0 ? m.color : '#e2eae4',
        tick: (x.dd === 1 || x.dd % 7 === 0) ? String(x.dd) : '',
      }));
      return { title: m.title, color: m.color, total, avg, bars, caption: `Total ${total}${unitStr} · avg ${avg}/day` };
    });
    return {
      monthLabel: a.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      onPrev: () => setMonth(this.addMonths(anchor, -1)),
      onNext: canNext ? () => setMonth(this.addMonths(anchor, 1)) : null,
      nextStyle: `width:40px;height:40px;border-radius:11px;border:1px solid #d9e3dc;background:#f8fbf8;font-size:20px;color:#28302b;flex:0 0 auto;${canNext ? 'cursor:pointer' : 'opacity:.35;cursor:not-allowed'}`,
      list,
    };
  }

  // ── computed: form groups ─────────────────────────────────────────────────
  formGroups = computed<FormGroup[]>(() => {
    const f = this.form();
    const errs = this.errors();
    const openKey = this.openTime();

    return GROUPS.map(g => ({
      title: g.title,
      fields: (g.keys as readonly string[]).map(k => {
        const m = FIELD_META[k];
        const isTextarea = !!m.isTextarea;
        const isChips = !!m.isChips;
        const isSectionHeader = !!m.sectionHeader;
        const chipsMulti = !!m.chipsMulti;
        const chipOptions = m.chipOptions ?? [];
        const numeric = !!m.numeric;
        const isTime = m.inputType === 'time';
        const isError = errs.includes(k);
        const val = f[k] ?? '';
        const selectedChips = isChips && val ? val.split('|').filter(Boolean) : [];

        const base: FormField = {
          key: k,
          label: m.label,
          inputType: m.inputType || 'text',
          placeholder: m.placeholder || '',
          inputMode: numeric ? 'numeric' : 'text',
          unit: m.unit || '',
          hasUnit: !!m.unit,
          required: !!m.required,
          isTextarea,
          isTime,
          isInput: !isTextarea && !isTime && !isChips && !isSectionHeader,
          isChips,
          chipsMulti,
          chipOptions,
          selectedChips,
          isSectionHeader,
          isFullWidth: isChips || isSectionHeader || isTextarea,
          isError,
          borderColor: isError ? '#d9694e' : '#d9e3dc',
          value: val,
          onChange: (e: Event) => {
            let v = (e.target as HTMLInputElement).value;
            if (numeric) v = v.replace(/[^0-9]/g, '');
            this.onFieldChange(k, v);
          },
          onChipToggle: (chip: string) => {
            if (chipsMulti) {
              const sel = val ? val.split('|').filter(Boolean) : [];
              const idx = sel.indexOf(chip);
              if (idx >= 0) sel.splice(idx, 1); else sel.push(chip);
              this.onFieldChange(k, sel.join('|'));
            } else {
              this.onFieldChange(k, val === chip ? '' : chip);
            }
          },
        };

        if (isTime) {
          const parts = /^(\d{1,2}):(\d{2})$/.exec(val);
          const curH = parts ? parts[1].padStart(2, '0') : '';
          const curM = parts ? parts[2] : '';
          const open = openKey === k;
          const setVal = (h: string, mm: string, close: boolean) => {
            this.onFieldChange(k, h + ':' + mm);
            if (close) this.openTime.set(null);
          };
          base.timeText = val || 'Select time';
          base.pickerOpen = open;
          base.fieldStyle = `width:100%;padding:13px;border:1.5px solid ${isError ? '#d9694e' : open ? '#2f6b4f' : '#d9e3dc'};border-radius:12px;font-size:16px;background:#f8fbf8;color:${val ? '#28302b' : '#a4b1a8'};cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;user-select:none`;
          base.onToggle = () => this.openTime.update(v => v === k ? null : k);
          base.onClose = () => this.openTime.set(null);
          base.hours = Array.from({ length: 24 }, (_, i) => {
            const hh = String(i).padStart(2, '0');
            return { label: hh, style: this.pickCellStyle(hh === curH), onClick: () => setVal(hh, curM || '00', false) };
          });
          base.minutes = Array.from({ length: 12 }, (_, i) => {
            const mm = String(i * 5).padStart(2, '0');
            return { label: mm, style: this.pickCellStyle(mm === curM), onClick: () => setVal(curH || '00', mm, true) };
          });
        }
        return base;
      }),
    }));
  });

  pickCellStyle(sel: boolean) {
    return `padding:9px 0;text-align:center;border-radius:9px;font-size:15px;font-weight:600;cursor:pointer;border:1px solid ${sel ? '#2f6b4f' : 'transparent'};background:${sel ? '#2f6b4f' : 'transparent'};color:${sel ? '#fff' : '#45514a'}`;
  }

  // ── computed: progress (self) ─────────────────────────────────────────────
  prog = computed<ProgressData | null>(() => {
    const u = this.currentUser();
    if (!u) return null;
    return this.buildProgress(u.name, this.calMonth() || this.firstOfMonth(this.todayStr()), this.calSel() || this.todayStr(), {
      editable: true,
      setMonth: m => this.calMonth.set(m),
      setSel: ds => this.calSel.set(ds),
    });
  });

  charts = computed<ChartsData | null>(() => {
    const u = this.currentUser();
    if (!u) return null;
    return this.buildCharts(u.name, this.chartMonth() || this.firstOfMonth(this.todayStr()), m => this.chartMonth.set(m));
  });

  // ── computed: admin ───────────────────────────────────────────────────────
  members = computed<MemberCard[]>(() => {
    const u = this.currentUser();
    const today = this.todayStr();
    return this.users()
      .filter(m => !u || m.uid !== u.uid)
      .map(m => {
        const es = this.entries().filter(e => this.sameName(e.name, m.name)).sort((a, b) => a.date < b.date ? 1 : -1);
        const last = es.length ? es[0].date : '';
        let lastLabel = 'no entries yet';
        if (last) {
          if (last === today) lastLabel = 'active today';
          else if (last === this.addDays(today, -1)) lastLabel = 'active yesterday';
          else lastLabel = 'last ' + this.parse(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        }
        return {
          name: m.name, initial: this.initial(m.name), avatarStyle: this.avatar(m.name), isAdmin: m.type === 1,
          caption: `${es.length}${es.length === 1 ? ' entry · ' : ' entries · '}${lastLabel}`,
          onOpen: () => { this.admTarget.set(m.name); this.admMonth.set(this.firstOfMonth(today)); this.admSel.set(today); },
        };
      });
  });

  adm = computed<ProgressData | null>(() => {
    const t = this.admTarget();
    if (!t) return null;
    return this.buildProgress(t, this.admMonth() || this.firstOfMonth(this.todayStr()), this.admSel() || this.todayStr(), {
      editable: false,
      setMonth: m => this.admMonth.set(m),
      setSel: ds => this.admSel.set(ds),
    });
  });

  admCharts = computed<ChartsData | null>(() => {
    const t = this.admTarget();
    if (!t) return null;
    return this.buildCharts(t, this.admMonth() || this.firstOfMonth(this.todayStr()), m => this.admMonth.set(m));
  });

  admMeta = computed(() => {
    const t = this.admTarget();
    if (!t) return null;
    const cnt = this.entries().filter(e => this.sameName(e.name, t)).length;
    const tu = this.users().find(u => this.sameName(u.name, t));
    return {
      name: t, initial: this.initial(t), avatarStyle: this.avatar(t),
      subLabel: (tu?.type === 1 ? 'Admin · ' : '') + cnt + (cnt === 1 ? ' entry recorded' : ' entries recorded'),
    };
  });

  // ── computed: form screen ─────────────────────────────────────────────────
  formMeta = computed(() => {
    const d = this.selectedDate() || this.todayStr();
    const today = this.todayStr();
    const u = this.currentUser();
    const dt = this.parse(d);
    const rel = this.relative(d);
    const isToday = d === today;
    const exists = !!this.findEntry(u?.name ?? '', d);
    const hasErrors = this.errors().length > 0;
    return {
      d, today, dt,
      weekday: dt.toLocaleDateString('en-US', { weekday: 'long' }),
      dateMain: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      relative: rel, hasRelative: !!rel, isToday,
      nextBtnStyle: `width:46px;height:46px;border-radius:13px;border:1px solid #d9e3dc;background:#f8fbf8;font-size:22px;color:#28302b;flex:0 0 auto;${isToday ? 'opacity:.35;cursor:not-allowed' : 'cursor:pointer'}`,
      statusLabel: exists ? 'Saved entry' : 'New entry',
      statusColor: exists ? '#6f9b62' : '#a4b1a8',
      saveLabel: exists ? 'Update entry' : 'Save entry',
      footerText: hasErrors ? 'Please fill the required fields marked *.' : (exists ? 'An entry exists for this day — saving updates it.' : 'No entry yet for this day.'),
      footerColor: hasErrors ? '#c0492f' : '#7d8a82',
      footerWeight: hasErrors ? '600' : '400',
    };
  });
}
