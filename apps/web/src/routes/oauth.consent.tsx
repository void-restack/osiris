import { hubQueries, packageQueries, userQueries } from '@/lib/queries'
import { useCreateServiceConnectionMutation, useDeployPackageMutation, useAuthorizeOsirisMutation } from '@/lib/mutations'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PermissionSelector, type Permission } from '@/components/ui/permission-selector'
import { cn } from '@/lib/utils'
import z from 'zod'

const OauthSeachSchema = z.object({
  clientId: z.string().optional(),
  redirect_uri: z.string().optional(),
  state: z.string().optional(),
  scope: z.string().optional(),
  response_type: z.string().optional(),
  package_id: z.string().optional(),
})

type OAuthSearchParams = z.infer<typeof OauthSeachSchema>

export const Route = createFileRoute('/oauth/consent')({
  component: RouteComponent,
})

function RouteComponent() {
  // const { clientId, redirect_uri, state, scope, response_type, package_ids } = Route.useSearch()
// '5940d857-72c2-419f-a2d7-512df8afb2b0'
  const clientId = '5940d857-72c2-419f-a2d7-512df8afb2b0' // '09f123ea-7bfe-44c0-9f72-f517fa739531'
  const redirect_uri = 'http://localhost:3000/osiris/callback'
  const state = ''
  const scopes = ['osiris:auth']
  const response_type = ''
  const package_id = '58583b9f-738e-4db2-9384-9dafea4c0a10' // 'd9b33aef-b3a4-45e8-9fa1-0f33353530f5'
//'58583b9f-738e-4db2-9384-9dafea4c0a10' //
  const [selectedDeploymentAction, setSelectedDeploymentAction] = useState<'new' | 'existing'>('new')
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>('')
  const [selectedAuthConnections, setSelectedAuthConnections] = useState<Record<string, string>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API CALL: GET /packages/:packageId - For each package_id to get package details
  const { data: packageDetails } = useSuspenseQuery(packageQueries.detailOptions(package_id as string))

  // packageDetails response example:
  //   {
  //     "packageId": "d9b33aef-b3a4-45e8-9fa1-0f33353530f5",
  //     "name": "World of AI MCP",
  //     "description": "First agentic game giving user delightful alt history experience with comic generation and historical fact checker",
  //     "publisherId": "55b91688-9a2b-4500-80cc-14c289443b97",
  //     "clientId": "09f123ea-7bfe-44c0-9f72-f517fa739531",
  //     "latestVersion": "1.0.0",
  //     "metadata": {
  //         "author": "Osiris AI",
  //         "license": "MIT",
  //         "repository": "https://github.com/osiris-labs-ai/examples"
  //     },
  //     "embedding": null,
  //     "tags": [],
  //     "iconUrl": null,
  //     "coverImageUrl": null,
  //     "createdAt": "2025-07-22T08:56:40.688Z",
  //     "updatedAt": "2025-07-22T08:56:40.688Z"
  // }

  // GET /packages/:packageId/auth-scopes - Get required auth scopes for each package
  
  const { data: authScopes } = useSuspenseQuery(packageQueries.authScopesOptions(package_id as string))

  // authScopes response example:
  //   {
  //     "packageId": "d9b33aef-b3a4-45e8-9fa1-0f33353530f5",
  //     "name": "World of AI MCP",
  //     "description": "First agentic game giving user delightful alt history experience with comic generation and historical fact checker",
  //     "publisherId": "55b91688-9a2b-4500-80cc-14c289443b97",
  //     "clientId": "09f123ea-7bfe-44c0-9f72-f517fa739531",
  //     "latestVersion": "1.0.0",
  //     "metadata": {
  //         "author": "Osiris AI",
  //         "license": "MIT",
  //         "repository": "https://github.com/osiris-labs-ai/examples"
  //     },
  //     "embedding": null,
  //     "tags": [],
  //     "iconUrl": null,
  //     "coverImageUrl": null,
  //     "createdAt": "2025-07-22T08:56:40.688Z",
  //     "updatedAt": "2025-07-22T08:56:40.688Z",
  //     "serviceClientMap": {
  //         "google": [
  //             "google:https://www.googleapis.com/auth/userinfo.profile",
  //             "google:https://www.googleapis.com/auth/userinfo.email"
  //         ]
  //     }
  // }

  // TODO: API CALL: GET /hub/auth - Get all available auth methods (google, github, etc.)
  // const { data: availableAuthMethods } = useSuspenseQuery(authQueries.availableMethodsOptions())

  // get user info

  const { data: userInfo } = useSuspenseQuery(userQueries.meOptions())

  // API CALL: GET /hub/auth/user - Get user's existing auth connections
  let { data: userAuthConnections } = useSuspenseQuery(hubQueries.userAuthOptions())
  /** USER auth connections response example:
   * [
    {
        "user_service_connections": {
            "id": "4cfa3b20-296a-4e02-bf19-f932dd32587c",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "b6ccc1d6-ffc0-444e-a397-3578711212d4",
            "uniqueId": "57b2a460-fcfe-4f09-8ef4-edd50db3bc46",
            "credentials": {
                "hasCredentials": true,
                "credentialType": "oauth"
            },
            "metadata": {
                "user": {
                    "id": "57b2a460-fcfe-4f09-8ef4-edd50db3bc46",
                    "name": "Rahul Kulkarni",
                    "email": "rahul@fetcch.xyz",
                    "uniqueId": "57b2a460-fcfe-4f09-8ef4-edd50db3bc46"
                }
            },
            "policy": {},
            "scopes": [
                "linear:read",
                "linear:write"
            ],
            "name": "linear connection",
            "createdAt": "2025-07-31T10:59:47.506Z",
            "updatedAt": "2025-07-31T10:59:47.506Z"
        },
        "service_clients": {
            "clientId": "b6ccc1d6-ffc0-444e-a397-3578711212d4",
            "name": "linear",
            "description": "Linear is a project management tool that helps teams track and manage their work.",
            "type": "oauth",
            "supportedScopes": [
                "read",
                "write"
            ],
            "scopeDefinitions": {
                "read": "Read",
                "write": "Write"
            },
            "supportedServices": [
                "linear"
            ],
            "metadata": {
                "authUrl": "https://linear.app/oauth/authorize",
                "tokenUrl": "https://api.linear.app/oauth/token",
                "baseApiUrl": "https://api.linear.app",
                "allowedScopes": [
                    "read",
                    "write"
                ]
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.559Z",
            "updatedAt": "2025-07-06T14:39:40.559Z",
            "iconUrl": null
        }
    },
    {
        "user_service_connections": {
            "id": "e01e580e-8add-48f4-9a21-8b257938a5c4",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "b6ccc1d6-ffc0-444e-a397-3578711212d4",
            "uniqueId": "85719e88-2dda-4a75-b6c9-c5a71eb4ba83",
            "credentials": {
                "hasCredentials": true,
                "credentialType": "oauth"
            },
            "metadata": {
                "user": {
                    "id": "85719e88-2dda-4a75-b6c9-c5a71eb4ba83",
                    "name": "Rahul Kulkarni",
                    "email": "rahul@fetcch.xyz",
                    "uniqueId": "85719e88-2dda-4a75-b6c9-c5a71eb4ba83"
                }
            },
            "policy": {},
            "scopes": [
                "linear:read",
                "linear:write"
            ],
            "name": null,
            "createdAt": "2025-07-07T09:28:01.188Z",
            "updatedAt": "2025-07-07T09:28:01.188Z"
        },
        "service_clients": {
            "clientId": "b6ccc1d6-ffc0-444e-a397-3578711212d4",
            "name": "linear",
            "description": "Linear is a project management tool that helps teams track and manage their work.",
            "type": "oauth",
            "supportedScopes": [
                "read",
                "write"
            ],
            "scopeDefinitions": {
                "read": "Read",
                "write": "Write"
            },
            "supportedServices": [
                "linear"
            ],
            "metadata": {
                "authUrl": "https://linear.app/oauth/authorize",
                "tokenUrl": "https://api.linear.app/oauth/token",
                "baseApiUrl": "https://api.linear.app",
                "allowedScopes": [
                    "read",
                    "write"
                ]
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.559Z",
            "updatedAt": "2025-07-06T14:39:40.559Z",
            "iconUrl": null
        }
    },
    {
        "user_service_connections": {
            "id": "d21e6bce-9dc6-4181-8378-b67e49a64024",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "86db0477-d793-4b3a-b85c-0e57d466eef2",
            "uniqueId": "162591301",
            "credentials": {
                "hasCredentials": true,
                "credentialType": "oauth"
            },
            "metadata": {
                "user": {
                    "id": "162591301",
                    "name": "void",
                    "email": "rahul@fetcch.xyz",
                    "uniqueId": "162591301",
                    "avatar_url": "https://avatars.githubusercontent.com/u/162591301?v=4",
                    "email_verified": true
                }
            },
            "policy": {},
            "scopes": [
                "github:gist",
                "github:read:org",
                "github:repo",
                "github:user",
                "github:workflow"
            ],
            "name": "githusdvdsvb connection",
            "createdAt": "2025-07-06T16:29:26.038Z",
            "updatedAt": "2025-07-06T16:29:26.038Z"
        },
        "service_clients": {
            "clientId": "86db0477-d793-4b3a-b85c-0e57d466eef2",
            "name": "github",
            "description": "GitHub is a web-based hosting service for version control using Git.",
            "type": "oauth",
            "supportedScopes": [
                "user",
                "user:email",
                "repo",
                "read:org",
                "user:follow",
                "gist",
                "workflow",
                "delete_repo"
            ],
            "scopeDefinitions": {
                "gist": "Get Gist",
                "repo": "Get Repo",
                "user": "Get User",
                "read:org": "Read Organization",
                "workflow": "Get Workflow",
                "user:email": "Get User Email",
                "delete_repo": "Delete Repository",
                "user:follow": "Follow User"
            },
            "supportedServices": [
                "github",
                "gist"
            ],
            "metadata": {
                "authUrl": "https://github.com/login/oauth/authorize",
                "tokenUrl": "https://github.com/login/oauth/access_token",
                "baseApiUrl": "https://api.github.com",
                "allowedScopes": [
                    "user",
                    "user:email",
                    "repo",
                    "read:org",
                    "user:follow",
                    "gist",
                    "workflow",
                    "delete_repo"
                ]
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.554Z",
            "updatedAt": "2025-07-06T14:39:40.554Z",
            "iconUrl": null
        }
    },
    {
        "user_service_connections": {
            "id": "644765ba-c965-462b-b10a-7d62d15237d9",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "54386be9-487e-487a-bf3f-8b320f97a498",
            "uniqueId": "db_1",
            "credentials": {
                "keyVersion": "projects/osiris-464611/locations/global/keyRings/osiris-hub-keyring/cryptoKeys/osiris-hub-secret-key/cryptoKeyVersions/1",
                "encryptedKey": "CiQAbj1GwXJu6ubfyCa24pVmSgnaRkrDC/bjTitWQuzwHv3UpVYSSQAIwzoIX9+Vs2m+c94BEGyaSAS7cnkbmJSuqlzCV7Or2x2rKfnTj6xo0EJqm9ACSS6GUWZcuFxW9eB5K01prZ8BWQVpgexrunM=",
                "encryptedData": "pnBVOC1WFWGCCaNGifuC6JBHGQQIwDqDoNpjCzqpn/X9U+BdAeB6mg8+QINuJWEziF4kdmK8Na62GZF2L3A91JEBx71FO0oAjkt8ZA=="
            },
            "metadata": {},
            "policy": {},
            "scopes": [],
            "name": "db_1",
            "createdAt": "2025-07-29T06:46:57.682Z",
            "updatedAt": "2025-07-29T06:46:57.682Z"
        },
        "service_clients": {
            "clientId": "54386be9-487e-487a-bf3f-8b320f97a498",
            "name": "postgres",
            "description": "Postgres is a powerful, open-source object-relational database management system that uses SQL to manage data.",
            "type": "secret_sharing",
            "supportedScopes": [],
            "scopeDefinitions": {},
            "supportedServices": [
                "postgres"
            ],
            "metadata": {
                "type": "object",
                "required": [
                    "db_url"
                ],
                "properties": {
                    "db_url": {
                        "type": "string",
                        "title": "Database URL",
                        "format": "uri",
                        "description": "Complete PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/db"
                    }
                },
                "additionalProperties": false
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.557Z",
            "updatedAt": "2025-07-06T14:39:40.557Z",
            "iconUrl": null
        }
    },
    {
        "user_service_connections": {
            "id": "df41d399-c946-44c6-95d4-7e4ccc90c93e",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "1d927d6c-2170-41d5-ac1b-00c4cdc3259d",
            "uniqueId": "f668823f-1fa2-487e-a4b2-efcba6eafc53",
            "credentials": {
                "hasCredentials": true,
                "credentialType": "embedded_wallet"
            },
            "metadata": {
                "id": "f668823f-1fa2-487e-a4b2-efcba6eafc53",
                "name": "wallet_1",
                "accounts": {
                    "id": "efe78c84-55ce-5aa1-a38f-df47f957b0fa",
                    "chains": [
                        "evm:eip155:1"
                    ],
                    "addresses": [
                        {
                            "curve": "CURVE_SECP256K1",
                            "chains": [
                                "evm:eip155:1"
                            ],
                            "address": "0x52f9f3FeE38377ea7c5C62dE8191AE118024c495",
                            "addressFormat": "ADDRESS_FORMAT_ETHEREUM",
                            "derivationPath": "m/44'/60'/0'/0/0"
                        }
                    ],
                    "mnemonicLength": 24
                }
            },
            "policy": {},
            "scopes": [],
            "name": "wallet_1",
            "createdAt": "2025-07-29T06:52:01.519Z",
            "updatedAt": "2025-07-29T06:52:01.519Z"
        },
        "service_clients": {
            "clientId": "1d927d6c-2170-41d5-ac1b-00c4cdc3259d",
            "name": "turnkey",
            "description": "Turnkey is a platform for creating and managing your own wallets.",
            "type": "embedded_wallet",
            "supportedScopes": [],
            "scopeDefinitions": {},
            "supportedServices": [
                "turnkey"
            ],
            "metadata": {
                "authUrl": "https://api.turnkey.com/v1/oauth/authorize",
                "tokenUrl": "https://api.turnkey.com/v1/oauth/token",
                "baseApiUrl": "https://api.turnkey.com/v1"
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.568Z",
            "updatedAt": "2025-07-06T14:39:40.568Z",
            "iconUrl": null
        }
    },
    {
        "user_service_connections": {
            "id": "1d454c8e-c135-45b5-bb16-8539216695b5",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "40560a08-6a75-4b53-9442-872af3be31d6",
            "uniqueId": "107758726470995891688",
            "credentials": {
                "hasCredentials": true,
                "credentialType": "oauth"
            },
            "metadata": {
                "user": {
                    "sub": "107758726470995891688",
                    "name": "rahul c.",
                    "email": "rahul@fetcch.xyz",
                    "picture": "https://lh3.googleusercontent.com/a/ACg8ocK3Xm6zvzfBcwkU4z4z2zRXUKwg1ROYFgRhl4Zclc9pDACpuw=s96-c",
                    "uniqueId": "107758726470995891688",
                    "email_verified": true
                }
            },
            "policy": {},
            "scopes": [
                "google:https://www.googleapis.com/auth/userinfo.email",
                "google:https://www.googleapis.com/auth/userinfo.profile",
                "google:openid"
            ],
            "name": "World of AI MCP - google",
            "createdAt": "2025-07-06T16:27:16.090Z",
            "updatedAt": "2025-07-06T16:27:16.090Z"
        },
        "service_clients": {
            "clientId": "40560a08-6a75-4b53-9442-872af3be31d6",
            "name": "google",
            "description": "Google is a search engine and cloud computing company that provides a variety of services, including search, email, calendar, and document creation.",
            "type": "oauth",
            "supportedScopes": [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://mail.google.com/",
                "https://www.googleapis.com/auth/gmail.compose",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.metadata",
                "https://www.googleapis.com/auth/gmail.labels",
                "https://www.googleapis.com/auth/gmail.addons.current.message.action",
                "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
                "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
                "https://www.googleapis.com/auth/gmail.settings.basic",
                "https://www.googleapis.com/auth/gmail.settings.sharing",
                "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
                "https://www.googleapis.com/auth/gmail.insert",
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/drive.appdata",
                "https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/drive.metadata",
                "https://www.googleapis.com/auth/drive.metadata.readonly",
                "https://www.googleapis.com/auth/drive.photos.readonly",
                "https://www.googleapis.com/auth/drive.readonly",
                "https://www.googleapis.com/auth/drive.apps.readonly",
                "https://www.googleapis.com/auth/drive.meet.readonly",
                "https://www.googleapis.com/auth/drive.scripts",
                "https://www.googleapis.com/auth/youtube",
                "https://www.googleapis.com/auth/youtube.force-ssl",
                "https://www.googleapis.com/auth/youtubepartner",
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/youtubepartner-channel-audit",
                "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.app.created",
                "https://www.googleapis.com/auth/calendar.calendars",
                "https://www.googleapis.com/auth/calendar.acls",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/calendar.events.owned",
                "https://www.googleapis.com/auth/calendar.calendarlist",
                "https://www.googleapis.com/auth/calendar.calendars.readonly",
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.acls.readonly",
                "https://www.googleapis.com/auth/calendar.events.freebusy",
                "https://www.googleapis.com/auth/calendar.events.owned.readonly",
                "https://www.googleapis.com/auth/calendar.events.public.readonly",
                "https://www.googleapis.com/auth/calendar.events.readonly",
                "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
                "https://www.googleapis.com/auth/calendar.settings.readonly",
                "https://www.googleapis.com/auth/calendar.freebusy",
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/spreadsheets.readonly"
            ],
            "scopeDefinitions": {
                "openid": "OpenID",
                "https://mail.google.com/": "Access Gmail (Read, Write, Modify)",
                "https://www.googleapis.com/auth/drive": "Access Drive (Read, Write, Delete)",
                "https://www.googleapis.com/auth/youtube": "Access Youtube (Read, Write, Delete)",
                "https://www.googleapis.com/auth/calendar": "Access Calendar (Read, Write, Delete)",
                "https://www.googleapis.com/auth/drive.file": "Access Drive File",
                "https://www.googleapis.com/auth/gmail.send": "Send Email",
                "https://www.googleapis.com/auth/gmail.insert": "Insert Email",
                "https://www.googleapis.com/auth/gmail.labels": "Access Gmail Labels",
                "https://www.googleapis.com/auth/gmail.modify": "Modify Email",
                "https://www.googleapis.com/auth/spreadsheets": "Access Spreadsheets (Read, Write, Delete)",
                "https://www.googleapis.com/auth/calendar.acls": "Access Calendar ACLs",
                "https://www.googleapis.com/auth/drive.appdata": "Access Drive Appdata",
                "https://www.googleapis.com/auth/drive.scripts": "Access Drive Scripts",
                "https://www.googleapis.com/auth/gmail.compose": "Compose Email",
                "https://www.googleapis.com/auth/drive.metadata": "Access Drive Metadata",
                "https://www.googleapis.com/auth/drive.readonly": "Access Drive Readonly",
                "https://www.googleapis.com/auth/gmail.metadata": "Access Gmail Metadata",
                "https://www.googleapis.com/auth/gmail.readonly": "Read Email",
                "https://www.googleapis.com/auth/userinfo.email": "Get User Email",
                "https://www.googleapis.com/auth/youtube.upload": "Access Youtube Upload",
                "https://www.googleapis.com/auth/youtubepartner": "Access Youtube Partner",
                "https://www.googleapis.com/auth/calendar.events": "Access Calendar Events",
                "https://www.googleapis.com/auth/userinfo.profile": "Get User Profile",
                "https://www.googleapis.com/auth/youtube.readonly": "Access Youtube Readonly",
                "https://www.googleapis.com/auth/calendar.freebusy": "Access Calendar Freebusy",
                "https://www.googleapis.com/auth/calendar.readonly": "Access Calendar Readonly",
                "https://www.googleapis.com/auth/youtube.force-ssl": "Access Youtube Force SSL",
                "https://www.googleapis.com/auth/calendar.calendars": "Access Calendar Calendars",
                "https://www.googleapis.com/auth/drive.apps.readonly": "Access Drive Apps Readonly",
                "https://www.googleapis.com/auth/drive.meet.readonly": "Access Drive Meet Readonly",
                "https://www.googleapis.com/auth/calendar.app.created": "Access Calendar App Created",
                "https://www.googleapis.com/auth/gmail.settings.basic": "Access Gmail Settings Basic",
                "https://www.googleapis.com/auth/calendar.calendarlist": "Access Calendar Calendarlist",
                "https://www.googleapis.com/auth/calendar.events.owned": "Access Calendar Events Owned",
                "https://www.googleapis.com/auth/drive.photos.readonly": "Access Drive Photos Readonly",
                "https://www.googleapis.com/auth/spreadsheets.readonly": "Access Spreadsheets Readonly",
                "https://www.googleapis.com/auth/calendar.acls.readonly": "Access Calendar ACLs Readonly",
                "https://www.googleapis.com/auth/gmail.settings.sharing": "Access Gmail Settings Sharing",
                "https://www.googleapis.com/auth/drive.metadata.readonly": "Access Drive Metadata Readonly",
                "https://www.googleapis.com/auth/calendar.events.freebusy": "Access Calendar Events Freebusy",
                "https://www.googleapis.com/auth/calendar.events.readonly": "Access Calendar Events Readonly",
                "https://www.googleapis.com/auth/calendar.settings.readonly": "Access Calendar Settings Readonly",
                "https://www.googleapis.com/auth/calendar.calendars.readonly": "Access Calendar Calendars Readonly",
                "https://www.googleapis.com/auth/youtubepartner-channel-audit": "Access Youtube Partner Channel Audit",
                "https://www.googleapis.com/auth/calendar.calendarlist.readonly": "Access Calendar Calendarlist Readonly",
                "https://www.googleapis.com/auth/calendar.events.owned.readonly": "Access Calendar Events Owned Readonly",
                "https://www.googleapis.com/auth/calendar.events.public.readonly": "Access Calendar Events Public Readonly",
                "https://www.googleapis.com/auth/gmail.addons.current.action.compose": "Access Gmail Addons Current Action Compose",
                "https://www.googleapis.com/auth/gmail.addons.current.message.action": "Access Gmail Addons Current Message Action",
                "https://www.googleapis.com/auth/youtube.channel-memberships.creator": "Access Youtube Channel Memberships Creator",
                "https://www.googleapis.com/auth/gmail.addons.current.message.metadata": "Access Gmail Addons Current Message Metadata",
                "https://www.googleapis.com/auth/gmail.addons.current.message.readonly": "Access Gmail Addons Current Message Readonly"
            },
            "supportedServices": [
                "gmail",
                "calendar",
                "drive",
                "sheets",
                "youtube",
                "google"
            ],
            "metadata": {
                "authUrl": "https://accounts.google.com/o/oauth2/auth",
                "tokenUrl": "https://oauth2.googleapis.com/token",
                "baseApiUrl": "",
                "allowedScopes": [
                    "openid",
                    "email",
                    "profile",
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://mail.google.com/",
                    "https://www.googleapis.com/auth/gmail.compose",
                    "https://www.googleapis.com/auth/gmail.modify",
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/gmail.metadata",
                    "https://www.googleapis.com/auth/gmail.labels",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.action",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
                    "https://www.googleapis.com/auth/gmail.settings.basic",
                    "https://www.googleapis.com/auth/gmail.settings.sharing",
                    "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
                    "https://www.googleapis.com/auth/gmail.insert",
                    "https://www.googleapis.com/auth/gmail.send",
                    "https://www.googleapis.com/auth/drive",
                    "https://www.googleapis.com/auth/drive.appdata",
                    "https://www.googleapis.com/auth/drive.file",
                    "https://www.googleapis.com/auth/drive.metadata",
                    "https://www.googleapis.com/auth/drive.metadata.readonly",
                    "https://www.googleapis.com/auth/drive.photos.readonly",
                    "https://www.googleapis.com/auth/drive.readonly",
                    "https://www.googleapis.com/auth/drive.apps.readonly",
                    "https://www.googleapis.com/auth/drive.meet.readonly",
                    "https://www.googleapis.com/auth/drive.scripts",
                    "https://www.googleapis.com/auth/youtube",
                    "https://www.googleapis.com/auth/youtube.force-ssl",
                    "https://www.googleapis.com/auth/youtubepartner",
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube.readonly",
                    "https://www.googleapis.com/auth/youtubepartner-channel-audit",
                    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
                    "https://www.googleapis.com/auth/calendar",
                    "https://www.googleapis.com/auth/calendar.app.created",
                    "https://www.googleapis.com/auth/calendar.calendars",
                    "https://www.googleapis.com/auth/calendar.acls",
                    "https://www.googleapis.com/auth/calendar.events",
                    "https://www.googleapis.com/auth/calendar.events.owned",
                    "https://www.googleapis.com/auth/calendar.calendarlist",
                    "https://www.googleapis.com/auth/calendar.calendars.readonly",
                    "https://www.googleapis.com/auth/calendar.readonly",
                    "https://www.googleapis.com/auth/calendar.acls.readonly",
                    "https://www.googleapis.com/auth/calendar.events.freebusy",
                    "https://www.googleapis.com/auth/calendar.events.owned.readonly",
                    "https://www.googleapis.com/auth/calendar.events.public.readonly",
                    "https://www.googleapis.com/auth/calendar.events.readonly",
                    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
                    "https://www.googleapis.com/auth/calendar.settings.readonly",
                    "https://www.googleapis.com/auth/calendar.freebusy",
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/spreadsheets.readonly"
                ]
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.551Z",
            "updatedAt": "2025-07-06T14:39:40.551Z",
            "iconUrl": null
        }
    },
    {
        "user_service_connections": {
            "id": "0acb3acd-9342-41ae-9769-7b9e2b9e4d3d",
            "userId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "clientId": "40560a08-6a75-4b53-9442-872af3be31d6",
            "uniqueId": "113365344739320826373",
            "credentials": {
                "hasCredentials": true,
                "credentialType": "oauth"
            },
            "metadata": {
                "user": {
                    "sub": "113365344739320826373",
                    "name": "Salted Peanuts",
                    "email": "speanuts447@gmail.com",
                    "picture": "https://lh3.googleusercontent.com/a/ACg8ocLstuY3B39J-MVdK1KCiQmRtq3v1JHUwQJmOoAFGAwXdQVawhyq=s96-c",
                    "uniqueId": "113365344739320826373",
                    "email_verified": true
                }
            },
            "policy": {},
            "scopes": [
                "google:https://www.googleapis.com/auth/userinfo.email",
                "google:https://www.googleapis.com/auth/userinfo.profile",
                "google:openid"
            ],
            "name": "dcsvcsdvsgoogle connection",
            "createdAt": "2025-07-31T12:05:10.890Z",
            "updatedAt": "2025-07-31T12:05:10.890Z"
        },
        "service_clients": {
            "clientId": "40560a08-6a75-4b53-9442-872af3be31d6",
            "name": "google",
            "description": "Google is a search engine and cloud computing company that provides a variety of services, including search, email, calendar, and document creation.",
            "type": "oauth",
            "supportedScopes": [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://mail.google.com/",
                "https://www.googleapis.com/auth/gmail.compose",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.metadata",
                "https://www.googleapis.com/auth/gmail.labels",
                "https://www.googleapis.com/auth/gmail.addons.current.message.action",
                "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
                "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
                "https://www.googleapis.com/auth/gmail.settings.basic",
                "https://www.googleapis.com/auth/gmail.settings.sharing",
                "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
                "https://www.googleapis.com/auth/gmail.insert",
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/drive.appdata",
                "https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/drive.metadata",
                "https://www.googleapis.com/auth/drive.metadata.readonly",
                "https://www.googleapis.com/auth/drive.photos.readonly",
                "https://www.googleapis.com/auth/drive.readonly",
                "https://www.googleapis.com/auth/drive.apps.readonly",
                "https://www.googleapis.com/auth/drive.meet.readonly",
                "https://www.googleapis.com/auth/drive.scripts",
                "https://www.googleapis.com/auth/youtube",
                "https://www.googleapis.com/auth/youtube.force-ssl",
                "https://www.googleapis.com/auth/youtubepartner",
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/youtubepartner-channel-audit",
                "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.app.created",
                "https://www.googleapis.com/auth/calendar.calendars",
                "https://www.googleapis.com/auth/calendar.acls",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/calendar.events.owned",
                "https://www.googleapis.com/auth/calendar.calendarlist",
                "https://www.googleapis.com/auth/calendar.calendars.readonly",
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.acls.readonly",
                "https://www.googleapis.com/auth/calendar.events.freebusy",
                "https://www.googleapis.com/auth/calendar.events.owned.readonly",
                "https://www.googleapis.com/auth/calendar.events.public.readonly",
                "https://www.googleapis.com/auth/calendar.events.readonly",
                "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
                "https://www.googleapis.com/auth/calendar.settings.readonly",
                "https://www.googleapis.com/auth/calendar.freebusy",
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/spreadsheets.readonly"
            ],
            "scopeDefinitions": {
                "openid": "OpenID",
                "https://mail.google.com/": "Access Gmail (Read, Write, Modify)",
                "https://www.googleapis.com/auth/drive": "Access Drive (Read, Write, Delete)",
                "https://www.googleapis.com/auth/youtube": "Access Youtube (Read, Write, Delete)",
                "https://www.googleapis.com/auth/calendar": "Access Calendar (Read, Write, Delete)",
                "https://www.googleapis.com/auth/drive.file": "Access Drive File",
                "https://www.googleapis.com/auth/gmail.send": "Send Email",
                "https://www.googleapis.com/auth/gmail.insert": "Insert Email",
                "https://www.googleapis.com/auth/gmail.labels": "Access Gmail Labels",
                "https://www.googleapis.com/auth/gmail.modify": "Modify Email",
                "https://www.googleapis.com/auth/spreadsheets": "Access Spreadsheets (Read, Write, Delete)",
                "https://www.googleapis.com/auth/calendar.acls": "Access Calendar ACLs",
                "https://www.googleapis.com/auth/drive.appdata": "Access Drive Appdata",
                "https://www.googleapis.com/auth/drive.scripts": "Access Drive Scripts",
                "https://www.googleapis.com/auth/gmail.compose": "Compose Email",
                "https://www.googleapis.com/auth/drive.metadata": "Access Drive Metadata",
                "https://www.googleapis.com/auth/drive.readonly": "Access Drive Readonly",
                "https://www.googleapis.com/auth/gmail.metadata": "Access Gmail Metadata",
                "https://www.googleapis.com/auth/gmail.readonly": "Read Email",
                "https://www.googleapis.com/auth/userinfo.email": "Get User Email",
                "https://www.googleapis.com/auth/youtube.upload": "Access Youtube Upload",
                "https://www.googleapis.com/auth/youtubepartner": "Access Youtube Partner",
                "https://www.googleapis.com/auth/calendar.events": "Access Calendar Events",
                "https://www.googleapis.com/auth/userinfo.profile": "Get User Profile",
                "https://www.googleapis.com/auth/youtube.readonly": "Access Youtube Readonly",
                "https://www.googleapis.com/auth/calendar.freebusy": "Access Calendar Freebusy",
                "https://www.googleapis.com/auth/calendar.readonly": "Access Calendar Readonly",
                "https://www.googleapis.com/auth/youtube.force-ssl": "Access Youtube Force SSL",
                "https://www.googleapis.com/auth/calendar.calendars": "Access Calendar Calendars",
                "https://www.googleapis.com/auth/drive.apps.readonly": "Access Drive Apps Readonly",
                "https://www.googleapis.com/auth/drive.meet.readonly": "Access Drive Meet Readonly",
                "https://www.googleapis.com/auth/calendar.app.created": "Access Calendar App Created",
                "https://www.googleapis.com/auth/gmail.settings.basic": "Access Gmail Settings Basic",
                "https://www.googleapis.com/auth/calendar.calendarlist": "Access Calendar Calendarlist",
                "https://www.googleapis.com/auth/calendar.events.owned": "Access Calendar Events Owned",
                "https://www.googleapis.com/auth/drive.photos.readonly": "Access Drive Photos Readonly",
                "https://www.googleapis.com/auth/spreadsheets.readonly": "Access Spreadsheets Readonly",
                "https://www.googleapis.com/auth/calendar.acls.readonly": "Access Calendar ACLs Readonly",
                "https://www.googleapis.com/auth/gmail.settings.sharing": "Access Gmail Settings Sharing",
                "https://www.googleapis.com/auth/drive.metadata.readonly": "Access Drive Metadata Readonly",
                "https://www.googleapis.com/auth/calendar.events.freebusy": "Access Calendar Events Freebusy",
                "https://www.googleapis.com/auth/calendar.events.readonly": "Access Calendar Events Readonly",
                "https://www.googleapis.com/auth/calendar.settings.readonly": "Access Calendar Settings Readonly",
                "https://www.googleapis.com/auth/calendar.calendars.readonly": "Access Calendar Calendars Readonly",
                "https://www.googleapis.com/auth/youtubepartner-channel-audit": "Access Youtube Partner Channel Audit",
                "https://www.googleapis.com/auth/calendar.calendarlist.readonly": "Access Calendar Calendarlist Readonly",
                "https://www.googleapis.com/auth/calendar.events.owned.readonly": "Access Calendar Events Owned Readonly",
                "https://www.googleapis.com/auth/calendar.events.public.readonly": "Access Calendar Events Public Readonly",
                "https://www.googleapis.com/auth/gmail.addons.current.action.compose": "Access Gmail Addons Current Action Compose",
                "https://www.googleapis.com/auth/gmail.addons.current.message.action": "Access Gmail Addons Current Message Action",
                "https://www.googleapis.com/auth/youtube.channel-memberships.creator": "Access Youtube Channel Memberships Creator",
                "https://www.googleapis.com/auth/gmail.addons.current.message.metadata": "Access Gmail Addons Current Message Metadata",
                "https://www.googleapis.com/auth/gmail.addons.current.message.readonly": "Access Gmail Addons Current Message Readonly"
            },
            "supportedServices": [
                "gmail",
                "calendar",
                "drive",
                "sheets",
                "youtube",
                "google"
            ],
            "metadata": {
                "authUrl": "https://accounts.google.com/o/oauth2/auth",
                "tokenUrl": "https://oauth2.googleapis.com/token",
                "baseApiUrl": "",
                "allowedScopes": [
                    "openid",
                    "email",
                    "profile",
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://mail.google.com/",
                    "https://www.googleapis.com/auth/gmail.compose",
                    "https://www.googleapis.com/auth/gmail.modify",
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/gmail.metadata",
                    "https://www.googleapis.com/auth/gmail.labels",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.action",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
                    "https://www.googleapis.com/auth/gmail.settings.basic",
                    "https://www.googleapis.com/auth/gmail.settings.sharing",
                    "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
                    "https://www.googleapis.com/auth/gmail.insert",
                    "https://www.googleapis.com/auth/gmail.send",
                    "https://www.googleapis.com/auth/drive",
                    "https://www.googleapis.com/auth/drive.appdata",
                    "https://www.googleapis.com/auth/drive.file",
                    "https://www.googleapis.com/auth/drive.metadata",
                    "https://www.googleapis.com/auth/drive.metadata.readonly",
                    "https://www.googleapis.com/auth/drive.photos.readonly",
                    "https://www.googleapis.com/auth/drive.readonly",
                    "https://www.googleapis.com/auth/drive.apps.readonly",
                    "https://www.googleapis.com/auth/drive.meet.readonly",
                    "https://www.googleapis.com/auth/drive.scripts",
                    "https://www.googleapis.com/auth/youtube",
                    "https://www.googleapis.com/auth/youtube.force-ssl",
                    "https://www.googleapis.com/auth/youtubepartner",
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube.readonly",
                    "https://www.googleapis.com/auth/youtubepartner-channel-audit",
                    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
                    "https://www.googleapis.com/auth/calendar",
                    "https://www.googleapis.com/auth/calendar.app.created",
                    "https://www.googleapis.com/auth/calendar.calendars",
                    "https://www.googleapis.com/auth/calendar.acls",
                    "https://www.googleapis.com/auth/calendar.events",
                    "https://www.googleapis.com/auth/calendar.events.owned",
                    "https://www.googleapis.com/auth/calendar.calendarlist",
                    "https://www.googleapis.com/auth/calendar.calendars.readonly",
                    "https://www.googleapis.com/auth/calendar.readonly",
                    "https://www.googleapis.com/auth/calendar.acls.readonly",
                    "https://www.googleapis.com/auth/calendar.events.freebusy",
                    "https://www.googleapis.com/auth/calendar.events.owned.readonly",
                    "https://www.googleapis.com/auth/calendar.events.public.readonly",
                    "https://www.googleapis.com/auth/calendar.events.readonly",
                    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
                    "https://www.googleapis.com/auth/calendar.settings.readonly",
                    "https://www.googleapis.com/auth/calendar.freebusy",
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/spreadsheets.readonly"
                ]
            },
            "embedding": null,
            "createdAt": "2025-07-06T14:39:40.551Z",
            "updatedAt": "2025-07-06T14:39:40.551Z",
            "iconUrl": null
        }
    }
]
   */


  // now write a function to filter userAuthConnections which has service_client.name equals to the service client map keys from authScopes example.
  // keep in mind their could me multiple key values in the serviceClientMap of authScopes
  // so we need to filter all the userAuthConnections
  const filteredUserAuthConnections = userAuthConnections?.filter((connection: any) => {
    const allowed = Object.keys(authScopes.serviceClientMap)
    return allowed.includes(connection.service_clients.name)
  })
  userAuthConnections = filteredUserAuthConnections


  // API CALL: GET /packages/packages/user/deployments - Get user's existing deployments (for existing deployment flow)
  const { data: allUserDeployments } = useSuspenseQuery(packageQueries.userDeploymentsOptions())
  
  // Filter deployments for current package
  const existingPackageDeployments = allUserDeployments?.filter(
    (deployment: any) => deployment.package.packageId === package_id
  ) || []
  /**
   * User deployments response example:
   * 
   * [
    {
        "deployment": {
            "deploymentId": "00c11b1f-bd56-4ac0-96f7-56daf1e08b15",
            "userMcpId": "b4307d40-2eea-4e47-8fdc-2df07c2f596f",
            "url": "http://localhost:3000",
            "scopes": [
                "google:https://www.googleapis.com/auth/drive",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-06T17:31:14.710Z",
            "updatedAt": "2025-07-06T17:31:14.710Z"
        },
        "userMcpId": "b4307d40-2eea-4e47-8fdc-2df07c2f596f",
        "package": {
            "packageId": "13765f2c-0eb6-4732-b6d5-8957ba0bb632",
            "name": "Drive Assistant MCP",
            "description": "An MCP package for drive operations",
            "publisherId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Test Developer",
                "license": "MIT",
                "repository": "https://github.com/testuser/gmail-assistant"
            },
            "createdAt": "2025-07-06T17:27:22.729Z",
            "updatedAt": "2025-07-06T17:27:22.729Z"
        }
    },
    {
        "deployment": {
            "deploymentId": "cb9299a7-13cb-4ecb-88e5-42eb24071751",
            "userMcpId": "d1937919-d6a2-42c7-92be-1107920e0530",
            "url": "http://localhost:3000",
            "scopes": [
                "github:delete_repo",
                "github:gist",
                "github:read:org",
                "github:repo",
                "github:user",
                "github:workflow",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-06T19:17:28.466Z",
            "updatedAt": "2025-07-06T19:17:28.466Z"
        },
        "userMcpId": "d1937919-d6a2-42c7-92be-1107920e0530",
        "package": {
            "packageId": "ddbdf89a-c9dc-4642-b1ab-9588992bbabf",
            "name": "Github Assistant MCP",
            "description": "An MCP package for github operations",
            "publisherId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Test Developer",
                "license": "MIT",
                "repository": "https://github.com/testuser/gmail-assistant"
            },
            "createdAt": "2025-07-06T19:15:20.199Z",
            "updatedAt": "2025-07-06T19:15:20.199Z"
        }
    },
    {
        "deployment": {
            "deploymentId": "894763b7-277e-4bcc-bdaa-cd99c92203e0",
            "userMcpId": "d1937919-d6a2-42c7-92be-1107920e0530",
            "url": "http://localhost:3000",
            "scopes": [
                "github:delete_repo",
                "github:gist",
                "github:read:org",
                "github:repo",
                "github:user",
                "github:workflow",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-06T19:18:25.236Z",
            "updatedAt": "2025-07-06T19:18:25.236Z"
        },
        "userMcpId": "d1937919-d6a2-42c7-92be-1107920e0530",
        "package": {
            "packageId": "ddbdf89a-c9dc-4642-b1ab-9588992bbabf",
            "name": "Github Assistant MCP",
            "description": "An MCP package for github operations",
            "publisherId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Test Developer",
                "license": "MIT",
                "repository": "https://github.com/testuser/gmail-assistant"
            },
            "createdAt": "2025-07-06T19:15:20.199Z",
            "updatedAt": "2025-07-06T19:15:20.199Z"
        }
    },
    {
        "deployment": {
            "deploymentId": "9a97cda3-7d12-4cf2-b9e6-35a831ff77d7",
            "userMcpId": "4fa2338d-c07c-4ff4-930a-6bf9055fe028",
            "url": "http://localhost:3000",
            "scopes": [
                "linear:read",
                "linear:write",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-07T09:30:01.790Z",
            "updatedAt": "2025-07-07T09:30:01.790Z"
        },
        "userMcpId": "4fa2338d-c07c-4ff4-930a-6bf9055fe028",
        "package": {
            "packageId": "927c0020-14af-4f73-8ceb-c46c79fd7c4e",
            "name": "Linear Assistant MCP",
            "description": "An MCP package for linear operations",
            "publisherId": "7ade3386-8ced-4261-b514-7365dfe773fe",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Test Developer",
                "license": "MIT",
                "repository": "https://github.com/testuser/gmail-assistant"
            },
            "createdAt": "2025-07-07T09:29:12.570Z",
            "updatedAt": "2025-07-07T09:29:12.570Z"
        }
    },
    {
        "deployment": {
            "deploymentId": "8ecd23a5-5d90-46d3-808b-e427efcb2dea",
            "userMcpId": "22946b7a-5936-4ca0-8307-8e1211139dfa",
            "url": "http://localhost:3000",
            "scopes": [
                "google:https://www.googleapis.com/auth/spreadsheets",
                "google:https://mail.google.com/",
                "google:https://www.googleapis.com/auth/drive",
                "google:https://www.googleapis.com/auth/userinfo.profile",
                "google:https://www.googleapis.com/auth/userinfo.email",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-19T19:35:49.363Z",
            "updatedAt": "2025-07-19T19:35:49.363Z"
        },
        "userMcpId": "22946b7a-5936-4ca0-8307-8e1211139dfa",
        "package": {
            "packageId": "47369506-ca39-4f2d-93e8-892dfae7bf74",
            "name": "my-osiris-project-10000",
            "description": "My awesome MCP server with Osiris SDK",
            "publisherId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Satyam Kulkarni",
                "license": "MIT",
                "repository": "https://github.com/my-osiris-project-10000"
            },
            "createdAt": "2025-07-12T09:51:31.920Z",
            "updatedAt": "2025-07-18T11:45:41.237Z"
        }
    },
    {
        "deployment": {
            "deploymentId": "16b20826-4242-4657-833b-85b7a11eecf2",
            "userMcpId": "22946b7a-5936-4ca0-8307-8e1211139dfa",
            "url": "http://localhost:3000",
            "scopes": [
                "google:https://www.googleapis.com/auth/spreadsheets",
                "google:https://mail.google.com/",
                "google:https://www.googleapis.com/auth/drive",
                "google:https://www.googleapis.com/auth/userinfo.profile",
                "google:https://www.googleapis.com/auth/userinfo.email",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-19T19:40:04.294Z",
            "updatedAt": "2025-07-19T19:40:04.294Z"
        },
        "userMcpId": "22946b7a-5936-4ca0-8307-8e1211139dfa",
        "package": {
            "packageId": "47369506-ca39-4f2d-93e8-892dfae7bf74",
            "name": "my-osiris-project-10000",
            "description": "My awesome MCP server with Osiris SDK",
            "publisherId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Satyam Kulkarni",
                "license": "MIT",
                "repository": "https://github.com/my-osiris-project-10000"
            },
            "createdAt": "2025-07-12T09:51:31.920Z",
            "updatedAt": "2025-07-18T11:45:41.237Z"
        }
    },
    {
        "deployment": {
            "deploymentId": "132202bb-9baf-4cdb-8a86-a49038498fc0",
            "userMcpId": "22946b7a-5936-4ca0-8307-8e1211139dfa",
            "url": "http://localhost:3000",
            "scopes": [
                "google:https://www.googleapis.com/auth/spreadsheets",
                "google:https://mail.google.com/",
                "google:https://www.googleapis.com/auth/drive",
                "google:https://www.googleapis.com/auth/userinfo.profile",
                "google:https://www.googleapis.com/auth/userinfo.email",
                "osiris:auth"
            ],
            "authData": {},
            "status": "active",
            "embedding": null,
            "name": null,
            "createdAt": "2025-07-19T19:46:56.792Z",
            "updatedAt": "2025-07-19T19:46:56.792Z"
        },
        "userMcpId": "22946b7a-5936-4ca0-8307-8e1211139dfa",
        "package": {
            "packageId": "47369506-ca39-4f2d-93e8-892dfae7bf74",
            "name": "my-osiris-project-10000",
            "description": "My awesome MCP server with Osiris SDK",
            "publisherId": "389fc1d9-217c-4ffd-a377-064669ff6a09",
            "latestVersion": "0.0.1",
            "metadata": {
                "author": "Satyam Kulkarni",
                "license": "MIT",
                "repository": "https://github.com/my-osiris-project-10000"
            },
            "createdAt": "2025-07-12T09:51:31.920Z",
            "updatedAt": "2025-07-18T11:45:41.237Z"
        }
    }
]
   */

  // Mutations
  const createServiceConnectionMutation = useCreateServiceConnectionMutation()
  const deployPackageMutation = useDeployPackageMutation()
  const authorizeOsirisMutation = useAuthorizeOsirisMutation()

  // Event Handlers
  const handleDeploymentActionChange = (action: 'new' | 'existing') => {
    setSelectedDeploymentAction(action)
    if (action === 'new') {
      setSelectedDeploymentId('')
    }
  }

  const handleAuthConnectionSelect = useCallback((serviceName: string, connectionId: string) => {
    setSelectedAuthConnections(prev => ({ ...prev, [serviceName]: connectionId }))
  }, [])

  const handlePermissionSelect = useCallback((serviceName: string, permissions: Permission[]) => {
    setSelectedPermissions(prev => ({ ...prev, [serviceName]: permissions }))
  }, [])

  const handleConnectNewAccount = useCallback((serviceName: string, requiredScopes: string[]) => {
    // Use selected permissions if any, otherwise fall back to all required scopes
    const permissionsToUse = selectedPermissions[serviceName]?.length > 0 
      ? selectedPermissions[serviceName].map(p => p.id)
      : requiredScopes.map(scope => 
          scope.startsWith(`${serviceName}:`) ? scope.replace(`${serviceName}:`, '') : scope
        )
    
    createServiceConnectionMutation.mutate({
      name: `${serviceName} connection for ${packageDetails?.name}`,
      serviceClientName: serviceName,
      scopes: permissionsToUse,
      redirectUri: "http://localhost:3000/oauth/consent"
    })
  }, [selectedPermissions, packageDetails, createServiceConnectionMutation])

  const handleAllowConsent = async () => {
    // Validate deployment selection if there are existing deployments
    if (existingPackageDeployments.length > 0 && selectedDeploymentAction === 'existing' && !selectedDeploymentId) {
      setError('Please select an existing deployment')
      return
    }

    // Validate that user has selected accounts for all required services
    const requiredServices = Object.keys(authScopes?.serviceClientMap || {})
    const selectedServices = Object.keys(selectedAuthConnections)
    const missingServices = requiredServices.filter(service => !selectedServices.includes(service))
    
    if (missingServices.length > 0) {
      setError(`Please select accounts for: ${missingServices.join(', ')}`)
      return
    }

    // Validate that user has selected permissions for all services with connections
    const servicesWithoutPermissions = selectedServices.filter(
      service => !selectedPermissions[service] || selectedPermissions[service].length === 0
    )
    
    if (servicesWithoutPermissions.length > 0) {
      setError(`Please select permissions for: ${servicesWithoutPermissions.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError(null)
        try {
      let deploymentId = selectedDeploymentId

      if (selectedDeploymentAction === 'new') {
        // Create new deployment with selected permissions
        const selectedScopes = Object.entries(selectedPermissions).flatMap(([serviceName, permissions]) => 
          permissions.map(permission => `${serviceName}:${permission.id}`)
        )
        
        const deploymentResult = await deployPackageMutation.mutateAsync({
          packageId: package_id,
          version: packageDetails?.latestVersion || '1.0.0',
          url: "https://osirislabs.xyz",
          scopes: selectedScopes,
          authData: {},
          connectionIds: Object.values(selectedAuthConnections)
        })
        
        deploymentId = deploymentResult.deployment.deploymentId
      }

      const authResult = await authorizeOsirisMutation.mutateAsync({
        clientId: clientId,
        redirectUri: redirect_uri,
        responseType: 'code',
        scopes: scopes, 
        state: state || '',
        deploymentId: deploymentId
      })

      console.log('Authorization successful:', { 
        authResult,
        selectedDeploymentAction,
        deploymentId,
        selectedAuthConnections, 
        packageDetails, 
        authScopes 
      })
      
      // Handle redirect to agent with tokens and deployment info
      // This should be handled by the mutation's onSuccess callback
    } catch (error) {
      setError('Authorization failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDenyConsent = () => {
    // Redirect back to original redirect_uri with error
    console.log('Deny clicked')
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto mt-8 max-w-[496px] w-full">
        {/* Error state */}
        {(error || createServiceConnectionMutation.error || deployPackageMutation.error || authorizeOsirisMutation.error) && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-[6px]">
            <p className="text-danger-800 text-sm">
              {error || 
               createServiceConnectionMutation.error?.message ||
               deployPackageMutation.error?.message ||
               authorizeOsirisMutation.error?.message}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="pb-6 text-center mb-6">
          <h2 className="mb-2 font-medium text-xl leading-3 tracking-tight">
            OAuth Authorization
          </h2>
          <span className="text-primary-300 text-sm">
            <strong>{packageDetails?.name}</strong> is requesting access to your accounts
          </span>
        </div>

        {/* Package Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                {packageDetails?.name?.charAt(0) || 'P'}
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-primary-800">{packageDetails?.name}</CardTitle>
                <p className="text-[13px] text-primary-300 mt-1">{packageDetails?.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-primary-400">
                  <span>v{packageDetails?.latestVersion}</span>
                  <span>•</span>
                  <span>{packageDetails?.metadata?.author}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Deployment Selection - Only show if user has existing deployments for this package */}
        {existingPackageDeployments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-primary-800">Deployment Options</CardTitle>
              <p className="text-[13px] text-primary-300 mt-1">
                You have previously deployed this package. Choose how to proceed:
              </p>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                className="rounded-[6px] bg-primary-50 p-[2px] w-full"
                type="single"
                value={selectedDeploymentAction}
                onValueChange={(value: 'new' | 'existing') => value && handleDeploymentActionChange(value)}
              >
                <ToggleGroupItem
                  value="new"
                  className={cn(
                    "flex-1 justify-start hover:!bg-white/90 data-[state=on]:!bg-white",
                    "!bg-transparent data-[state=on]:!bg-white"
                  )}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Create new deployment</div>
                    <div className="text-xs text-primary-400">Fresh deployment with new settings</div>
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="existing"
                  className={cn(
                    "flex-1 justify-start hover:!bg-white/90 data-[state=on]:!bg-white",
                    "!bg-transparent data-[state=on]:!bg-white"
                  )}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">Use existing deployment</div>
                    <div className="text-xs text-primary-400">Reuse a configured deployment</div>
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Existing Deployment Selection */}
              {selectedDeploymentAction === 'existing' && (
                <div className="mt-6 p-4 bg-primary-25 rounded-[6px] border border-primary-100">
                  <p className="text-sm font-medium text-primary-800 mb-3">Select existing deployment:</p>
                  <div className="space-y-3">
                    {existingPackageDeployments.map((deployment: any) => (
                      <label key={deployment.deployment.deploymentId} className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="existingDeployment"
                          value={deployment.deployment.deploymentId}
                          checked={selectedDeploymentId === deployment.deployment.deploymentId}
                          onChange={(e) => setSelectedDeploymentId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1 p-3 border border-primary-100 rounded-[6px] group-hover:border-primary-200 transition-colors">
                          <div className="text-sm font-medium text-primary-800">
                            {deployment.deployment.name || `Deployment ${deployment.deployment.deploymentId.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-primary-400 flex items-center gap-2 mt-1">
                            <span>{new Date(deployment.deployment.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{deployment.deployment.status}</span>
                            <span>•</span>
                            <span>{deployment.deployment.scopes.length} scopes</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deployment.deployment.scopes.slice(0, 3).map((scope: string) => (
                              <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                {scope.includes(':') ? scope.split(':')[1] : scope}
                              </Badge>
                            ))}
                            {deployment.deployment.scopes.length > 3 && (
                              <Badge className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                +{deployment.deployment.scopes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Auth Connections by Service */}
        <div className="space-y-6">
          {Object.entries(authScopes?.serviceClientMap || {}).map(([serviceName, requiredScopes]) => {
            const serviceConnections = userAuthConnections?.filter(
              (connection: any) => connection.service_clients.name === serviceName
            ) || []

            // Memoize permissions to prevent re-renders
            const permissions = useMemo(() => {
              return (requiredScopes as string[]).map((scope: string) => {
                const cleanScope = scope.replace(`${serviceName}:`, '')
                // Create user-friendly labels
                const label = cleanScope
                  .split(/[./]/)
                  .pop()
                  ?.replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to words
                  .replace(/[_-]/g, ' ') // replace underscores/dashes with spaces
                  .toLowerCase()
                  .replace(/\b\w/g, l => l.toUpperCase()) // capitalize first letter of each word
                  || cleanScope
                
                return {
                  id: cleanScope,
                  label: label
                }
              })
            }, [serviceName, requiredScopes])

            // Memoize the callback for this specific service
            const handleServicePermissionSelect = useCallback((permissions: Permission[]) => {
              handlePermissionSelect(serviceName, permissions)
            }, [serviceName, handlePermissionSelect])

            // Memoize initial selected to prevent re-renders
            const initialSelected = useMemo(() => {
              return selectedPermissions[serviceName] || []
            }, [selectedPermissions, serviceName])

            return (
              <Card key={serviceName} className="border-primary-100 hover:border-primary-200 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-[6px] bg-purple-300 flex items-center justify-center text-white font-bold text-lg capitalize shadow-xl">
                      {serviceName.charAt(0)}
                    </div>
                    <div className="flex flex-col flex-1">
                      <CardTitle className="text-primary-800 capitalize">{serviceName} Account</CardTitle>
                      <p className="text-[13px] text-primary-300 mt-1">
                        Select an existing {serviceName} account or connect a new one
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Permission Selector for this service */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-primary-800 mb-3">Select permissions to grant:</p>
                    <PermissionSelector
                      permissions={permissions}
                      placeholder={`Search ${serviceName} permissions...`}
                      onSelectionChange={handleServicePermissionSelect}
                      initialSelected={initialSelected}
                    />
                  </div>

                  {/* Existing Connections */}
                  {serviceConnections.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-primary-800 mb-3">Your connected accounts:</p>
                      <div className="space-y-3">
                        {serviceConnections.map((connection: any) => (
                          <label key={connection.user_service_connections.id} className="flex items-start space-x-3 cursor-pointer group">
                            <input
                              type="radio"
                              name={`auth-${serviceName}`}
                              value={connection.user_service_connections.id}
                              onChange={() => handleAuthConnectionSelect(
                                serviceName,
                                connection.user_service_connections.id
                              )}
                              className="mt-1"
                            />
                            <div className="flex-1 p-3 border border-primary-100 rounded-[6px] group-hover:border-primary-200 transition-colors">
                              <div className="flex items-center space-x-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-purple-300 text-white">
                                    {serviceName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-medium text-primary-800">
                                  {connection.user_service_connections.metadata?.user?.name || 'Unknown User'}
                                </p>
                              </div>
                              <p className="text-[13px] text-primary-400 mb-2">
                                {connection.user_service_connections.metadata?.user?.email}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {connection.user_service_connections.scopes?.map((scope: string) => (
                                  <Badge key={scope} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                                    {scope.replace(`${serviceName}:`, '')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connect New Account Button */}
                  <Button
                    onClick={() => handleConnectNewAccount(serviceName, requiredScopes as string[])}
                    variant="outline"
                    className="w-full rounded-[6px]"
                    disabled={createServiceConnectionMutation.isPending}
                  >
                    {createServiceConnectionMutation.isPending 
                      ? 'Connecting...' 
                      : `Connect a new ${serviceName} account`
                    }
                  </Button>

                  {serviceConnections.length === 0 && (
                    <p className="text-[13px] text-primary-300 italic mt-3">
                      No {serviceName} accounts connected yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary Section */}
        <Card className="mb-6 border-primary-100">
          <CardHeader>
            <CardTitle className="text-primary-800">Authorization Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-400">Package:</span>
                <span className="text-primary-800 font-medium">{packageDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-400">Version:</span>
                <span className="text-primary-800">v{packageDetails?.latestVersion}</span>
              </div>
              {existingPackageDeployments.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-primary-400">Deployment:</span>
                  <span className="text-primary-800 capitalize">
                    {selectedDeploymentAction === 'new' ? 'New deployment' : 
                     selectedDeploymentId ? 'Existing deployment' : 'Not selected'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-primary-400">Auth Methods:</span>
                <span className="text-primary-800">
                  {Object.keys(selectedAuthConnections).length > 0
                    ? Object.keys(selectedAuthConnections).join(', ')
                    : 'None selected'
                  }
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-primary-400">Selected Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(selectedPermissions).flatMap(([serviceName, permissions]) =>
                    permissions.map((permission, index) => (
                      <Badge key={`${serviceName}-${permission.id}-${index}`} className="rounded-[6px] bg-primary-100 px-2 py-0.5 text-xs text-primary-800">
                        {serviceName}: {permission.label}
                      </Badge>
                    ))
                  )}
                  {Object.keys(selectedPermissions).length === 0 && (
                    <span className="text-primary-400 text-xs italic">No permissions selected yet</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleAllowConsent}
            disabled={isLoading || deployPackageMutation.isPending || authorizeOsirisMutation.isPending}
            className="flex-1 bg-success-600 hover:bg-success-700 rounded-[6px]"
            size="lg"
          >
            {(isLoading || deployPackageMutation.isPending || authorizeOsirisMutation.isPending) ? 'Processing...' : 'Allow'}
          </Button>
          <Button
            onClick={handleDenyConsent}
            variant="outline"
            className="flex-1 rounded-[6px]"
            size="lg"
          >
            Deny
          </Button>
        </div>
      </div>
  </div>
  )
}
