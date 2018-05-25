class PostResource {

    static get(post, params, cookies) {
        const opts = PostResource.getOpts(params, cookies);
        const postUrl = `https://boards.4chan.org/${post.board}/thread/${post.thread}#p${post.id}`;
        const res = post.file.meta.isVideo
                    ? PostResource.vid
                    : PostResource.img;

        return PostResource.link(postUrl, res(post, opts), true);
    }


    static getOpts(params, cookies) {
        const cookieSettingsKeys = [ 'autoplay', 'volume', 'loop' ];
        const cookieSettings = {};

        try {
            const rawSettings = cookies[ 'thread_puller_settings' ];

            Object.assign(cookieSettings, JSON.parse(rawSettings));
        } catch (e) {
        }

        // Override unset url params from settings
        cookieSettingsKeys.forEach(setting => {
            if (typeof cookieSettings[ setting ] === typeof undefined)
                return;

            params[ setting ] =
                (typeof params[ setting ] === typeof undefined)
                ? cookieSettings[ setting ]
                : params[ setting ];
        });

        const autoplay = !!params.autoplay;
        const loop = autoplay
                     || (
                         typeof params.loop !== typeof undefined
                         && params.loop !== 'no'
                         && params.loop !== '0'
                     );
        const volume = typeof params.volume !== typeof undefined
                       ? +params.volume
                       : 50;

        return { autoplay, loop, volume };
    }

    static link(url, name, newTab) {
        const newT = newTab ? `target="_blank" rel="noopener noreferrer"` : '';

        return `<a href="${url}" class="resource" ${newT}>${name}</a>`;
    }

    static img(post) {
        const mainURL = post.file.meta.fullSrc;
        const altUrl = post.file.meta.thumbSrc;

        const height = post.file.dimensions.main.height;
        const width = post.file.dimensions.main.width;

        const ratio = height && width ? height / width : 0;

        const load = ratio !== 0 ? `onloadstart="this.setAttribute('height', this.offsetWidth * ${ratio} + 'px');"` : '';

        //  onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }"
        return `<img src="${altUrl}" data-master-src="${mainURL}" ${load} onload="if(this.src !== this.dataset.masterSrc) { this.src = this.dataset.masterSrc }">`;
    }

    static vid(post, opts) {
        const url = post.file.meta.fullSrc;
        const autoplay = opts.autoplay ? ' autoplay muted="true"' : '';
        const loop = opts.loop ? ' loop' : '';
        const volume = opts.volume / 100;

        // noinspection JSUnusedGlobalSymbols
        return `<video controls ${autoplay + loop} onloadstart="this.volume=${volume}" onerror="console.log(this)"><source src="${url}"></video>`;
    }


}

module.exports = PostResource;