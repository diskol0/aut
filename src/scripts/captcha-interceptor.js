console.clear = () => console.log("Console was cleared");
const interval = setInterval(() => {
  if (window.turnstile) {
    clearInterval(interval);
    window.turnstile.render = (a, b) => {
      const params = {
        sitekey: b.sitekey,
        pageurl: window.location.href,
        data: b.cData,
        pagedata: b.chlPageData,
        action: b.action,
        userAgent: navigator.userAgent,
        json: 1,
      };
      // we will intercept the message in puppeteer
      console.log("intercepted-params:" + JSON.stringify(params));
      window.cfCallback = b.callback;
      return;
    };
  }
}, 50);
