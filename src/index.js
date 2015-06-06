import addCar from "./addCar";
import delay from "./delay";

for (let i = 0; i < 100; i++) {
    delay((i * 30) + (Math.random() * 100), addCar)(i);
}

