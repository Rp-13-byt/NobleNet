import { useAuthStore, Role } from "@/store/authStore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function DemoSwitcher() {
  const { user, setDemoRole } = useAuthStore()

  const handleRoleChange = (val: string) => {
    if (val === "none") {
      setDemoRole(null)
    } else {
      setDemoRole(val as Role)
    }
  }

  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border p-4 rounded-lg shadow-lg flex flex-col gap-2 w-[250px]">
      <div className="text-sm font-semibold mb-1">Demo Mode</div>
      <Select value={user?.role || "none"} onValueChange={handleRoleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Public (Logged Out)</SelectItem>
          <SelectItem value="USER">User (Donor/Volunteer)</SelectItem>
          <SelectItem value="NGO">NGO Admin</SelectItem>
          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={resetData} className="w-full mt-2">
        Reset Demo Data
      </Button>
    </div>
  )
}
