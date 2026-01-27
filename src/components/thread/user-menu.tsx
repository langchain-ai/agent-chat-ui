"use client";

import { signOut, useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function UserMenu() {
    const { data: session } = useSession();
    const user = session?.user;

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Role Display */}
                {user.role && (
                    <>
                        <DropdownMenuItem disabled className="opacity-100">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-muted-foreground">Role</span>
                                <span className="text-sm font-medium capitalize">{user.role}</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                {/* Organization Display */}
                {user.customerId && (
                    <>
                        <DropdownMenuItem disabled className="opacity-100">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-muted-foreground">Organization</span>
                                <span className="text-sm font-medium capitalize">{user.customerId}</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
