import "@/app/global.css";
import 'fumadocs-ui/style.css'; // Make sure this is imported
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { baseOptions } from "./layout.config";
import { source } from "@/lib/source";

const inter = Inter({
	subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.className}>
			<body>
				<RootProvider>
						{children}
				</RootProvider>
			</body>
		</html>
	);
}