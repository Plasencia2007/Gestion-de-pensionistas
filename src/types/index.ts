export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  dni?: string;
  email?: string;
  phone: string;
  parentPhone?: string;
  address?: string;
  birthDate?: string;
  career: string;
  joinedDate: string;
  subscribedMeals: string[];
  notes?: string;
  avatar?: string;
  active: boolean;
}

export interface MealLog {
  id: string;
  studentId: string;
  mealType: string;
  timestamp: string;
  status: 'Verificado' | 'Anulado' | 'Duplicado' | 'Aviso' | 'Suscripcion';
  hasExtra?: boolean;
  extraNotes?: string;
  isPaid?: boolean;
  paymentDate?: string;
}

export interface StudentExtra {
  id: string;
  studentId: string;
  title: string;
  price: number;
  createdAt: string;
  isPaid?: boolean;
  paymentDate?: string;
}
