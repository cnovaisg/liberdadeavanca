import type { ShareCardCopy } from "./copy";

const emerald900 = "#064e3b";
const emerald700 = "#047857";
const emerald950 = "#022c22";
const emerald100 = "#d1fae5";
const zinc700 = "#3f3f46";

/** Sober share card: white field, emerald type, footer in the site's emerald-950. */
export function ShareCard({ copy }: { copy: ShareCardCopy }) {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: "#ffffff",
			}}
		>
			<div style={{ display: "flex", flexGrow: 1 }}>
				<div
					style={{
						width: 18,
						background: emerald900,
					}}
				/>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flexGrow: 1,
						justifyContent: "space-between",
						padding: "68px 76px 48px",
					}}
				>
					<div
						style={{
							display: "flex",
							fontFamily: "Anton",
							fontSize: 30,
							letterSpacing: 4,
							color: emerald700,
						}}
					>
						{copy.kicker}
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div
							style={{
								display: "flex",
								fontFamily: "Anton",
								fontSize: copy.titleSize,
								lineHeight: 1.05,
								letterSpacing: 1,
								color: emerald900,
							}}
						>
							{copy.title}
						</div>
						{copy.subtitle ? (
							<div
								style={{
									display: "flex",
									marginTop: 28,
									fontFamily: "Geist",
									fontSize: 34,
									color: zinc700,
								}}
							>
								{copy.subtitle}
							</div>
						) : null}
					</div>
					<div style={{ display: "flex", height: 8 }} />
				</div>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					height: 92,
					padding: "0 76px",
					background: emerald950,
					color: emerald100,
					fontFamily: "Geist",
					fontSize: 28,
				}}
			>
				{copy.footer}
			</div>
		</div>
	);
}
