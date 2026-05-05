import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, ElementType } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  icon?: ElementType;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, icon: Icon, children, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
            className,
            isActive && activeClassName,
            isPending && pendingClassName
          )
        }
        {...props}
      >
        {(state) => (
          <>
            {Icon && <Icon className="size-4" />}
            {typeof children === "function" ? children(state) : children}
          </>
        )}
      </RouterNavLink>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
