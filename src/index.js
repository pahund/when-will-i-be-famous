import Thumbnail from "./nodes/Thumbnail";
import Logo from "./nodes/Logo";
import delay from "./delay";
import scene from "./scene";
import settings from "./settings";
import onResize from "./onResize";
import onScroll from "./onScroll";
import getViewportSize from "./getViewportSize";
import Dispatch from "famous/core/Dispatch";

Logo.addTo(scene);

for (let i = 0; i < settings.numberOfThumbnails; i++) {
    delay((i * 30) + (Math.random() * 100), Thumbnail.addTo)(scene, i);
}

onResize(() => Dispatch.dispatch("body", "VIEWPORT_RESIZE", getViewportSize()));

onScroll(() => Dispatch.dispatch("body", "VIEWPORT_SCROLL", window.pageYOffset));

