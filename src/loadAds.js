import loadJsonp from "./loadJsonp";
import settings from "./settings";

function loadAds(index = 0) {
    const url = settings.serviceUrl + "?ao=PICTURES&dam=0&od=down&p=10000%3A&s=Car&sb=doc&vc=Car&fe!=EXPORT&ps=" + index;
    return new Promise((resolve, reject) => {
        /*
         loadJsonp(url).then(
         ({ items }) => resolve(items.map(({ images: [ uri ] }) => uri))
         ).fail(reject)
         */
        const p = loadJsonp(url);
        p.then((data) => {
            console.log("[PH_LOG] data: ", JSON.stringify(data)); // PH_TODO: REMOVE
        });
    });
}

export default loadAds;
