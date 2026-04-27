import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { preloadRoute } from "@/lib/routePreload";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onTouchStart, onFocus, ...props }, ref) => {
    const path = typeof to === "string" ? to : (to as any)?.pathname ?? "";

    const prefetch = useCallback(() => {
      if (path) preloadRoute(path);
    }, [path]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onMouseEnter={(e) => { prefetch(); onMouseEnter?.(e); }}
        onTouchStart={(e) => { prefetch(); onTouchStart?.(e); }}
        onFocus={(e) => { prefetch(); onFocus?.(e); }}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
