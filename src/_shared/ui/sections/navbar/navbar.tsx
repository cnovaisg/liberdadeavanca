import NavSegment from "./sub-components/nav-segment"
import SocialMediaSegment from "./sub-components/social-media-segment"

const Navbar = () => {
    return (
        <div className="w-full flex justify-between">
            <NavSegment />
            <SocialMediaSegment />
        </div>
    )
}

export default Navbar
