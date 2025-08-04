import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
				destructive:
					"bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
				outline: "inset-shadow-outline-btn bg-primary-50",
				outline2: "inset-shadow-outline-btn bg-primary-00",
				secondary:
					"bg-primary-50 text-primary-400 shadow-xs hover:bg-primary-50/80",
				ghost:
					"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			effect: {
				expandIcon: "group relative gap-0",
				ringHover:
					"transition-all duration-300 hover:ring-2 hover:ring-primary/90 hover:ring-offset-2",
				shine:
					"background-position_0s_ease relative overflow-hidden before:absolute before:inset-0 before:animate-shine before:rounded-[inherit] before:bg-[length:250%_250%,100%_100%] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-no-repeat",
				shineHover:
					"relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[length:250%_250%,100%_100%] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0]",
				gooeyRight:
					"before:-z-10 relative z-0 overflow-hidden from-white/40 transition-all duration-500 before:absolute before:inset-0 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-gradient-to-r before:transition-transform before:duration-1000 hover:before:translate-x-[0%] hover:before:translate-y-[0%]",
				gooeyLeft:
					"after:-z-10 relative z-0 overflow-hidden from-white/40 transition-all duration-500 after:absolute after:inset-0 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%] after:bg-gradient-to-l after:transition-transform after:duration-1000 hover:after:translate-x-[0%] hover:after:translate-y-[0%]",
				underline:
					"!no-underline relative after:absolute after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-left after:scale-x-100 after:bg-primary after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-right hover:after:scale-x-0",
				hoverUnderline:
					"!no-underline relative after:absolute after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-left hover:after:scale-x-100",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
				icon: "size-9",
				xs: "h-8 rounded-md px-2",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

interface IconProps {
	icon: React.ElementType;
	iconPlacement: "left" | "right";
}

interface IconRefProps {
	icon?: never;
	iconPlacement?: undefined;
}

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
	VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export type ButtonIconProps = IconProps | IconRefProps;

const Button = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & ButtonIconProps
>(
	(
		{
			className,
			variant,
			effect,
			size,
			icon: Icon,
			iconPlacement,
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, effect, size, className }))}
				ref={ref}
				{...props}
			>
				{Icon &&
					iconPlacement === "left" &&
					(effect === "expandIcon" ? (
						<div className="w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-100 group-hover:pr-2 group-hover:opacity-100">
							<Icon />
						</div>
					) : (
						<Icon />
					))}
				<Slottable>{props.children}</Slottable>
				{Icon &&
					iconPlacement === "right" &&
					(effect === "expandIcon" ? (
						<div className="w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100">
							<Icon />
						</div>
					) : (
						<Icon />
					))}
			</Comp>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
