export type Screen = 'login' | 'signup' | 'verify-email' | 'forgot-password' | 'form' | 'history' | 'progress' | 'admin';

export interface User {
  uid: string;
  name: string;   // display name
  email: string;
  type: number;   // 0 = regular, 1 = admin
}

export type EntryForm = Record<string, string>;

export interface Entry extends EntryForm {
  date: string;
  name: string;
  userId: string;
  sleepTime: string;
  wakeupTime: string;
  dayRest: string;
  exerciseDuration: string;
  chantEnd: string;
  rounds: string;
  hearingTopic: string;
  hearingDuration: string;
  readingTopic: string;
  readingDuration: string;
  serviceNames: string;
  serviceDuration: string;
  jobDuration: string;
  studyDuration: string;
  socialMediaDuration: string;
  moodPositive: string;
  moodNegative: string;
  moodPositiveOther: string;
  moodNegativeOther: string;
  comments: string;
}

export const FIELD_KEYS = [
  'sleepTime','wakeupTime','dayRest','exerciseDuration','chantEnd','rounds',
  'hearingTopic','hearingDuration','readingTopic','readingDuration',
  'serviceNames','serviceDuration','jobDuration','studyDuration','socialMediaDuration',
  'moodPositive','moodNegative','moodPositiveOther','moodNegativeOther','comments',
] as const;

export const REQUIRED_KEYS = ['sleepTime','wakeupTime','rounds'] as const;

export interface FieldMeta {
  label: string;
  inputType?: string;
  numeric?: boolean;
  isTextarea?: boolean;
  isChips?: boolean;
  chipsMulti?: boolean;
  chipOptions?: string[];
  sectionHeader?: boolean;
  unit?: string;
  placeholder?: string;
  required?: boolean;
  othersKey?: string;
}

export const FIELD_META: Record<string, FieldMeta> = {
  sleepTime:           { label: 'Previous night sleep time', inputType: 'time', required: true },
  wakeupTime:          { label: 'Morning wake-up time',      inputType: 'time', required: true },
  dayRest:             { label: 'Day rest duration',   numeric: true, unit: 'min', placeholder: '0' },
  exerciseDuration:    { label: 'Exercise duration',   numeric: true, unit: 'min', placeholder: '0' },
  chantEnd:            { label: 'Chanting end time',   inputType: 'time' },
  rounds:              { label: 'Chanting rounds',     numeric: true, unit: 'rounds', placeholder: '0', required: true },
  hearingTopic:        { label: 'Hearing topic',       inputType: 'text', placeholder: 'e.g. SB 1.2.6' },
  hearingDuration:     { label: 'Hearing duration',    numeric: true, unit: 'min', placeholder: '0' },
  readingTopic:        { label: 'Reading topic',       inputType: 'text', placeholder: 'e.g. Bhagavad-gita Ch. 2' },
  readingDuration:     { label: 'Reading duration',    numeric: true, unit: 'min', placeholder: '0' },
  serviceNames:        { label: 'Service(s)',           inputType: 'text', placeholder: 'e.g. Deity cooking, cleaning' },
  serviceDuration:     { label: 'Service duration',    numeric: true, unit: 'min', placeholder: '0' },
  jobDuration:         { label: 'Job duration',         numeric: true, unit: 'hrs', placeholder: '0' },
  studyDuration:       { label: 'Study duration',       numeric: true, unit: 'hrs', placeholder: '0' },
  socialMediaDuration: { label: 'Social Media / Entertainment / Time Waste duration', numeric: true, unit: 'min', placeholder: '0' },
  moodHeader:          { label: 'Mood', sectionHeader: true },
  moodPositive:        { label: 'Positive Chetna', isChips: true, chipsMulti: true, othersKey: 'moodPositiveOther', chipOptions: ['Appreciative','Compassionate','Detached','Determined','Disciplined','Enthusiastic','Grateful','Humble','Spiritually Absorbed','Valued Association','Others'] },
  moodNegative:        { label: 'Negative Chetna', isChips: true, chipsMulti: true, othersKey: 'moodNegativeOther', chipOptions: ['Angry','Egoistic','Envious','Greedy','Lazy','Lusty','Offensive','Over Eating','Time Wasting','Others'] },
  moodPositiveOther:   { label: 'Other positive mood', inputType: 'text', placeholder: 'Describe your mood…' },
  moodNegativeOther:   { label: 'Other negative mood', inputType: 'text', placeholder: 'Describe your mood…' },
  comments:            { label: 'Comments & reflections', isTextarea: true, placeholder: 'How was your day? Anything to remember…' },
};

export const GROUPS = [
  { title: 'Rest & Sleep',     keys: ['sleepTime','wakeupTime','dayRest','exerciseDuration'] },
  { title: 'Chanting',         keys: ['chantEnd','rounds'] },
  { title: 'Hearing',          keys: ['hearingTopic','hearingDuration'] },
  { title: 'Reading',          keys: ['readingTopic','readingDuration'] },
  { title: 'Service',          keys: ['serviceNames','serviceDuration'] },
  { title: 'Daily Activities', keys: ['jobDuration','studyDuration','socialMediaDuration'] },
  { title: 'Reflections',      keys: ['moodHeader','moodPositive','moodNegative','comments'] },
] as const;

export interface CalCell {
  blank: boolean;
  day?: number;
  ds?: string;
  has?: boolean;
  isToday?: boolean;
  isFuture?: boolean;
  isSelected?: boolean;
  style?: string;
  label?: number | string;
  onClick?: (() => void) | null;
}

export interface DetailData {
  exists: boolean;
  notExists: boolean;
  weekday: string;
  dateMain: string;
  relative: string;
  hasRelative: boolean;
  rows: Array<{ label: string; value: string }>;
  canEdit: boolean;
  canAdd: boolean;
  emptyText: string;
  onEdit: (() => void) | null;
}

export interface ProgressData {
  monthLabel: string;
  weekdays: string[];
  cells: CalCell[];
  statCards: Array<{ value: number; label: string }>;
  onPrev: () => void;
  onNext: (() => void) | null;
  nextStyle: string;
  detail: DetailData;
}

export interface BarData {
  h: number;
  title: string;
  barColor: string;
  tick: string;
}

export interface ChartData {
  title: string;
  color: string;
  total: number;
  avg: number;
  bars: BarData[];
  caption: string;
}

export interface ChartsData {
  monthLabel: string;
  onPrev: () => void;
  onNext: (() => void) | null;
  nextStyle: string;
  list: ChartData[];
}

export interface MemberCard {
  name: string;
  initial: string;
  avatarStyle: string;
  isAdmin: boolean;
  caption: string;
  onOpen: () => void;
}

export interface FormField {
  key: string;
  label: string;
  inputType: string;
  placeholder: string;
  inputMode: string;
  unit: string;
  hasUnit: boolean;
  required: boolean;
  isTextarea: boolean;
  isTime: boolean;
  isInput: boolean;
  isChips: boolean;
  chipsMulti: boolean;
  chipOptions: string[];
  selectedChips: string[];
  onChipToggle: (chip: string) => void;
  isSectionHeader: boolean;
  isFullWidth: boolean;
  isError: boolean;
  borderColor: string;
  value: string;
  onChange: (e: Event) => void;
  showOthers?: boolean;
  othersValue?: string;
  onOthersChange?: (e: Event) => void;
  // time picker extras
  timeText?: string;
  pickerOpen?: boolean;
  fieldStyle?: string;
  onToggle?: () => void;
  onClose?: () => void;
  hours?: Array<{ label: string; style: string; onClick: () => void }>;
  minutes?: Array<{ label: string; style: string; onClick: () => void }>;
}

export interface FormGroup {
  title: string;
  fields: FormField[];
}
