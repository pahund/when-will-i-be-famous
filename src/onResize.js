import getViewportSize from "./getViewportSize";
import periodicChecker from "./util/periodicChecker";

function updater(updatef) {
    let oldValue = updatef();
    return () => {
        let newValue = updatef();
        if (oldValue !== newValue) {
            oldValue = newValue;
            return true;
        }
        return false;
    };
}

function onResize(...actions) {
    const heightUpdater = updater(() => getViewportSize().h),
        widthUpdater = updater(() => getViewportSize().w),
        resizeChecker = periodicChecker(() => widthUpdater() || heightUpdater());

    (function startf() {
        window.onresize = () => {
            window.onresize = null;
            resizeChecker(() => actions.forEach(action => action()), startf);
        };
    }());
}

export default onResize;
