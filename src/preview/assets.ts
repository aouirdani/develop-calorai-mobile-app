/**
 * Photos d'exemple de la preview (importées → inlinées par le build single-file).
 * Les clés "sample:xxx" sont reconnues par le MockApiClient pour renvoyer
 * l'estimation correspondant à la photo.
 */
import bowlImg from "../assets/meals/bowl.jpg";
import patesImg from "../assets/meals/pates.jpg";
import saladeImg from "../assets/meals/salade.jpg";
import porridgeImg from "../assets/meals/porridge.jpg";
import pizzaImg from "../assets/meals/pizza.jpg";

export interface SampleMeal {
  key: string;
  label: string;
  src: string;
}

export const SAMPLE_MEALS: SampleMeal[] = [
  { key: "sample:bowl", label: "Bowl saumon quinoa", src: bowlImg },
  { key: "sample:pates", label: "Pâtes bolognaise", src: patesImg },
  { key: "sample:salade", label: "Salade César", src: saladeImg },
  { key: "sample:porridge", label: "Porridge fruits rouges", src: porridgeImg },
  { key: "sample:pizza", label: "Pizza margherita", src: pizzaImg },
];

const resolved = new Map<string, string>(SAMPLE_MEALS.map((m) => [m.key, m.src]));

/** Résout l'image d'un MealLog : clé "sample:x" → asset, sinon uri telle quelle. */
export function resolveMealImage(image: string | null): string | null {
  if (!image) return null;
  return resolved.get(image) ?? image;
}
