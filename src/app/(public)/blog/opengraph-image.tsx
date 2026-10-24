// This segment sets its own `openGraph`, which replaces inherited images.
// Re-export the root card so /blog still gets the site image.
export { alt, contentType, default, size } from "../../opengraph-image";
