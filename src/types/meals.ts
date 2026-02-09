export interface MealRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner';
}
