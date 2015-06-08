import ScrollBox from "./nodes/ScrollBox";
import Thumbnail from "./nodes/Thumbnail";
import Logo from "./nodes/Logo";
import delay from "./delay";
import scene from "./scene";
import settings from "./settings";

const scrollBox = ScrollBox.add(scene);

Logo.add(scene);

for (let i = 0; i < settings.numberOfThumbnails; i++) {
    delay((i * 30) + (Math.random() * 100), Thumbnail.add)(scrollBox, i);
}
