import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F5F3F0] pb-nav">
      <Outlet />
      <BottomNav />
    </div>
  )
}
