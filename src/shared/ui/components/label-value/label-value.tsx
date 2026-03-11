type LabelValueProps = {
	label: string;
	value: string;
};
const LabelValue = ({label, value}: LabelValueProps) => {
	return (
		<div className="flex space-x-1 font-geist font-bold text-xs">
			<div className="small-caps text-zinc-500 tracking-widest">{label}</div>
			<div className="text-zinc-700">{value}</div>
		</div>
	);
};

export default LabelValue;
