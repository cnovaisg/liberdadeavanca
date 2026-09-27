import manifestoService from "@/features/manifesto/services/manifesto.service";
import Manifesto from "@/features/manifesto/ui/manifesto.page";

const ManifestoPage = async () => {
	const manifesto = await manifestoService.getManifesto();
	return <Manifesto manifesto={manifesto} />;
};

export default ManifestoPage;
