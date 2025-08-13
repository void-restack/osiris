import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { getAuthState } from '@/lib/auth-utils'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { userQueries, creditQueries, packageQueries } from '@/lib/queries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icon } from '@/components/ui/icon'
import { PackagesTable } from '@/components/features/packages-table/packages-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { useState } from 'react'

export const Route = createFileRoute('/_hub/profile')({
    component: RouteComponent,
    beforeLoad: async ({ context: { queryClient } }) => {
        const auth = await getAuthState(queryClient);

        if (!auth.isAuthenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: '/profile',
                },
            });
        }

        return { auth };
    },
})

function RouteComponent() {
    const { data: user, isPending: userLoading } = useQuery(userQueries.meOptions());
    const { data: creditBalance, isPending: creditLoading } = useQuery(creditQueries.balanceOptions());

    // State for different table instances
    const [packagesTable, setPackagesTable] = useState<any>(null);
    const [knowledgeBasesTable, setKnowledgeBasesTable] = useState<any>(null);
    const [oauthClientsTable, setOauthClientsTable] = useState<any>(null);

    // Track active tab
    const [activeTab, setActiveTab] = useState<string>("oauth-clients");

    const formatCredits = (credits: string) => {
        const numCredits = parseFloat(credits);
        const formattedCredits = Math.floor(numCredits).toLocaleString();
        return formattedCredits;
    };

    // Get the current active table based on the selected tab
    const getCurrentTable = () => {
        switch (activeTab) {
            case "mcps":
                return packagesTable;
            case "knowledge-bases":
                return knowledgeBasesTable;
            case "oauth-clients":
                return oauthClientsTable;
            default:
                return null;
        }
    };

    return (
        <div className='h-full'>
            <div className="pt-10 px-8 flex gap-32 flex-col w-full">
                <div className="w-full flex items-center justify-between">
                    <div className="flex flex-col items-start">
                        {creditLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : creditBalance ? (
                            <>
                                <h2 className="text-[32px]">
                                    {formatCredits(creditBalance.totalCredits)} <span className="text-primary-300">Credits</span>
                                </h2>
                                <span className="text-[13px] text-primary-300">Osiris Credit Balance</span>
                            </>
                        ) : (
                            <>
                                <h2 className="text-[32px]">0 <span className="text-primary-300">Credits</span></h2>
                                <span className="text-[13px] text-primary-300">Osiris Credit Balance</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-[52px] w-[174px] flex bg-primary-50 rounded-[8px] items-center px-2 gap-[12px]">
                            {userLoading ? (
                                <>
                                    <Skeleton className="size-8 rounded-md" />
                                    <div className="flex flex-col space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </>
                            ) : user ? (
                                <>
                                    <Avatar className="size-8">
                                        <AvatarFallback className="bg-primary-300 text-white text-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm truncate">{user.name}</h3>
                                        <p className="text-[13px] truncate text-primary-300">{user.email}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-purple-300 size-8 rounded-md" />
                                    <div className="flex flex-col">
                                        <h3 className="text-sm truncate">Loading...</h3>
                                        <p className="text-[13px] truncate text-primary-300">Loading...</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="h-[52px] w-[30px] bg-primary-800 flex items-center justify-center rounded-[8px] inset-shadow-search-btn">
                            <PlusIcon className="text-primary-00 size-4" />
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="oauth-clients" className='px-0 flex gap-2 items-center'>
                            <Icon name="ai" />
                            OAuth Clients</TabsTrigger>
                        <TabsTrigger value="mcps" className='px-0 mx-6 flex gap-2 items-center'>
                            <Icon name="code" />
                            Developed MCP's</TabsTrigger>
                        <TabsTrigger value="knowledge-bases" className='px-0 flex items-center gap-2'>
                            <Icon name="file" />
                            Knowledge Bases</TabsTrigger>
                    </TabsList>
                    <TabsContent value="oauth-clients" className="mt-10">
                        {user?.id ? (
                            <div className="text-center py-12">
                                <Icon name="ai" className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">OAuth Clients</h3>
                                <p className="text-gray-500">
                                    OAuth clients functionality coming soon.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Skeleton className="h-8 w-48 mx-auto mb-4" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="mcps" className="mt-10">
                        {user?.id ? (
                            <PackagesTable
                                customFilters={{ publisherId: user.id }}
                                title="Developed MCPs"
                                onTableReady={setPackagesTable}
                                showPagination={false}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <Skeleton className="h-8 w-48 mx-auto mb-4" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="knowledge-bases" className="mt-10">
                        {user?.id ? (
                            <div className="text-center py-12">
                                <Icon name="file" className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">My Knowledge Bases</h3>
                                <p className="text-gray-500">
                                    Knowledge bases functionality coming soon.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Skeleton className="h-8 w-48 mx-auto mb-4" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <div className="absolute bottom-0 border-t border-t-primary-100 flex h-12 w-full items-center overflow-hidden rounded-b-xl bg-primary-00 p-6">
                {getCurrentTable() && <DataTablePagination table={getCurrentTable()} />}
            </div>
        </div>
    )
}
