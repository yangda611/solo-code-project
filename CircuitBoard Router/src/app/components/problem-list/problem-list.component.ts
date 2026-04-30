import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Problem, ProblemType } from '../../models/pcb.models';
import { PcbDataService } from '../../services/pcb-data.service';
import { COLORS } from '../../models/config.constants';

interface ProblemGroup {
  type: ProblemType;
  name: string;
  icon: string;
  problems: Problem[];
  color: string;
}

@Component({
  selector: 'app-problem-list',
  templateUrl: './problem-list.component.html',
  styleUrls: ['./problem-list.component.scss']
})
export class ProblemListComponent implements OnInit, OnDestroy {
  @Input() isScanning: boolean = false;

  problems: Problem[] = [];
  groupedProblems: ProblemGroup[] = [];
  expandedGroups: Set<ProblemType> = new Set(['short', 'open', 'cross', 'dense', 'unconnected']);

  private destroy$ = new Subject<void>();

  constructor(
    private pcbDataService: PcbDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.pcbDataService.pcbData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.problems = data.problems;
        this.groupProblems();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private groupProblems(): void {
    const groups: ProblemGroup[] = [
      { type: 'short', name: '短路', icon: '⚡', problems: [], color: COLORS.problemShort },
      { type: 'open', name: '断路', icon: '🔌', problems: [], color: COLORS.problemOpen },
      { type: 'cross', name: '交叉', icon: '✖️', problems: [], color: COLORS.problemCross },
      { type: 'dense', name: '过密', icon: '📦', problems: [], color: COLORS.problemDense },
      { type: 'unconnected', name: '未连接', icon: '⭕', problems: [], color: COLORS.problemUnconnected }
    ];

    for (const problem of this.problems) {
      const group = groups.find(g => g.type === problem.type);
      if (group) {
        group.problems.push(problem);
      }
    }

    this.groupedProblems = groups;
  }

  toggleGroup(type: ProblemType): void {
    if (this.expandedGroups.has(type)) {
      this.expandedGroups.delete(type);
    } else {
      this.expandedGroups.add(type);
    }
  }

  isGroupExpanded(type: ProblemType): boolean {
    return this.expandedGroups.has(type);
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#64748b';
    }
  }

  getTotalCount(): number {
    return this.problems.length;
  }

  getErrorCount(): number {
    return this.problems.filter(p => p.severity === 'error').length;
  }

  getWarningCount(): number {
    return this.problems.filter(p => p.severity === 'warning').length;
  }

  getInfoCount(): number {
    return this.problems.filter(p => p.severity === 'info').length;
  }

  trackByGroupType(index: number, group: ProblemGroup): string {
    return group.type;
  }

  trackByProblemId(index: number, problem: Problem): string {
    return problem.id;
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'error': return '错误';
      case 'warning': return '警告';
      case 'info': return '提示';
      default: return '提示';
    }
  }

  formatNumber(num: number): number {
    return Math.round(num);
  }
}
