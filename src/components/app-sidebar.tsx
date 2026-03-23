"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { SvgIcon } from "@/components/svg-icon"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { 
  Briefcase,
  ChevronRight,
  Settings,
  Moon,
  Sun,
  Headphones,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Menu items with custom SVG icons from central_icons
const menuItems = [
  {
    title: "Home",
    href: "/assistant",
    iconOutline: "/central_icons/Home.svg",
    iconFilled: "/central_icons/Home - Filled.svg",
  },
  {
    title: "Inbox",
    href: "/inbox",
    iconOutline: "/central_icons/Inbox.svg",
    iconFilled: "/central_icons/Inbox - Filled.svg",
  },
  {
    title: "Spaces",
    href: "/spaces",
    iconOutline: "/central_icons/Spaces.svg",
    iconFilled: "/central_icons/Spaces - Filled.svg",
  },
  {
    title: "Workflows",
    href: "/workflows",
    iconOutline: "/central_icons/Workflows.svg",
    iconFilled: "/central_icons/Workflows-Filled.svg",
  },
  {
    title: "History",
    href: "/history",
    iconOutline: "/central_icons/History.svg",
    iconFilled: "/central_icons/History - Filled.svg",
  },
]

// Vault projects (first 5)
const vaultProjects = [
  { id: 1, name: "Stubhub IPO Filing", href: "/stubhub-ipo-filing" },
  { id: 2, name: "M&A (US)", href: "/vault/ma-us" },
  { id: 3, name: "Cross-Border Tax Strategies", href: "/vault/cross-border-tax" },
  { id: 4, name: "Reevo AI - Series B Financing", href: "/reevo-ai-series-b" },
  { id: 5, name: "Regulatory Compliance Audit", href: "/regulatory-compliance-audit" },
]

// Bottom menu items
const bottomMenuItems = [
  {
    title: "Library",
    href: "/library",
    iconOutline: "/central_icons/Library.svg",
    iconFilled: "/central_icons/Library - Filled.svg",
  },
  {
    title: "Guidance",
    href: "/guidance",
    iconOutline: "/central_icons/Guidance.svg",
    iconFilled: "/central_icons/Guidance - Filled.svg",
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isAvatarHovered, setIsAvatarHovered] = useState(false)
  const [isVaultOpen, setIsVaultOpen] = useState<boolean | null>(null)
  const [isContractsOpen, setIsContractsOpen] = useState<boolean | null>(null)

  // Load collapsible states from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-vault-open')
    setIsVaultOpen(saved !== null ? saved === 'true' : true)
    const savedContracts = localStorage.getItem('sidebar-contracts-open')
    setIsContractsOpen(savedContracts !== null ? savedContracts === 'true' : true)
  }, [])

  useEffect(() => {
    if (isVaultOpen !== null) {
      localStorage.setItem('sidebar-vault-open', String(isVaultOpen))
    }
  }, [isVaultOpen])

  useEffect(() => {
    if (isContractsOpen !== null) {
      localStorage.setItem('sidebar-contracts-open', String(isContractsOpen))
    }
  }, [isContractsOpen])
  
  // Determine the selected item based on current path
  const getSelectedItem = () => {
    if (pathname === "/vault" || pathname === "/stubhub-ipo-filing" || pathname === "/reevo-ai-series-b" || pathname === "/regulatory-compliance-audit" || pathname.startsWith("/vault/")) {
      return "Vault"
    }
    if (pathname.startsWith("/contract-intelligence") || pathname.startsWith("/meta-contract-intelligence") || pathname.startsWith("/deflection-workflow") || pathname.startsWith("/panel-management")) {
      return "Contracts"
    }
    
    const allItems = [...menuItems, ...bottomMenuItems]
    const currentItem = allItems.find(item => item.href === pathname || pathname.startsWith(item.href + "/"))
    return currentItem?.title || "Home"
  }
  
  const selectedItem = getSelectedItem()
  
  // Reset hover state when sidebar state changes
  useEffect(() => {
    setIsAvatarHovered(false)
  }, [state])

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const renderMenuItem = (item: typeof menuItems[0], index: number) => (
    <SidebarMenuItem key={index}>
      <SidebarMenuButton
        tooltip={state === "collapsed" ? item.title : undefined}
        onClick={() => handleNavigation(item.href)}
        className={cn(
          "w-full justify-start gap-[6px] text-sm rounded-md transition-colors",
          state === "expanded" ? "px-2 h-[32px]" : "p-0 w-[32px] h-[32px] min-w-[32px] min-h-[32px] flex items-center justify-center",
          selectedItem === item.title ? "bg-bg-subtle-pressed hover:bg-bg-subtle-pressed" : "hover:bg-bg-subtle-hover"
        )}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <SvgIcon
            src={selectedItem === item.title ? item.iconFilled : item.iconOutline}
            alt={item.title}
            width={18}
            height={18}
            className={selectedItem === item.title ? "text-fg-base" : "text-fg-subtle"}
          />
        </div>
        {state === "expanded" && (
          <span className={selectedItem === item.title ? "text-fg-base" : "text-fg-subtle"}>{item.title}</span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
  
  return (
    <Sidebar collapsible="icon" className="relative border-r border-border-base bg-bg-subtle">
      <SidebarHeader className={cn(
        "p-0 relative",
        state === "collapsed" && "group"
      )}>
        {/* Whitfield & Crane logo/avatar */}
        <div className={cn(
          "flex items-center h-14 transition-colors",
          state === "expanded" ? "px-2 gap-[6px]" : "px-2 justify-center"
        )}>
          {state === "expanded" ? (
            // Expanded state: avatar + name together with dropdown
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-[6px] min-w-0 flex-1 rounded-md px-2 h-[32px] hover:bg-bg-subtle-hover transition-colors">
                    <Image
                      src="/whitefield_logo.png"
                      alt="Whitfield & Crane LLP"
                      width={20}
                      height={20}
                      className="rounded-[4px] shrink-0"
                    />
                    <span className="text-sm font-medium text-fg-base truncate min-w-0">
                      Whitfield & Crane LLP
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "light" ? (
                      <>
                        <Moon className="w-4 h-4" />
                        <span>Lights off</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        <span>Lights on</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Headphones className="w-4 h-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={toggleSidebar}
                className="shrink-0 w-[32px] h-[32px] rounded-md hover:bg-bg-subtle-hover transition-colors flex items-center justify-center"
              >
                <SvgIcon 
                  src="/central_icons/LeftSidebar - Filled.svg" 
                  alt="Close sidebar"
                  width={18}
                  height={18}
                  className="text-fg-subtle"
                />
              </button>
            </>
          ) : (
            // Collapsed state: just avatar with expand tooltip
            <button 
              onClick={toggleSidebar}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
              className={cn(
                "shrink-0 w-[32px] h-[32px] rounded-md transition-colors flex items-center justify-center relative",
                "hover:bg-bg-subtle-hover"
              )}
            >
              {isAvatarHovered ? (
                <SvgIcon 
                  src="/central_icons/LeftSidebar.svg" 
                  alt="Open sidebar"
                  width={18}
                  height={18}
                  className="text-fg-subtle"
                />
              ) : (
                <Image
                  src="/whitefield_logo.png"
                  alt="Whitfield & Crane LLP"
                  width={20}
                  height={20}
                  className="rounded-[4px]"
                />
              )}
              {isAvatarHovered && (
                <div className="absolute left-full ml-2 bg-bg-interactive text-fg-on-color rounded-md px-2 py-1 shadow-md whitespace-nowrap z-50">
                  <span className="text-xs">
                    Expand sidebar
                  </span>
                </div>
              )}
            </button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-bg-subtle">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className={cn(
              "gap-1 py-2",
              state === "expanded" ? "px-2" : "px-2"
            )}>
              {/* Regular menu items */}
              {menuItems.map((item, index) => renderMenuItem(item, index))}
              
              {/* Vault with collapsible sub-items */}
              <Collapsible
                open={!!isVaultOpen && state === "expanded"}
                onOpenChange={setIsVaultOpen}
                className="group/collapsible"
              >
                {(() => {
                  // Vault menu item should only show active state when:
                  // 1. On /vault page directly, OR
                  // 2. On a vault project AND (submenu is closed OR sidebar is collapsed)
                  const isOnVaultProject = pathname === "/stubhub-ipo-filing" || pathname === "/reevo-ai-series-b" || pathname === "/regulatory-compliance-audit" || pathname.startsWith("/vault/")
                  const isSubmenuVisible = isVaultOpen && state === "expanded"
                  const isVaultItemActive = pathname === "/vault" || (isOnVaultProject && !isSubmenuVisible)
                  
                  return (
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={state === "collapsed" ? "Vault" : undefined}
                          onClick={() => {
                            if (state === "collapsed") {
                              handleNavigation("/vault")
                            }
                          }}
                          className={cn(
                            "w-full justify-start gap-[6px] text-sm rounded-md transition-colors",
                            state === "expanded" ? "px-2 h-[32px]" : "p-0 w-[32px] h-[32px] min-w-[32px] min-h-[32px] flex items-center justify-center",
                            isVaultItemActive ? "bg-bg-subtle-pressed hover:bg-bg-subtle-pressed" : "hover:bg-bg-subtle-hover"
                          )}
                        >
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <SvgIcon
                              src={isVaultItemActive ? "/central_icons/Vault - Filled.svg" : "/central_icons/Vault.svg"}
                              alt="Vault"
                              width={18}
                              height={18}
                              className={isVaultItemActive ? "text-fg-base" : "text-fg-subtle"}
                            />
                          </div>
                          {state === "expanded" && (
                            <>
                              <span className={cn("flex-1", isVaultItemActive ? "text-fg-base" : "text-fg-subtle")}>Vault</span>
                              <ChevronRight className="w-4 h-4 text-fg-muted transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {vaultProjects.map((project) => {
                        const isActive = pathname === project.href
                        return (
                          <SidebarMenuSubItem key={project.id}>
                            <SidebarMenuSubButton
                              onClick={() => handleNavigation(project.href)}
                              isActive={isActive}
                              className={cn("cursor-pointer", isActive ? "text-fg-base" : "")}
                            >
                              <span className="truncate">{project.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => handleNavigation("/vault")}
                          className="cursor-pointer text-fg-muted"
                        >
                          <span>View all...</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
                  )
                })()}
              </Collapsible>

              {/* Contracts with collapsible sub-items */}
              <Collapsible
                open={!!isContractsOpen && state === "expanded"}
                onOpenChange={setIsContractsOpen}
                className="group/contracts"
              >
                {(() => {
                  const isOnContractsPage = pathname.startsWith("/contract-intelligence") || pathname.startsWith("/meta-contract-intelligence") || pathname.startsWith("/deflection-workflow") || pathname.startsWith("/panel-management")
                  const isSubmenuVisible = isContractsOpen && state === "expanded"
                  const isContractsItemActive = isOnContractsPage && !isSubmenuVisible

                  return (
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={state === "collapsed" ? "Contracts" : undefined}
                          onClick={() => {
                            if (state === "collapsed") {
                              handleNavigation("/contract-intelligence/overview")
                            }
                          }}
                          className={cn(
                            "w-full justify-start gap-[6px] text-sm rounded-md transition-colors",
                            state === "expanded" ? "px-2 h-[32px]" : "p-0 w-[32px] h-[32px] min-w-[32px] min-h-[32px] flex items-center justify-center",
                            isContractsItemActive ? "bg-bg-subtle-pressed hover:bg-bg-subtle-pressed" : "hover:bg-bg-subtle-hover"
                          )}
                        >
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Briefcase
                              className={cn("w-[18px] h-[18px]", isContractsItemActive ? "text-fg-base" : "text-fg-subtle")}
                            />
                          </div>
                          {state === "expanded" && (
                            <>
                              <span className={cn("flex-1", isContractsItemActive ? "text-fg-base" : "text-fg-subtle")}>Contracts</span>
                              <ChevronRight className="w-4 h-4 text-fg-muted transition-transform duration-200 group-data-[state=open]/contracts:rotate-90" />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {[
                            { name: "Command Center", href: "/meta-contract-intelligence/trends" },
                            { name: "Pipeline", href: "/contract-intelligence/overview" },
                            { name: "Playbooks", href: "/contract-intelligence/playbooks" },
                            { name: "Clause Library", href: "/contract-intelligence/clauses" },
                            { name: "Deflection Workflow", href: "/deflection-workflow" },
                            { name: "Panel Management", href: "/panel-management" },
                          ].map((item) => {
                            const isActive = pathname === item.href
                            return (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                  onClick={() => handleNavigation(item.href)}
                                  isActive={isActive}
                                  className={cn("cursor-pointer", isActive ? "text-fg-base" : "")}
                                >
                                  <span className="truncate">{item.name}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  )
                })()}
              </Collapsible>
              
              {/* Bottom menu items */}
              {bottomMenuItems.map((item, index) => renderMenuItem(item, index + menuItems.length + 1))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
