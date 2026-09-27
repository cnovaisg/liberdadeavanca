import { Manifesto, manifestoService } from "@/features/manifesto";

const ManifestoPage = async () => {
	const manifesto = await manifestoService.getManifesto();
	return <Manifesto manifesto={manifesto} />;
};

export default ManifestoPage;
