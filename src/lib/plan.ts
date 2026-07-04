export const PLAN_LIMITS = {
  free:  { ordersPerMonth: 30, produk: 20,       label: 'Free',    color: 'gray' },
  pro:   { ordersPerMonth: Infinity, produk: Infinity, label: 'Pro', color: 'blue' },
  elite: { ordersPerMonth: Infinity, produk: Infinity, label: 'Elite', color: 'purple' },
}

export type PlanKey = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.free
}

export function isPlanExpired(planExpires: Date | null): boolean {
  if (!planExpires) return false
  return new Date() > new Date(planExpires)
}

export function getEffectivePlan(plan: string, planExpires: Date | null): string {
  if (plan !== 'free' && isPlanExpired(planExpires)) return 'free'
  return plan
}
