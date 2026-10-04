import { Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

export function DashboardLayout() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral-50/50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-primary flex items-center gap-2">
            <img src="/logo.png" alt="NobleNet Logo" className="h-8 w-auto mix-blend-multiply" />
            NobleNet Dashboard
          </div>
          <div className="text-sm font-medium">Logged in as: {user?.name}</div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
