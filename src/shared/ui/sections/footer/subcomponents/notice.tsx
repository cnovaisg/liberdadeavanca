const Notice = () => {
	const startYear = 2026;
	const currentYear = new Date().getFullYear();
	const yearSpan =
		currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;

	return (
		<div className="font-geist text-[9px] tracking-wide text-zinc-100" suppressHydrationWarning>
			© ${yearSpan} Carlos Novais. Todos os direitos reservados.
		</div>
	);
};

export default Notice;
