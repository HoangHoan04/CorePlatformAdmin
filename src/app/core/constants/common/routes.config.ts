import { PERMISSION_CODES } from './permission-codes';

export interface RouteConfig {
  key: string;
  label: string;
  translationKey: string;
  path: string;
  icon?: string;
  isShow?: boolean;
  permission?: string;
  children?: Record<string, RouteConfig>;
}

export interface SidebarMenuItem {
  key: string;
  label: string;
  translationKey: string;
  path: string;
  icon?: string;
  isShow?: boolean;
  permission?: string;
  children?: SidebarMenuItem[];
}

export const ROUTES_CONFIG = {
  HOME: {
    key: 'HOME',
    label: 'routes.home',
    translationKey: 'routes.home',
    path: '/',
    icon: 'home',
    permission: PERMISSION_CODES.HOME_VIEW,
  },
} as const satisfies Record<string, RouteConfig>;

export function getRouteByPath(path: string): RouteConfig | undefined {
  const routes = ROUTES_CONFIG as unknown as Record<string, RouteConfig>;
  let bestMatch: RouteConfig | undefined = undefined;

  const traverse = (routeList: Record<string, RouteConfig>) => {
    for (const key of Object.keys(routeList)) {
      const r = routeList[key];
      if (path === r.path) {
        bestMatch = r;
        return;
      }
      if (r.path !== '/' && path.startsWith(r.path + '/')) {
        if (!bestMatch || r.path.length > bestMatch.path.length) {
          bestMatch = r;
        }
      }
      if (r.children) {
        traverse(r.children as Record<string, RouteConfig>);
      }
    }
  };

  traverse(routes);
  return bestMatch;
}

export function getFirstNavigableRoute(route: RouteConfig): RouteConfig {
  if (!route.children || Object.keys(route.children).length === 0) {
    return route;
  }
  const childKeys = Object.keys(route.children);
  for (const k of childKeys) {
    const child = route.children[k];
    if (child && child.isShow !== false) {
      return getFirstNavigableRoute(child);
    }
  }
  return childKeys.length > 0 ? getFirstNavigableRoute(route.children[childKeys[0]]) : route;
}

export function getRouteByKey(key: string): RouteConfig | undefined {
  const routes = ROUTES_CONFIG as unknown as Record<string, RouteConfig>;
  let foundRoute: RouteConfig | undefined = undefined;

  const traverse = (routeList: Record<string, RouteConfig>) => {
    for (const k of Object.keys(routeList)) {
      if (foundRoute) return;
      const r = routeList[k];
      if (r.key === key) {
        foundRoute = r;
        return;
      }
      if (r.children) {
        traverse(r.children as Record<string, RouteConfig>);
      }
    }
  };

  traverse(routes);
  return foundRoute;
}

export function convertRoutesToMenuItems(routes: Record<string, RouteConfig>): SidebarMenuItem[] {
  const toMenuItem = (route: RouteConfig, depth: number): SidebarMenuItem | null => {
    if (route.isShow === false) return null;

    const item: SidebarMenuItem = {
      key: route.key,
      label: route.label,
      translationKey: route.translationKey,
      path: route.path,
      icon: route.icon,
      isShow: route.isShow,
      permission: route.permission,
    };

    if (route.children && depth < 3) {
      const children = Object.keys(route.children)
        .map((childKey) => toMenuItem(route.children![childKey], depth + 1))
        .filter((child): child is SidebarMenuItem => child !== null);
      if (children.length > 0) {
        item.children = children;
      }
    }

    return item;
  };

  const items: SidebarMenuItem[] = [];
  const home = routes['HOME'];
  if (home && home.isShow !== false) {
    items.push({
      key: home.key,
      label: home.label,
      translationKey: home.translationKey,
      path: home.path,
      icon: home.icon,
      isShow: home.isShow,
      permission: home.permission,
    });
  }

  for (const key of Object.keys(routes)) {
    if (key === 'HOME') continue;
    const item = toMenuItem(routes[key], 1);
    if (item) items.push(item);
  }
  return items;
}

export function filterMenuByPermission(
  items: SidebarMenuItem[],
  canAccess: (permission?: string) => boolean,
): SidebarMenuItem[] {
  const filterItem = (item: SidebarMenuItem): SidebarMenuItem | null => {
    if (item.permission && !canAccess(item.permission)) {
      return null;
    }

    if (item.children?.length) {
      const children = item.children
        .map((child) => filterItem(child))
        .filter((child): child is SidebarMenuItem => child !== null);
      if (children.length === 0) {
        return null;
      }
      return { ...item, children };
    }

    return item;
  };

  return items
    .map((item) => filterItem(item))
    .filter((item): item is SidebarMenuItem => item !== null);
}
