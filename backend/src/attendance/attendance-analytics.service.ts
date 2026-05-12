import { Injectable } from '@nestjs/common';

export enum AttendanceHealth {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

@Injectable()
export class AttendanceAnalyticsService {
  /**
   * Calculates percentages and determines health status.
   */
  calculateHealth(stats: { present: number; late: number; total: number }) {
    if (stats.total === 0) return { standard: 0, lateInclusive: 0, health: AttendanceHealth.SAFE };

    const standard = (stats.present / stats.total) * 100;
    const lateInclusive = ((stats.present + stats.late) / stats.total) * 100;

    let health = AttendanceHealth.SAFE;
    if (standard < 65) {
      health = AttendanceHealth.CRITICAL;
    } else if (standard < 75) {
      health = AttendanceHealth.WARNING;
    }

    return {
      standard: Number(standard.toFixed(2)),
      lateInclusive: Number(lateInclusive.toFixed(2)),
      health,
    };
  }

  /**
   * Generates a summary for a subject.
   */
  getSubjectHealth(stats: { present: number; late: number; absent: number; leave: number; total: number }) {
    const health = this.calculateHealth({
      present: stats.present,
      late: stats.late,
      total: stats.total,
    });

    return {
      ...stats,
      ...health,
    };
  }
}
