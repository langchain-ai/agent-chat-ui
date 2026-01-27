'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Building2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Organization {
    id: string;
    name: string;
}

export function OrgSwitcher() {
    const { data: session } = useSession();
    const [organizations, setOrganizations] = React.useState<Organization[]>([]);
    const [selectedOrgId, setSelectedOrgId] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);

    // Check if user is Reflexion Admin (matching sidebar logic)
    const userRole = session?.user?.role;
    const isAdmin = userRole === 'reflexion_admin' || userRole === 'admin';

    const fetchOrganizations = React.useCallback(async () => {
        if (!isAdmin) return;
        
        try {
            setLoading(true);
            const resp = await fetch('/api/organizations');
            if (resp.ok) {
                const data = await resp.json();
                setOrganizations(data);

                // Load from local storage or fallback to current session customerId
                const savedContext = localStorage.getItem('reflexion_org_context');
                if (savedContext && data.some((org: Organization) => org.id === savedContext)) {
                    setSelectedOrgId(savedContext);
                } else if (session?.user?.customerId && data.some((org: Organization) => org.id === session.user.customerId)) {
                    setSelectedOrgId(session.user.customerId);
                } else if (data.length > 0) {
                    // Fallback to first organization if saved context doesn't exist
                    setSelectedOrgId(data[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch orgs:', e);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, session?.user?.customerId]);

    React.useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    // Listen for storage events to refresh when organizations are updated in another tab
    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'reflexion_orgs_updated') {
                fetchOrganizations();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchOrganizations]);

    // Also listen for custom events (for same-tab updates)
    React.useEffect(() => {
        const handleCustomEvent = () => {
            fetchOrganizations();
        };
        window.addEventListener('organizationsUpdated', handleCustomEvent);
        return () => window.removeEventListener('organizationsUpdated', handleCustomEvent);
    }, [fetchOrganizations]);

    const handleValueChange = (orgId: string) => {
        setSelectedOrgId(orgId);
        localStorage.setItem('reflexion_org_context', orgId);
        // Reload to apply context across components
        window.location.reload();
    };

    if (!isAdmin) return null;

    if (loading && organizations.length === 0) {
        return (
            <div className="flex items-center gap-2 w-[180px] h-9">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={selectedOrgId} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[180px] h-9 bg-background border-border text-foreground">
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Organization">
                        {organizations.find(org => org.id === selectedOrgId)?.name || 'Organization'}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                    {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="focus:bg-muted focus:text-foreground">
                            {org.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
