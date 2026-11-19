import { Link, useLocation } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "../features/auth/queries";

export function Navbar() {
  const { pathname } = useLocation();
  const user = useCurrentUser().data?.data;
  const label = pathname.split("/").filter(Boolean).pop()?.replaceAll("-", " ") ?? "Dashboard";
  return <header className="flex h-16 items-center gap-4 border-b border-blue-400/20 bg-[#064b9b]! px-4 text-white md:px-6"><SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" /><nav className="flex items-center gap-2 text-sm"><Link to="/welcome" className="text-white/70 hover:text-white">Home</Link><span className="text-white/50">/</span><span className="capitalize">{label}</span></nav>{user?.name && <span className="ml-auto hidden truncate text-sm font-medium text-white/90 sm:block">Hello, {user.name}!</span>}</header>;
}
