/**
 * onScroll.js
 *
 * @author <a href="mailto:pahund@team.mobile.de">Patrick Hund</a>
 * @since 14 Sep 2015
 */
import periodicChecker from "./util/periodicChecker";
import updater from "./util/updater";

export default (...actions) => {
    const yUpdater = updater(() => window.pageYOffset),
        scrollChecker = periodicChecker(yUpdater);

    (function startf() {
        window.onscroll = () => {
            window.onscroll = null;
            scrollChecker(() => actions.forEach(action => action()), startf);
        };
    }());
};

