import '../styles/global.scss';

import favicon from '../images/favicon.ico';
import faviconBlur from '../images/favicon-blur.ico';

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
        window.addEventListener('focus', () => this.faviconSet(favicon));
        window.addEventListener('blur', () => this.faviconSet(faviconBlur));
    }
}

App.faviconListener();
