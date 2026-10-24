type LabelValueProps = {
	label: string;
	value: string;
	/** When set, the value is a date and exposed to assistive tech as `<time>`. */
	dateTime?: string;
};
const LabelValue = ({ label, value, dateTime }: LabelValueProps) => {
	return (
		<div className="flex space-x-1 font-geist font-bold text-xs">
			<div className="small-caps text-zinc-500 tracking-widest">{label}</div>
			{dateTime ? (
				<time dateTime={dateTime} className="text-zinc-700">
					{value}
				</time>
			) : (
				<div className="text-zinc-700">{value}</div>
			)}
		</div>
	);
};

export default LabelValue;
