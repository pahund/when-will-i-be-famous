import ScrollBox from "./nodes/ScrollBox";
import Thumbnail from "./nodes/Thumbnail";
import Logo from "./nodes/Logo";
import delay from "./delay";
import scene from "./scene";
import settings from "./settings";
import onResize from "./onResize";
import getViewportSize from "./getViewportSize";

const scrollBox = ScrollBox.addTo(scene);

Logo.addTo(scene);

for (let i = 0; i < settings.numberOfThumbnails; i++) {
    delay((i * 30) + (Math.random() * 100), Thumbnail.addTo)(scrollBox, i);
}

onResize(() => {
    const { w, h } = getViewportSize();
    scene.onReceive("CONTEXT_RESIZE", [ w, h ]);
    scene.getDispatch().dispatch("VIEWPORT_RESIZE", { w, h });
});
