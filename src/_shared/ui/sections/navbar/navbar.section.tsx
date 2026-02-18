import NavSegment from "./subcomponents/nav.segment"
import SocialMediaSegment from "./subcomponents/social-media.segment"

const Navbar = () => {
    return (
        <div className="w-full flex justify-between">
            <NavSegment />
            <SocialMediaSegment />
        </div>
    )
}

export default Navbar
