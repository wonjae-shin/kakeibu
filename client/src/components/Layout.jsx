import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <Outlet />
      <BottomNav />
    </div>
  )
}
