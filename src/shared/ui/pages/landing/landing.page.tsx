import Banner from "./subcomponents/banner";
import ImageContainer from "./subcomponents/image-container";
import XFeed from "./subcomponents/x-feed";

const Landing = () => {
    return (
        <div className="relative flex w-full h-full shrink-0r">
            <Banner />
            <ImageContainer />
        </div>
    );
};

export default Landing;
