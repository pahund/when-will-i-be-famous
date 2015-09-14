/**
 * periodicChecker.js
 *
 * Given a predicate function and an interval in milliseconds (default 100), creates a function accepts two functions
 * as arguments, a success function and an always function. The predicate function is checked in the specified interval.
 * When the predicate returns false, the success function and always function are executed and the checking ceases.
 *
 * @author <a href="mailto:pahund@team.mobile.de">Patrick Hund</a>
 * @since 14 Sep 2015
 */
export default (predf, intervalMs = 100) => {
    return function checkf(successf, alwaysf) {
        window.setTimeout(() => {
            if (predf()) {
                checkf(successf, alwaysf);
                return;
            }
            successf();
            alwaysf();
        }, intervalMs);
    };
};
