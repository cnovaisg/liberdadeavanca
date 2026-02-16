import Banner from "./sub-components/banner";
import ImageContainer from "./sub-components/image-container";

const LandingPage = () => {
    return (
        <div className="relative flex w-full h-full shrink-0 justify-center">
            <Banner />
            <ImageContainer />
        </div>
    );
};

export default LandingPage;
