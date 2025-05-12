"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir el tipo para las estadísticas del juego
interface GameStats {
  winRate: number
  totalVolume: number
  profitPercentage: number
  totalBets: number
  maxConsecutiveWins: number
}

interface Achievement {
  id: string
  title: string
  description: string
  reward: number
  condition: string
  category: string
  icon?: string | React.ReactNode
  unlockedAt?: string // Añadiendo campo para la fecha/hora de desbloqueo
}

interface AchievementContextType {
  achievements: Achievement[]
  unlockedAchievements: Array<{id: string, unlockedAt: string}> // Modificando para incluir tiempo
  claimedAchievements: string[]
  unlockAchievement: (id: string) => void
  claimAchievement: (id: string) => number
  gameStats: GameStats
}

const defaultGameStats: GameStats = {
  winRate: 50,
  totalVolume: 10000,
  profitPercentage: 25,
  totalBets: 45,
  maxConsecutiveWins: 4
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined)

// List of available achievements
const ACHIEVEMENTS: Achievement[] = [
  // LOGROS BÁSICOS (15)
  {
    id: "first_bet",
    title: "Primera apuesta",
    description: "Realiza tu primera apuesta",
    reward: 50,
    condition: "Realizar la primera apuesta",
    category: "basico"
  },
  {
    id: "welcome_bonus",
    title: "Bienvenido al juego",
    description: "Regístrate en la plataforma",
    reward: 100,
    condition: "Completar el registro",
    category: "basico"
  },
  {
    id: "profile_complete",
    title: "Perfil completo",
    description: "Completa todos los datos de tu perfil",
    reward: 75,
    condition: "Completar todos los campos del perfil",
    category: "basico"
  },
  {
    id: "first_deposit",
    title: "Primer depósito",
    description: "Realiza tu primer depósito",
    reward: 50,
    condition: "Hacer un depósito",
    category: "basico"
  },
  {
    id: "first_win",
    title: "Primera victoria",
    description: "Gana tu primera apuesta",
    reward: 100,
    condition: "Ganar una apuesta",
    category: "basico"
  },
  {
    id: "first_btc_bet",
    title: "Bitcoiner",
    description: "Realiza tu primera apuesta en Bitcoin",
    reward: 50,
    condition: "Apostar en BTC",
    category: "basico"
  },
  {
    id: "first_eth_bet",
    title: "Ethereal",
    description: "Realiza tu primera apuesta en Ethereum",
    reward: 50,
    condition: "Apostar en ETH",
    category: "basico"
  },
  {
    id: "first_withdrawal",
    title: "Primer retiro",
    description: "Realiza tu primer retiro de fondos",
    reward: 75,
    condition: "Retirar fondos",
    category: "basico"
  },
  {
    id: "consecutive_login_3",
    title: "Constancia",
    description: "Inicia sesión 3 días consecutivos",
    reward: 50,
    condition: "Loguearse 3 días seguidos",
    category: "basico"
  },
  {
    id: "ten_bets",
    title: "Apostador principiante",
    description: "Realiza 10 apuestas en total",
    reward: 75,
    condition: "Realizar 10 apuestas",
    category: "basico"
  },
  {
    id: "first_altcoin",
    title: "Altcoiner",
    description: "Apuesta en una criptomoneda alternativa",
    reward: 50,
    condition: "Apostar en una altcoin",
    category: "basico"
  },
  {
    id: "balance_500",
    title: "Medio millar",
    description: "Alcanza un balance de 500",
    reward: 50,
    condition: "Tener 500 en el balance",
    category: "basico"
  },
  {
    id: "tutorial_complete",
    title: "Estudiante aplicado",
    description: "Completa el tutorial de trading",
    reward: 100,
    condition: "Completar el tutorial",
    category: "basico"
  },
  {
    id: "first_chart_view",
    title: "Analista técnico",
    description: "Observa tu primer gráfico de velas",
    reward: 25,
    condition: "Ver un gráfico de velas",
    category: "basico"
  },
  {
    id: "share_social",
    title: "Influencer cripto",
    description: "Comparte la plataforma en redes sociales",
    reward: 100,
    condition: "Compartir en redes sociales",
    category: "basico"
  },
  
  // LOGROS INTERMEDIOS (15)
  {
    id: "winning_streak",
    title: "Racha ganadora",
    description: "Gana 10 apuestas en total",
    reward: 100,
    condition: "Ganar 10 apuestas",
    category: "intermedio"
  },
  {
    id: "crypto_master",
    title: "Maestro de cripto",
    description: "Apuesta en 5 pares diferentes",
    reward: 150,
    condition: "Apostar en 5 pares de criptomonedas diferentes",
    category: "intermedio"
  },
  {
    id: "consecutive_win_3",
    title: "Triple acierto",
    description: "Gana 3 apuestas consecutivas",
    reward: 150,
    condition: "Ganar 3 apuestas seguidas",
    category: "intermedio"
  },
  {
    id: "balance_1000",
    title: "Millar",
    description: "Alcanza un balance de 1000",
    reward: 100,
    condition: "Tener 1000 en el balance",
    category: "intermedio"
  },
  {
    id: "daily_login_7",
    title: "Semanal",
    description: "Inicia sesión 7 días consecutivos",
    reward: 150,
    condition: "Loguearse 7 días seguidos",
    category: "intermedio"
  },
  {
    id: "fifty_bets",
    title: "Trader activo",
    description: "Realiza 50 apuestas en total",
    reward: 200,
    condition: "Realizar 50 apuestas",
    category: "intermedio"
  },
  {
    id: "profit_5x",
    title: "Rentabilidad x5",
    description: "Obtén 5 veces tu apuesta en una operación",
    reward: 200,
    condition: "Ganar 5 veces lo apostado",
    category: "intermedio"
  },
  {
    id: "ten_pairs",
    title: "Diversificador",
    description: "Apuesta en 10 pares diferentes",
    reward: 200,
    condition: "Apostar en 10 pares distintos",
    category: "intermedio"
  },
  {
    id: "friend_referral",
    title: "Embajador",
    description: "Invita a un amigo que se registre",
    reward: 250,
    condition: "Referir a un amigo",
    category: "intermedio"
  },
  {
    id: "hundred_trades",
    title: "Centenario",
    description: "Realiza 100 operaciones",
    reward: 200,
    condition: "Realizar 100 operaciones",
    category: "intermedio"
  },
  {
    id: "win_ratio_60",
    title: "Rentable",
    description: "Alcanza un ratio de victorias del 60%",
    reward: 300,
    condition: "Tener 60% de victorias",
    category: "intermedio"
  },
  {
    id: "consecutive_login_14",
    title: "Quincenal",
    description: "Inicia sesión 14 días consecutivos",
    reward: 300,
    condition: "Loguearse 14 días seguidos",
    category: "intermedio"
  },
  {
    id: "five_altcoins",
    title: "Altcoin hunter",
    description: "Apuesta en 5 altcoins diferentes",
    reward: 200,
    condition: "Apostar en 5 altcoins",
    category: "intermedio"
  },
  {
    id: "risk_management",
    title: "Gestor de riesgo",
    description: "Mantén pérdidas por debajo del 10% durante 20 operaciones",
    reward: 250,
    condition: "Controlar pérdidas < 10%",
    category: "intermedio"
  },
  {
    id: "recovery",
    title: "Recuperación",
    description: "Recupera tu balance después de caer un 20%",
    reward: 300,
    condition: "Recuperarse de una caída del 20%",
    category: "intermedio"
  },

  // LOGROS AVANZADOS (15)
  {
    id: "high_roller",
    title: "Apostador audaz",
    description: "Realiza 5 apuestas simultáneas",
    reward: 200,
    condition: "Tener 5 apuestas pendientes a la vez",
    category: "avanzado"
  },
  {
    id: "balance_5000",
    title: "Cinco mil",
    description: "Alcanza un balance de 5000",
    reward: 300,
    condition: "Tener 5000 en el balance",
    category: "avanzado"
  },
  {
    id: "consecutive_win_7",
    title: "Siete aciertos",
    description: "Gana 7 apuestas consecutivas",
    reward: 400,
    condition: "Ganar 7 apuestas seguidas",
    category: "avanzado"
  },
  {
    id: "win_ratio_75",
    title: "Experto en ganancias",
    description: "Alcanza un ratio de victorias del 75%",
    reward: 500,
    condition: "Tener 75% de victorias",
    category: "avanzado"
  },
  {
    id: "daily_login_30",
    title: "Mensual",
    description: "Inicia sesión 30 días consecutivos",
    reward: 500,
    condition: "Loguearse 30 días seguidos",
    category: "avanzado"
  },
  {
    id: "five_hundred_trades",
    title: "Trader experimentado",
    description: "Realiza 500 operaciones",
    reward: 400,
    condition: "Realizar 500 operaciones",
    category: "avanzado"
  },
  {
    id: "profit_10x",
    title: "Rentabilidad x10",
    description: "Obtén 10 veces tu apuesta en una operación",
    reward: 500,
    condition: "Ganar 10 veces lo apostado",
    category: "avanzado"
  },
  {
    id: "twenty_pairs",
    title: "Maestro diversificador",
    description: "Apuesta en 20 pares diferentes",
    reward: 400,
    condition: "Apostar en 20 pares distintos",
    category: "avanzado"
  },
  {
    id: "ten_friend_referrals",
    title: "Creador de comunidad",
    description: "Invita a 10 amigos que se registren",
    reward: 600,
    condition: "Referir a 10 amigos",
    category: "avanzado"
  },
  {
    id: "volatility_master",
    title: "Maestro de la volatilidad",
    description: "Gana 5 apuestas durante un mercado con más de 5% de volatilidad",
    reward: 500,
    condition: "Ganar en alta volatilidad",
    category: "avanzado"
  },
  {
    id: "consistent_profit",
    title: "Ganancias constantes",
    description: "Mantén beneficios durante 10 días consecutivos",
    reward: 600,
    condition: "10 días con beneficios",
    category: "avanzado"
  },
  {
    id: "market_timer",
    title: "Market timer",
    description: "Realiza operaciones exitosas en 3 zonas horarias diferentes",
    reward: 400,
    condition: "Operar exitosamente en diferentes horarios",
    category: "avanzado"
  },
  {
    id: "big_comeback",
    title: "Gran regreso",
    description: "Recupera tu balance después de caer un 40%",
    reward: 700,
    condition: "Recuperarse de una caída del 40%",
    category: "avanzado"
  },
  {
    id: "technical_analyst",
    title: "Analista técnico",
    description: "Utiliza 5 indicadores técnicos diferentes",
    reward: 400,
    condition: "Usar 5 indicadores técnicos",
    category: "avanzado"
  },
  {
    id: "fundamental_trader",
    title: "Trader fundamental",
    description: "Opera exitosamente después de 5 anuncios de noticias",
    reward: 500,
    condition: "Operar después de noticias",
    category: "avanzado"
  },
  
  // LOGROS EXPERTOS (10)
  {
    id: "profitable",
    title: "Rentable",
    description: "Alcanza un balance de 2000",
    reward: 0,
    condition: "Llegar a un balance de 2000",
    category: "experto"
  },
  {
    id: "balance_10000",
    title: "Diez mil",
    description: "Alcanza un balance de 10000",
    reward: 1000,
    condition: "Tener 10000 en el balance",
    category: "experto"
  },
  {
    id: "consecutive_win_10",
    title: "Diez aciertos",
    description: "Gana 10 apuestas consecutivas",
    reward: 1000,
    condition: "Ganar 10 apuestas seguidas",
    category: "experto"
  },
  {
    id: "win_ratio_85",
    title: "Máquina de ganar",
    description: "Alcanza un ratio de victorias del 85%",
    reward: 1500,
    condition: "Tener 85% de victorias",
    category: "experto"
  },
  {
    id: "thousand_trades",
    title: "Trader élite",
    description: "Realiza 1000 operaciones",
    reward: 1000,
    condition: "Realizar 1000 operaciones",
    category: "experto"
  },
  {
    id: "profit_20x",
    title: "Rentabilidad x20",
    description: "Obtén 20 veces tu apuesta en una operación",
    reward: 1500,
    condition: "Ganar 20 veces lo apostado",
    category: "experto"
  },
  {
    id: "thirty_pairs",
    title: "Omnipresente",
    description: "Apuesta en 30 pares diferentes",
    reward: 1000,
    condition: "Apostar en 30 pares distintos",
    category: "experto"
  },
  {
    id: "whale",
    title: "Ballena cripto",
    description: "Realiza una operación con valor superior a 1000",
    reward: 2000,
    condition: "Operar más de 1000",
    category: "experto"
  },
  {
    id: "market_cycle",
    title: "Superviviente de ciclo",
    description: "Mantén beneficios durante un ciclo completo de mercado",
    reward: 2000,
    condition: "Beneficios en ciclo completo",
    category: "experto"
  },
  {
    id: "zero_to_hero",
    title: "De cero a héroe",
    description: "Multiplica tu balance inicial por 100",
    reward: 5000,
    condition: "Multiplicar balance x100",
    category: "experto"
  },
  
  // LOGROS AUTOMIX (7)
  {
    id: "first_automix",
    title: "Trader automatizado",
    description: "Usa AutoMix por primera vez",
    reward: 100,
    condition: "Usar AutoMix",
    category: "automix"
  },
  {
    id: "automix_profit",
    title: "Beneficio automático",
    description: "Obtén beneficios con AutoMix",
    reward: 200,
    condition: "Ganar con AutoMix",
    category: "automix"
  },
  {
    id: "automix_master",
    title: "Maestro del AutoMix",
    description: "Usa AutoMix con 5 configuraciones diferentes",
    reward: 300,
    condition: "5 configuraciones AutoMix",
    category: "automix"
  },
  {
    id: "automix_streak",
    title: "Racha automática",
    description: "Obtén 5 ganancias consecutivas con AutoMix",
    reward: 500,
    condition: "5 ganancias seguidas AutoMix",
    category: "automix"
  },
  {
    id: "automix_24h",
    title: "Trading 24/7",
    description: "Mantén AutoMix activo durante 24 horas",
    reward: 400,
    condition: "AutoMix 24h activo",
    category: "automix"
  },
  {
    id: "automix_volume",
    title: "Volumen automático",
    description: "Genera un volumen de 5000 con AutoMix",
    reward: 600,
    condition: "5000 volumen AutoMix",
    category: "automix"
  },
  {
    id: "automix_guru",
    title: "Gurú del AutoMix",
    description: "Obtén un rendimiento del 50% con AutoMix",
    reward: 1000,
    condition: "50% rendimiento AutoMix",
    category: "automix"
  },
  
  // LOGROS ESPECIALES (7)
  {
    id: "diamond_hands",
    title: "Manos de diamante",
    description: "Mantén una posición ganadora durante 7 días",
    reward: 500,
    condition: "Mantener posición 7 días",
    category: "especial"
  },
  {
    id: "phoenix",
    title: "Fénix",
    description: "Recupera tu cuenta después de caer al 10% de tu balance máximo",
    reward: 1000,
    condition: "Recuperarse desde 10%",
    category: "especial"
  },
  {
    id: "early_adopter",
    title: "Early adopter",
    description: "Regístrate durante el primer mes de la plataforma",
    reward: 500,
    condition: "Registro en primer mes",
    category: "especial"
  },
  {
    id: "crypto_wizard",
    title: "Mago cripto",
    description: "Predice correctamente 5 movimientos de mercado importantes",
    reward: 1500,
    condition: "Predecir 5 movimientos",
    category: "especial"
  },
  {
    id: "hodler",
    title: "HODLer",
    description: "No retires fondos durante 30 días con balance positivo",
    reward: 500,
    condition: "No retirar por 30 días",
    category: "especial"
  },
  {
    id: "contra_trader",
    title: "Contra-trader",
    description: "Gana 5 operaciones apostando contra la tendencia principal",
    reward: 800,
    condition: "Ganar contra tendencia",
    category: "especial"
  },
  {
    id: "crypto_legend",
    title: "Leyenda cripto",
    description: "Desbloquea el 75% de todos los logros",
    reward: 5000,
    condition: "Desbloquear 75% de logros",
    category: "especial"
  }
]

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [achievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [unlockedAchievements, setUnlockedAchievements] = useState<Array<{id: string, unlockedAt: string}>>([])
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([])
  const [gameStats, setGameStats] = useState<GameStats>(defaultGameStats)

  // Cargar logros desbloqueados al inicio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUnlocked = localStorage.getItem('unlockedAchievements')
      const savedClaimed = localStorage.getItem('claimedAchievements')
      const savedStats = localStorage.getItem('gameStats')

      if (savedUnlocked) {
        try {
          const parsed = JSON.parse(savedUnlocked)
          // Migrar datos antiguos si es necesario
          const formattedUnlocked = Array.isArray(parsed) 
            ? parsed.map(id => typeof id === 'string' 
                ? {id, unlockedAt: new Date().toLocaleString()} 
                : id)
            : []
          setUnlockedAchievements(formattedUnlocked)
        } catch (e) {
          console.error('Error parsing unlocked achievements:', e)
        }
      }
      if (savedClaimed) {
        try {
          setClaimedAchievements(JSON.parse(savedClaimed))
        } catch (e) {
          console.error('Error parsing claimed achievements:', e)
        }
      }
      if (savedStats) {
        try {
          setGameStats(JSON.parse(savedStats))
        } catch (e) {
          console.error('Error parsing game stats:', e)
        }
      }
    }
  }, [])

  // Guardar logros cuando cambien
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements))
      localStorage.setItem('claimedAchievements', JSON.stringify(claimedAchievements))
      localStorage.setItem('gameStats', JSON.stringify(gameStats))
    }
  }, [unlockedAchievements, claimedAchievements, gameStats])

  const unlockAchievement = (id: string) => {
    setUnlockedAchievements(current => {
      if (current.some(a => a.id === id)) return current
      return [...current, { id, unlockedAt: new Date().toLocaleString() }]
    })
  }

  const claimAchievement = (id: string) => {
    if (claimedAchievements.includes(id)) return 0
    
    const achievement = achievements.find(a => a.id === id)
    if (!achievement) return 0
    
    setClaimedAchievements(current => [...current, id])
    return achievement.reward
  }

  // Función para actualizar las estadísticas del juego
  const updateGameStats = (newStats: Partial<GameStats>) => {
    setGameStats(prevStats => {
      const updatedStats = { ...prevStats, ...newStats };
      localStorage.setItem("gameStats", JSON.stringify(updatedStats));
      return updatedStats;
    });
  };

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        unlockedAchievements,
        claimedAchievements,
        unlockAchievement,
        claimAchievement,
        gameStats
      }}
    >
      {children}
    </AchievementContext.Provider>
  )
}

export function useAchievement() {
  const context = useContext(AchievementContext)
  if (context === undefined) {
    throw new Error("useAchievement must be used within an AchievementProvider")
  }
  return context
}
