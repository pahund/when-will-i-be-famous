function delay(ms, func) {
    return (args) => window.setTimeout(() => func.apply(null, args), ms);
}

export default delay;
