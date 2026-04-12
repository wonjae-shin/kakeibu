import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getPendingCount } from '@/api/notifications.js'

export default function BottomNav() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPendingCount()
        setPendingCount(res.data?.count || 0)
      } catch { /* ignore */ }
    }
    fetch()
    const timer = setInterval(fetch, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 flex items-center justify-around z-50"
      style={{ height: 'calc(4rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <TabItem to="/" label="홈" icon={HomeIcon} end />
      <TabItem to="/transactions" label="내역" icon={ListIcon} />
      <NavLink
        to="/transactions/new"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg -mt-5"
      >
        <PlusIcon className="w-7 h-7 text-white" />
      </NavLink>
      <TabItem to="/budget" label="예산" icon={BudgetIcon} />
      <TabItem to="/notifications" label="알림" icon={BellIcon} badge={pendingCount} />
    </nav>
  )
}

function TabItem({ to, label, icon: Icon, end = false, badge = 0 }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 ${
          isActive ? 'text-primary' : 'text-gray-400'
        }`
      }
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function ListIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}
function BudgetIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}