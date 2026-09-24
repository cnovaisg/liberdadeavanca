export type IconProps = {
	scale?: number;
	color?: string;
};

export const WithScaleAndColor = (pathD: string) => {
	const Icon = ({ scale = 1, color = "currentColor" }: IconProps) => {
		const size = 24 * scale;

		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={size}
				height={size}
				viewBox="0 -960 960 960"
				fill={color}
				aria-hidden="true"
			>
				<path d={pathD} />
			</svg>
		);
	};

	return Icon;
};
