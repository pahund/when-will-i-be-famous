/**
 * updater.js
 *
 * Given an update function, this creates a function that checks if the initial return value of the update function
 * has changed. If it has changed, the created function returns true, otherwise returns false.
 *
 * @author <a href="mailto:pahund@team.mobile.de">Patrick Hund</a>
 * @since 14 Sep 2015
 */
export default updatef => {
    let oldValue = updatef();
    return () => {
        let newValue = updatef();
        if (oldValue !== newValue) {
            oldValue = newValue;
            return true;
        }
        return false;
    };
};
