import addCar from "./addCar";
import addContainer from "./addContainer";
import delay from "./delay";
import scene from "./scene";
import settings from "./settings";

const container = addContainer(scene);

for (let i = 0; i < settings.numberOfThumbnails; i++) {
    delay((i * 30) + (Math.random() * 100), addCar)(container, i);
}
