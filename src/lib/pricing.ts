export type MealStatus = "Verificado" | "Aviso" | "Anulado" | "Suscripcion";
export type MealType = "Desayuno" | "Almuerzo" | "Cena";

interface DayMeals {
  Desayuno: boolean;
  Almuerzo: boolean;
  Cena: boolean;
}

/**
 * Calculates the daily total based on consumed meals.
 * Rules:
 * - Full Board (D+A+C): S/ 19.00
 * - Lunch + Breakfast (D+A): S/ 14.50
 * - Lunch + Dinner (A+C): S/ 14.50
 * - Breakfast + Dinner (D+C): S/ 12.00
 * - Lunch Only (A): S/ 10.00
 * - Breakfast Only (D): S/ 6.00
 * - Dinner Only (C): S/ 6.00
 */
export function calculateDailyTotal(
  meals: { type: string; status: string }[],
): number {
  const consumed: DayMeals = {
    Desayuno: false,
    Almuerzo: false,
    Cena: false,
  };

  meals.forEach((meal) => {
    // Check if meal is "Active" (Chargeable)
    // "Verificado" = Consumed
    // "Suscripcion" = Default/Assumed Consumed
    // "Aviso" = Not Consumed (Free)
    // "Anulado" = Not Consumed (Free)
    const isChargeable =
      meal.status === "Verificado" || meal.status === "Suscripcion";

    if (isChargeable) {
      if (meal.type === "Desayuno") consumed.Desayuno = true;
      if (meal.type === "Almuerzo") consumed.Almuerzo = true;
      if (meal.type === "Cena") consumed.Cena = true;
    }
  });

  const { Desayuno, Almuerzo, Cena } = consumed;

  // 3 Meals
  if (Desayuno && Almuerzo && Cena) return 19.0;

  // 2 Meals
  if (Desayuno && Almuerzo) return 14.5;
  if (Almuerzo && Cena) return 14.5;
  if (Desayuno && Cena) return 12.0; // Derived: 6 + 6

  // 1 Meal
  if (Almuerzo) return 10.0;
  if (Desayuno) return 6.0;
  if (Cena) return 6.0;

  return 0.0;
}
