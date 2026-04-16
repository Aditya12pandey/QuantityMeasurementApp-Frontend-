import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { QuantityService } from '../../services/quantity.service';
import { MeasurementType, QuantityDTO, QuantityMeasurementRecordDto, UNIT_MAP } from '../../models/quantity.model';

type Tab = 'convert' | 'compare' | 'add' | 'subtract' | 'divide' | 'history';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss']
})
export class AppShellComponent implements OnInit {

  // ── Auth state ──────────────────────────────────────────
  isLoggedIn = false;
  username: string | null = null;
  dropdownOpen = false;

  // Modals
  loginModalOpen = false;
  registerModalOpen = false;
  loginUser = ''; loginPass = ''; loginErr = ''; loginLoading = false;
  regUser = '';   regPass = '';   regErr = '';   regLoading = false;

  // Toast
  toastMsg = ''; toastClass = ''; toastVisible = false;
  private toastTimer: any;

  // ── Tabs ─────────────────────────────────────────────────
  activeTab: Tab = 'convert';
  readonly tabs = [
    { id: 'convert'  as Tab, label: '⇄ Convert'  },
    { id: 'compare'  as Tab, label: '= Compare'  },
    { id: 'add'      as Tab, label: '+ Add'      },
    { id: 'subtract' as Tab, label: '− Subtract' },
    { id: 'divide'   as Tab, label: '÷ Divide'   },
    { id: 'history'  as Tab, label: '⏱ History'  },
  ];

  // ── Units helper ─────────────────────────────────────────
  readonly measurementTypes: MeasurementType[] = ['LENGTH', 'WEIGHT', 'TEMPERATURE', 'VOLUME'];
  readonly measurementTypesNoTemp: MeasurementType[] = ['LENGTH', 'WEIGHT', 'VOLUME'];
  readonly UNIT_MAP = UNIT_MAP;

  getUnits(type: string): string[] {
    return UNIT_MAP[type as MeasurementType] ?? [];
  }

  // ── CONVERT ──────────────────────────────────────────────
  cvType: MeasurementType = 'LENGTH';
  cvVal = 0;
  cvFrom = 'FEET'; cvTo = 'INCHES';
  cvResultVisible = false; cvNum = ''; cvCap = ''; cvBadge = ''; cvUnit = '';

  onCvTypeChange() {
    const units = this.getUnits(this.cvType);
    this.cvFrom = units[0]; this.cvTo = units[1] ?? units[0];
    this.cvResultVisible = false;
  }
  swapCvUnits() { [this.cvFrom, this.cvTo] = [this.cvTo, this.cvFrom]; }
  clearCv() { this.cvVal = 0; this.cvResultVisible = false; }

  doConvert() {
    if (!this.requireAuth()) return;
    this.qtyService.convert({
      quantity: { value: this.cvVal, unitName: this.cvFrom, measurementType: this.cvType },
      targetUnit: { value: 0, unitName: this.cvTo, measurementType: this.cvType }
    }).subscribe({
      next: r => {
        this.cvNum = String(r.value); this.cvUnit = r.unitName;
        this.cvCap = `${this.cvVal} ${this.cvFrom} = ${r.value} ${r.unitName}`;
        this.cvBadge = this.cvType; this.cvResultVisible = true;
      },
      error: e => this.showToast(e.error?.message || 'Convert failed', 'err')
    });
  }

  // ── COMPARE ──────────────────────────────────────────────
  cmpType: MeasurementType = 'LENGTH';
  cmp1v = 0; cmp1u = 'FEET';
  cmp2v = 0; cmp2u = 'INCHES';
  cmpResultVisible = false; cmpNum = ''; cmpCap = ''; cmpClass = '';

  onCmpTypeChange() {
    const u = this.getUnits(this.cmpType);
    this.cmp1u = u[0]; this.cmp2u = u[1] ?? u[0];
    this.cmpResultVisible = false;
  }
  clearCmp() { this.cmp1v = 0; this.cmp2v = 0; this.cmpResultVisible = false; }

  doCompare() {
    if (!this.requireAuth()) return;
    this.qtyService.compare({
      first:  { value: this.cmp1v, unitName: this.cmp1u, measurementType: this.cmpType },
      second: { value: this.cmp2v, unitName: this.cmp2u, measurementType: this.cmpType }
    }).subscribe({
      next: r => {
        this.cmpNum = r.equal ? '✓ Equal' : '✗ Not Equal';
        this.cmpCap = `${this.cmp1v} ${this.cmp1u} vs ${this.cmp2v} ${this.cmp2u}`;
        this.cmpClass = r.equal ? 'eq' : 'neq';
        this.cmpResultVisible = true;
      },
      error: e => this.showToast(e.error?.message || 'Compare failed', 'err')
    });
  }

  // ── ADD ──────────────────────────────────────────────────
  addType: MeasurementType = 'LENGTH';
  add1v = 0; add1u = 'FEET';
  add2v = 0; add2u = 'INCHES';
  addTgt = 'FEET';
  addResultVisible = false; addNum = ''; addCap = ''; addUnit = ''; addBadge = '';

  onAddTypeChange() {
    const u = this.getUnits(this.addType);
    this.add1u = u[0]; this.add2u = u[1] ?? u[0]; this.addTgt = u[0];
    this.addResultVisible = false;
  }
  clearAdd() { this.add1v = 0; this.add2v = 0; this.addResultVisible = false; }

  doAdd() {
    if (!this.requireAuth()) return;
    this.qtyService.add({
      first:      { value: this.add1v, unitName: this.add1u, measurementType: this.addType },
      second:     { value: this.add2v, unitName: this.add2u, measurementType: this.addType },
      targetUnit: { value: 0,          unitName: this.addTgt, measurementType: this.addType }
    }).subscribe({
      next: r => {
        this.addNum = String(r.value); this.addUnit = r.unitName;
        this.addCap = `${this.add1v} ${this.add1u} + ${this.add2v} ${this.add2u}`;
        this.addBadge = this.addType; this.addResultVisible = true;
      },
      error: e => this.showToast(e.error?.message || 'Add failed', 'err')
    });
  }

  // ── SUBTRACT ─────────────────────────────────────────────
  subType: MeasurementType = 'LENGTH';
  sub1v = 0; sub1u = 'FEET';
  sub2v = 0; sub2u = 'INCHES';
  subTgt = 'FEET';
  subResultVisible = false; subNum = ''; subCap = ''; subUnit = ''; subBadge = '';

  onSubTypeChange() {
    const u = this.getUnits(this.subType);
    this.sub1u = u[0]; this.sub2u = u[1] ?? u[0]; this.subTgt = u[0];
    this.subResultVisible = false;
  }
  clearSub() { this.sub1v = 0; this.sub2v = 0; this.subResultVisible = false; }

  doSubtract() {
    if (!this.requireAuth()) return;
    this.qtyService.subtract({
      first:      { value: this.sub1v, unitName: this.sub1u, measurementType: this.subType },
      second:     { value: this.sub2v, unitName: this.sub2u, measurementType: this.subType },
      targetUnit: { value: 0,          unitName: this.subTgt, measurementType: this.subType }
    }).subscribe({
      next: r => {
        this.subNum = String(r.value); this.subUnit = r.unitName;
        this.subCap = `${this.sub1v} ${this.sub1u} − ${this.sub2v} ${this.sub2u}`;
        this.subBadge = this.subType; this.subResultVisible = true;
      },
      error: e => this.showToast(e.error?.message || 'Subtract failed', 'err')
    });
  }

  // ── DIVIDE ───────────────────────────────────────────────
  divType: MeasurementType = 'LENGTH';
  div1v = 0; div1u = 'FEET';
  div2v = 0; div2u = 'INCHES';
  divResultVisible = false; divNum = ''; divCap = '';

  onDivTypeChange() {
    const u = this.getUnits(this.divType);
    this.div1u = u[0]; this.div2u = u[1] ?? u[0];
    this.divResultVisible = false;
  }
  clearDiv() { this.div1v = 0; this.div2v = 0; this.divResultVisible = false; }

  doDivide() {
    if (!this.requireAuth()) return;
    this.qtyService.divide({
      first:  { value: this.div1v, unitName: this.div1u, measurementType: this.divType },
      second: { value: this.div2v, unitName: this.div2u, measurementType: this.divType }
    }).subscribe({
      next: r => {
        this.divNum = String(r.value);
        this.divCap = `${this.div1v} ${this.div1u} ÷ ${this.div2v} ${this.div2u}`;
        this.divResultVisible = true;
      },
      error: e => this.showToast(e.error?.message || 'Divide failed', 'err')
    });
  }

  // ── HISTORY ──────────────────────────────────────────────
  histRecords: QuantityMeasurementRecordDto[] = [];
  histFilter = 'ALL';
  histLoading = false;

  setHistFilter(f: string) {
    this.histFilter = f;
    this.loadHistory();
  }

  loadHistory() {
    if (!this.isLoggedIn) { this.histRecords = []; return; }
    this.histLoading = true;
    const obs$ = this.histFilter === 'ALL'
      ? this.qtyService.getHistory()
      : this.qtyService.getHistoryByOperation(this.histFilter);
    obs$.subscribe({
      next: r => {
        // Sort latest first — use id as primary sort (higher id = newer)
        this.histRecords = r.slice().sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          return timeDiff !== 0 ? timeDiff : b.id - a.id;
        });
        this.histLoading = false;
      },
      error: () => { this.histLoading = false; }
    });
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ── Auth actions ──────────────────────────────────────────
  openLogin()    { this.loginModalOpen = true;    this.loginErr = ''; }
  openRegister() { this.registerModalOpen = true; this.regErr = ''; }
  closeLogin()   { this.loginModalOpen = false; }
  closeRegister(){ this.registerModalOpen = false; }
  switchToReg()  { this.loginModalOpen = false; this.registerModalOpen = true; this.regErr = ''; }
  switchToLog()  { this.registerModalOpen = false; this.loginModalOpen = true; this.loginErr = ''; }

  doLogin() {
    if (!this.loginUser.trim() || !this.loginPass.trim()) { this.loginErr = 'All fields required.'; return; }
    this.loginLoading = true; this.loginErr = '';
    this.authService.login({ username: this.loginUser, password: this.loginPass }).subscribe({
      next: () => {
        this.loginLoading = false; this.loginModalOpen = false;
        this.isLoggedIn = true; this.username = this.authService.getUsername();
        this.loginUser = ''; this.loginPass = '';
        this.showToast(`Welcome back, ${this.username}!`, 'ok');
      },
      error: e => { this.loginErr = e.error?.error || 'Login failed.'; this.loginLoading = false; }
    });
  }

  doRegister() {
    if (!this.regUser.trim() || !this.regPass.trim()) { this.regErr = 'All fields required.'; return; }
    this.regLoading = true; this.regErr = '';
    this.authService.register({ username: this.regUser, password: this.regPass }).subscribe({
      next: (r: any) => {
        this.regLoading = false; this.registerModalOpen = false;
        this.regUser = ''; this.regPass = '';
        this.showToast(r.message || 'Registered! Please log in.', 'ok');
        setTimeout(() => this.openLogin(), 400);
      },
      error: e => { this.regErr = e.error?.error || 'Registration failed.'; this.regLoading = false; }
    });
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false; this.username = null;
    this.dropdownOpen = false; this.histRecords = [];
    this.activeTab = 'convert';
    this.showToast('Logged out.', 'info');
  }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.nav-actions')) this.dropdownOpen = false;
  }

  switchTab(tab: Tab) {
    this.activeTab = tab;
    if (tab === 'history') this.loadHistory();
  }

  private requireAuth(): boolean {
    if (!this.isLoggedIn) { this.openLogin(); return false; }
    return true;
  }

  showToast(msg: string, cls: 'ok' | 'err' | 'info') {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg; this.toastClass = cls; this.toastVisible = true;
    this.toastTimer = setTimeout(() => this.toastVisible = false, 3000);
  }

  constructor(private authService: AuthService, private qtyService: QuantityService) {}

  ngOnInit() {
    this.isLoggedIn = !!this.authService.getToken();
    this.username   = this.authService.getUsername();
    // initialise unit dropdowns
    this.onCvTypeChange();
    this.onCmpTypeChange();
    this.onAddTypeChange();
    this.onSubTypeChange();
    this.onDivTypeChange();
  }

  get currentYear() { return new Date().getFullYear(); }
}