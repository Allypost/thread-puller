class App {
    static faviconSet(href) {
        const existingIcon = document.querySelector('link[rel*=\'icon\']');
        if (existingIcon)
            return existingIcon.href = href;

        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = href;
        document.querySelector('head').appendChild(link);
    }

    static faviconListener() {
        window.addEventListener('focus', () => this.faviconSet('/favicon.ico'));
        window.addEventListener('blur', () => this.faviconSet('/favicon-blur.ico'));
    }
}

App.faviconListener();
