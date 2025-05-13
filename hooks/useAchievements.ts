import { useAchievement } from '@/context/achievement-context';

/**
 * Hook que proporciona acceso a los logros del usuario y funciones para interactuar con ellos.
 * Este hook es un wrapper sobre el contexto de logros existente para facilitar su uso.
 */
export function useAchievements() {
  const { 
    achievements, 
    unlockedAchievements, 
    claimedAchievements, 
    unlockAchievement, 
    claimAchievement 
  } = useAchievement();

  /**
   * Obtiene el número de logros desbloqueados pero aún no reclamados.
   * @returns Número de logros sin reclamar
   */
  const getUnclaimedCount = (): number => {
    return unlockedAchievements
      .filter(unlock => !claimedAchievements.includes(unlock.id))
      .length;
  };

  /**
   * Verifica si un logro específico está desbloqueado.
   * @param id - ID del logro a verificar
   * @returns true si el logro está desbloqueado, false en caso contrario
   */
  const isAchievementUnlocked = (id: string): boolean => {
    return unlockedAchievements.some(unlock => unlock.id === id);
  };

  /**
   * Verifica si un logro específico ha sido reclamado.
   * @param id - ID del logro a verificar
   * @returns true si el logro ha sido reclamado, false en caso contrario
   */
  const isAchievementClaimed = (id: string): boolean => {
    return claimedAchievements.includes(id);
  };

  /**
   * Obtiene la fecha en que se desbloqueó un logro específico.
   * @param id - ID del logro
   * @returns Fecha de desbloqueo o null si no está desbloqueado
   */
  const getUnlockDate = (id: string): string | null => {
    const unlockedAchievement = unlockedAchievements.find(unlock => unlock.id === id);
    return unlockedAchievement ? unlockedAchievement.unlockedAt : null;
  };

  /**
   * Obtiene todos los logros desbloqueados pero aún no reclamados.
   * @returns Array de logros sin reclamar
   */
  const getUnclaimedAchievements = () => {
    return achievements.filter(achievement => 
      isAchievementUnlocked(achievement.id) && !isAchievementClaimed(achievement.id)
    );
  };

  return {
    achievements,
    unlockedAchievements,
    claimedAchievements,
    unlockAchievement,
    claimAchievement,
    getUnclaimedCount,
    isAchievementUnlocked,
    isAchievementClaimed,
    getUnlockDate,
    getUnclaimedAchievements
  };
}
