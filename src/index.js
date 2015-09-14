import Thumbnail from "./nodes/Thumbnail";
import Logo from "./nodes/Logo";
import delay from "./delay";
import scene from "./scene";
import settings from "./settings";
import onResize from "./onResize";
import getViewportSize from "./getViewportSize";
import Dispatch from "famous/core/Dispatch";

Logo.addTo(scene);

for (let i = 0; i < settings.numberOfThumbnails; i++) {
    delay((i * 30) + (Math.random() * 100), Thumbnail.addTo)(scene, i);
}

onResize(() => {
    const { w, h } = getViewportSize();
    Dispatch.dispatch("body", "VIEWPORT_RESIZE", { w, h });
});
