import type { ReactNode } from "react";

export interface RawDOMContainerBreadcrumb {
	label: string;
	href?: string;
}

export interface RawDOMContainerProps {
	title: string;
	breadcrumbs?: RawDOMContainerBreadcrumb[];
	children: ReactNode;
}

/**
 * Standalone fallback shell for the tool when it is not embedded inside the
 * parent monorepo. When this tool is consumed by `my-web-2025`, the host can
 * shadow or replace this component to integrate with the parent layout.
 */
export function RawDOMContainer({
	title,
	breadcrumbs = [],
	children,
}: RawDOMContainerProps) {
	return (
		<section
			aria-labelledby="raw-dom-container-title"
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				padding: "16px",
				border: "1px solid #ddd",
			}}
		>
			<header
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "6px",
					borderBottom: "1px solid #eee",
					paddingBottom: "8px",
				}}
			>
				{breadcrumbs.length > 0 && (
					<nav
						aria-label="Breadcrumb"
						style={{ fontSize: "12px", color: "#666" }}
					>
						<ol
							style={{
								display: "flex",
								flexWrap: "wrap",
								gap: "4px",
								margin: 0,
								padding: 0,
								listStyle: "none",
							}}
						>
							{breadcrumbs.map((crumb, index) => {
								const isLast = index === breadcrumbs.length - 1;
								return (
									<li key={crumb.label}>
										{crumb.href && !isLast ? (
											<a href={crumb.href}>{crumb.label}</a>
										) : (
											<span aria-current={isLast ? "page" : undefined}>
												{crumb.label}
											</span>
										)}
										{!isLast && (
											<span aria-hidden="true" style={{ margin: "0 4px" }}>
												/
											</span>
										)}
									</li>
								);
							})}
						</ol>
					</nav>
				)}
				<h1
					id="raw-dom-container-title"
					style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}
				>
					{title}
				</h1>
			</header>
			<div>{children}</div>
		</section>
	);
}
