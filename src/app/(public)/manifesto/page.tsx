import type { Metadata } from "next";
import { Manifesto, manifestoService } from "@/features/manifesto";
import { pageMetadata } from "@/shared/lib/seo";

export const metadata: Metadata = pageMetadata({
	title: "Manifesto",
	description: "Manifesto do movimento Liberdade Avança.",
	canonicalPath: "/manifesto",
});

const ManifestoPage = async () => {
	const manifesto = await manifestoService.getManifesto();
	return <Manifesto manifesto={manifesto} />;
};

export default ManifestoPage;
