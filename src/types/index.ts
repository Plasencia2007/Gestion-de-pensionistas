export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  joinedDate: string;
  notes?: string;
  avatar?: string;
  active: boolean;
}

export interface MealLog {
  id: string;
  studentId: string;
  mealType: string;
  timestamp: string;
  status: 'Verificado' | 'Anulado' | 'Duplicado';
  hasExtra?: boolean;
  extraNotes?: string;
}
