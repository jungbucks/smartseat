
export interface Student {
  id: string;
  name: string;
  note?: string;
  isFixed?: boolean;
  isMissing?: boolean; // New: Represents dropped out or missing numbers
}

export interface Seat {
  id: number;
  studentId: string | null;
  isBlocked: boolean; // For empty spaces in classroom
}

export interface ClassroomLayout {
  rows: number;
  cols: number;
  seats: Seat[];
}
