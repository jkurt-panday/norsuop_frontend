import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Home,
  LogOut,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLogout } from "../features/auth/mutations";
import { useCurrentUser } from "../features/auth/queries";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type SidebarItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
};
type SidebarGroupItem = {
  title: string;
  items: SidebarItem[];
};

const adminNavItems: SidebarItem[] = [
  { title: "Admin Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Activity Log", href: "/admin/activity-log", icon: Activity },
];
const staffNavItems: SidebarItem[] = [
  { title: "Dashboard", href: "/staff/staffdashboard", icon: Home },
];
const cashierNavItems: SidebarItem[] = [
  { title: "Requests", href: "/cashier/requests" },
];
const staffGroups: SidebarGroupItem[] = [
  {
    title: "Order of Payment",

    items: [
      { title: "Requests", href: "/staff/requests" },
      { title: "Bank Accounts", href: "/staff/bank-accounts" },
      {
        title: "Payment Options",
        href: "/staff/payment-options",
      },
      { title: "Memberships", href: "/staff/memberships" },
      {
        title: "Authorized Officials",
        href: "/staff/authorized-officials",
      },
      { title: "UACS", href: "/staff/uacs" },
      { title: "Course", href: "/staff/courses" },
    ],
  },
  {
    title: "Assessments",
    items: [
      { title: "Dashboard", href: "/staff/assessments/dashboard" },
      { title: "Assessments", href: "/staff/assessments" },
    ],
  },
  {
    title: "Graduate Ledger",
    items: [
      { title: "Ledger Overview", href: "/graduate-ledger" },
      { title: "Print Statement", href: "/graduate-ledger/print-select" },
    ],
  },
  {
    title: "Law Ledger",
    items: [
      { title: "Law Overview", href: "/law-ledger" },
      { title: "Print Statement", href: "/law-ledger/print-select" },
    ],
  },
];

const itemClass =
  "text-white! hover:bg-white/30! hover:text-white! data-active:bg-white! data-active:text-white!";

export function AppSidebar() {
  const { pathname } = useLocation();
  const user = useCurrentUser().data?.data;
  const logout = useLogout();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Order of Payment": true,
  });
  useEffect(() => {
    const activeGroups = Object.fromEntries(
      staffGroups
        .filter((group) => group.items.some((item) => active(item.href)))
        .map((group) => [group.title, true]),
    );
    setOpenGroups((current) => ({ ...current, ...activeGroups }));
  }, [pathname]);
  const role = user?.role;
  const isAdmin = role === "admin";
  const isCashier = role === "cashier";
  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const portal = isAdmin
    ? "Admin Portal"
    : isCashier
      ? "Cashier Portal"
      : "Staff Portal";
  const topItems = isAdmin
    ? adminNavItems
    : isCashier
      ? cashierNavItems
      : staffNavItems;
  const renderItem = (item: SidebarItem) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        className={itemClass}
        render={<Link to={item.href} />}
        isActive={active(item.href)}
        tooltip={item.title}
      >
        {item.icon ? <item.icon aria-hidden="true" /> : null}
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r! border-blue-400/20! bg-[#064b9b]! text-black!"
    >
      <SidebarHeader className="border-b! border-blue-400/20! bg-[#064b9b]! px-4 py-5!">
        <div className="flex flex-col items-center gap-2 group-data-[collapsible=icon]:px-0">
          <img
            src="/finance_logo1.png"
            alt="NORSU Order of Payment System"
            className="w-40 object-contain group-data-[collapsible=icon]:hidden"
          />
          <img
            src="/norsu.png"
            alt="NORSU"
            className="hidden size-15 object-contain group-data-[collapsible=icon]:block"
          />
          <div className="text-center group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold! text-white!">
              Order of Payment
            </p>
            <p className="text-xs! text-white/80!">{portal}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3! text-white!">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70!">
            {isAdmin ? "Admin" : isCashier ? "Cashier" : "Staff"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="text-white/70!">
              {topItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/70!">
              Staff
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{staffNavItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {!isCashier &&
          staffGroups.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel
                className="text-white/70! cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setOpenGroups((current) => ({
                    ...current,
                    [group.title]: !current[group.title],
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setOpenGroups((current) => ({
                      ...current,
                      [group.title]: !current[group.title],
                    }));
                  }
                }}
              >
                <span>{group.title}</span>
                <span className="ml-auto text-xs">{openGroups[group.title] ? "−" : "+"}</span>
              </SidebarGroupLabel>
              {openGroups[group.title] && (
                <SidebarGroupContent className="border-l! border-blue-300/40! pl-2!">
                  <SidebarMenu>
                    <SidebarMenuSub className="mx-0! border-l-0! px-0!">
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            className={itemClass}
                            render={<Link to={item.href} />}
                            isActive={active(item.href)}
                          >

        {item.icon ? <item.icon aria-hidden="true" /> : null}
        <span>{item.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarFooter className="border-t! border-blue-400/20! px-3 py-3!">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`${itemClass} dark:bg-blue-500! dark:text-white! hover:bg-red-500! hover:text-white! dark:hover:bg-red-600! dark:hover:text-white!`}
               onClick={() => logout.mutate()}
              disabled={logout.isPending}
              tooltip="Logout"
            >
              <LogOut />
              <span>{logout.isPending ? "Logging out…" : "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
