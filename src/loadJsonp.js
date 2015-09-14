function loadJsonp(url) {
    const script = document.createElement("script");

    return new Promise((resolve, reject) => {
        let timeoutHandler = window.setTimeout(() => {
            window.jsonpCallback = () => {};
            reject();
        }, 3000);

        window.jsonpCallback = (data) => {
            window.clearTimeout(timeoutHandler);
            resolve(data);
        };

        script.src = url + "&_jsonp=jsonpCallback";
        document.getElementsByTagName("head")[0].appendChild(script);
    });
}

export default loadJsonp;
