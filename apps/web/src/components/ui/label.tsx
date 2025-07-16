import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({
	className,
	children,
	required = false,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
	required?: boolean;
}) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				"flex select-none items-center text-primary-400 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
			{required && (
				<sup className="mt-4 ml-0.5 shrink-0 text-[#F03D3D] text-sm">*</sup>
			)}
		</LabelPrimitive.Root>
	);
}

export { Label };
