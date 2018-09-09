const striptags = require('striptags');

class PostResource {

    static get(post, params, cookies) {
        const opts = PostResource.getOpts(params, cookies);
        const postUrl = `https://boards.4chan.org/${post.board}/thread/${post.thread}#p${post.id}`;
        const isVideo = post.file.meta.isVideo;

        const res = isVideo
                    ? PostResource.vid
                    : PostResource.img;
        const loading = isVideo
                        ? ''
                        : 'loading';

        return PostResource.link(
            {
                url: postUrl,
                html: res(post, opts),
                newTab: true,
                classList: [ loading ],
            },
        );
    }

    static sanitizedTitle(post) {
        const rawTitle =
                  (post.body.title || post.body.content || 'No title')
                      .replace(/<br>\s*(<br>)+/gi, '<br>');

        const strippedTitle = striptags(rawTitle, '<br>');

        const maxLen = 150;

        if (strippedTitle.length <= maxLen)
            return strippedTitle;

        const trimmedTitle = strippedTitle.substr(0, maxLen + 1);
        const lastSpace = Math.min(Math.max(0, trimmedTitle.lastIndexOf(' ')) || maxLen, maxLen);

        return trimmedTitle.substr(0, lastSpace) + '…';
    }

    static settingsCookieName() {
        return 'threadpuller_settings';
    }

    static getOpts(params, cookies) {
        const cookieSettingsKeys = [ 'autoplay', 'volume', 'loop' ];
        const cookieSettings = {};
        const rawSettings = cookies[ PostResource.settingsCookieName() ];

        if (typeof rawSettings !== typeof cookieSettings)
            try {
                Object.assign(cookieSettings, JSON.parse(rawSettings));
            } catch (e) {
            }
        else
            Object.assign(cookieSettings, rawSettings);

        // Override unset url params from settings
        cookieSettingsKeys.forEach(setting => {
            if (typeof cookieSettings[ setting ] === typeof undefined)
                return;

            if (typeof params[ setting ] === typeof undefined)
                params[ setting ] = cookieSettings[ setting ];
        });

        const autoplay = !!params.autoplay;
        const loop = (
            typeof params.loop !== typeof undefined
            && !!params.loop !== false
            && params.loop !== 'no'
            && params.loop !== '0'
        );
        const volume = typeof params.volume !== typeof undefined
                       ? +params.volume
                       : 50;

        return { autoplay, loop, volume };
    }

    static link({ url = '', html = '', newTab = false, classList = [] }) {
        const newT = newTab ? `target="_blank" rel="noopener noreferrer"` : '';

        return `<a href="${url}" class="resource ${classList.join(' ')}" ${newT}>${html}</a>`;
    }

    static img(post) {
        const mainURL = post.file.meta.fullSrc;
        const altUrl = post.file.meta.thumbSrc;

        const height = post.file.dimensions.main.height;
        const width = post.file.dimensions.main.width;

        const ratio = height && width ? height / width : 0;

        const load = ratio !== 0 ? `onloadstart="this.setAttribute('height', this.offsetWidth * ${ratio} + 'px');"` : '';

        //  onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }"
        return `<img src="${altUrl}" data-master-src="${mainURL}" ${load} onload="if(this.src !== this.dataset.masterSrc) { this.src = this.dataset.masterSrc } else { this.parentElement.classList.remove('loading') }">`;
    }

    static vid(post, opts) {
        const url = post.file.meta.fullSrc;
        const autoplay = opts.autoplay ? ' autoplay' : '';
        const loop = opts.loop ? ' loop' : '';
        const volume = opts.volume / 100;

        // noinspection JSUnusedGlobalSymbols
        return `<video controls ${autoplay + loop} onloadstart="this.volume=${volume}" preload="none" poster="${post.file.meta.thumbSrc}"><source src="${url}"></video>`;
    }


}

module.exports = PostResource;
