import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-admin-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-screen.component.html',
  styleUrls: ['./admin-screen.component.css'],
})
export class AdminScreenComponent {
  state = inject(StateService);
  get members() { return this.state.members(); }
  get admTarget() { return this.state.admTarget(); }
  get adm() { return this.state.adm(); }
  get admCharts() { return this.state.admCharts(); }
  get admMeta() { return this.state.admMeta(); }
  goBack() { this.state.admTarget.set(null); }
}
