import Image from "next/image";

const ImageContainer = () => {
    return (
        <div className="absolute bottom-0 right-0 w-[81%] h-[81%] z-10 pointer-events-none">
            <Image
                src="/images/path.png"
                alt="Landscape"
                fill
                className="object-cover"
            />
        </div>

    );
};

export default ImageContainer;
