/**
 * Registre éphémère (en mémoire) reliant un id d'estimation à la photo
 * qui l'a produite. L'API ne renvoie pas l'image : l'écran scan la pose ici
 * avant de naviguer vers /result/{id}, le résultat et le journal la réutilisent.
 */
interface EstimateMeta {
  image: string | null;
}

const registry = new Map<string, EstimateMeta>();

export function setEstimateMeta(id: string, meta: EstimateMeta): void {
  registry.set(id, meta);
  // Garde-fou mémoire : on ne conserve que les 40 dernières entrées.
  if (registry.size > 40) {
    const first = registry.keys().next().value;
    if (first) registry.delete(first);
  }
}

export function getEstimateMeta(id: string): EstimateMeta | undefined {
  return registry.get(id);
}
