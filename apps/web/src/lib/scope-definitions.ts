/**
 * Local scope definitions for all available auth services
 * This provides human-readable names for scopes without requiring API calls
 */

export interface ScopeDefinitions {
  [serviceName: string]: {
    [scopeUrl: string]: string;
  };
}

export const SCOPE_DEFINITIONS: ScopeDefinitions = {
  google: {
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

  github: {
    "user": "Get User",
    "user:email": "Get User Email",
    "repo": "Get Repo",
    "read:org": "Read Organization",
    "user:follow": "Follow User",
    "gist": "Get Gist",
    "workflow": "Get Workflow",
    "delete_repo": "Delete Repository"
  },

  slack: {
    "identify": "Identify",
    "team:read": "Read Team",
    "chat:write": "Write Chat",
    "files:read": "Read Files",
    "users:read": "Read Users",
    "files:write": "Write Files",
    "channels:read": "Read Channels",
    "channels:write": "Write Channel",
    "channels:history": "Read Channel History"
  },

  discord: {
    "bot": "Bot",
    "rpc": "RPC",
    "email": "Email",
    "voice": "Voice",
    "guilds": "Guilds",
    "gdm.join": "GDM Join",
    "identify": "Identify",
    "connections": "Connections",
    "guilds.join": "Guilds Join",
    "messages.read": "Messages Read",
    "rpc.voice.read": "RPC Voice Read",
    "activities.read": "Activities Read",
    "rpc.voice.write": "RPC Voice Write",
    "activities.write": "Activities Write",
    "dm_channels.read": "DM Channels Read",
    "webhook.incoming": "Webhook Incoming",
    "relationships.read": "Relationships Read",
    "applications.commands": "Applications Commands",
    "rpc.notifications.read": "RPC Notifications Read",
    "applications.builds.read": "Applications Builds Read",
    "applications.entitlements": "Applications Entitlements",
    "applications.store.update": "Applications Store Update",
    "applications.builds.upload": "Applications Builds Upload",
    "applications.commands.update": "Applications Commands Update",
    "applications.commands.permissions.update": "Applications Commands Permissions Update"
  },

  linear: {
    "read": "Read",
    "write": "Write"
  },

  notion: {
    "all": "All"
  }
};

/**
 * Get a human-readable scope name from the local definitions
 * @param scope - The scope string (e.g., "google:https://www.googleapis.com/auth/calendar")
 * @returns Human-readable scope name or the original scope if not found
 */
export function getScopeDisplayName(scope: string): string {
  // Split only on the first colon to handle URLs with multiple colons
  const firstColonIndex = scope.indexOf(':');
  if (firstColonIndex === -1) {
    return scope;
  }

  const serviceName = scope.substring(0, firstColonIndex);
  const scopeUrl = scope.substring(firstColonIndex + 1);

  if (!serviceName || !scopeUrl) {
    return scope;
  }

  const serviceDefinitions = SCOPE_DEFINITIONS[serviceName];
  if (!serviceDefinitions) {
    return scope;
  }

  return serviceDefinitions[scopeUrl] || scopeUrl;
}

/**
 * Get all scope definitions for a specific service
 * @param serviceName - The name of the service
 * @returns Object with scope URLs as keys and human-readable names as values
 */
export function getServiceScopeDefinitions(serviceName: string): Record<string, string> {
  return SCOPE_DEFINITIONS[serviceName] || {};
}
